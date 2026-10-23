import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import { one, rows, run } from '../db.js';

const router = Router();

// ---------- Dashboard ----------
const count = async (sql: string) => (await one(sql))!.n;

router.get('/dashboard', async (_req, res) => {
  res.json({
    patients: await count('SELECT COUNT(*) n FROM patients WHERE deleted_at IS NULL'),
    todayAppointments: await count('SELECT COUNT(*) n FROM appointments WHERE DATE(scheduled_at) = CURDATE()'),
    revenue: await count('SELECT COALESCE(SUM(amount), 0) n FROM payments'),
    labPending: await count("SELECT COUNT(*) n FROM lab_requests WHERE status <> 'completed'"),
    pharmacyAlerts: await count(
      'SELECT COUNT(*) n FROM medicines WHERE stock_qty <= reorder_level OR expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)',
    ),
  });
});

// ---------- Reports ----------
const REPORTS: Record<string, string> = {
  revenue: 'SELECT DATE(paid_at) day, SUM(amount) total FROM payments GROUP BY day ORDER BY day DESC LIMIT 30',
  patients: 'SELECT gender, COUNT(*) total FROM patients WHERE deleted_at IS NULL GROUP BY gender',
  appointments: 'SELECT status, COUNT(*) total FROM appointments GROUP BY status',
  pharmacy: 'SELECT name, stock_qty, reorder_level, expiry_date FROM medicines ORDER BY stock_qty',
  laboratory: `SELECT t.name test, l.status, COUNT(*) total FROM lab_requests l
                 JOIN lab_tests t ON t.id = l.test_id GROUP BY t.name, l.status`,
  staff: 'SELECT position, COUNT(*) total FROM employees GROUP BY position',
};

router.get('/reports/audit', authorize(), async (_req, res) => {
  res.json(
    await rows('SELECT a.*, u.username FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 200'),
  );
});

router.get('/reports/:name', authorize('accountant'), async (req, res) => {
  const sql = REPORTS[req.params.name];
  if (!sql) return res.status(404).json({ error: 'Unknown report.' });
  res.json(await rows(sql));
});

// ---------- Account ----------
router.post('/auth/change-password', async (req, res) => {
  const user = await one('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!user || !(await bcrypt.compare(req.body.current || '', user.password_hash))) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }
  await run('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(req.body.next, 10), req.user.id]);
  res.json({ ok: true });
});

// ---------- User management (admin only) ----------
router.get('/roles', async (_req, res) => {
  res.json(await rows('SELECT * FROM roles'));
});

router.get('/users', authorize(), async (_req, res) => {
  res.json(
    await rows(
      `SELECT u.id, u.username, u.full_name, u.role_id, r.name role, u.is_active, u.last_login
         FROM users u JOIN roles r ON r.id = u.role_id ORDER BY u.id`,
    ),
  );
});

router.post('/users', authorize(), async (req, res) => {
  const { username, password, full_name, role_id } = req.body;
  if (!username || !password || password.length < 8 || !role_id) {
    return res.status(400).json({ error: 'Username, role and a password of at least 8 characters are required.' });
  }
  try {
    const result = await run('INSERT INTO users SET ?', [
      { username, full_name, role_id, password_hash: await bcrypt.hash(password, 10) },
    ]);
    res.status(201).json({ id: result.insertId });
  } catch (e: any) {
    e.code === 'ER_DUP_ENTRY'
      ? res.status(409).json({ error: 'That username is already taken.' })
      : res.status(500).json({ error: 'Could not create user.' });
  }
});

router.put('/users/:id', authorize(), async (req, res) => {
  const changes: Record<string, unknown> = {};
  for (const key of ['full_name', 'role_id', 'is_active']) {
    if (req.body[key] !== undefined && req.body[key] !== '') changes[key] = req.body[key];
  }
  if (req.body.password) {
    if (req.body.password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    changes.password_hash = await bcrypt.hash(req.body.password, 10);
  }
  if (Object.keys(changes).length) await run('UPDATE users SET ? WHERE id = ?', [changes, req.params.id]);
  res.json({ ok: true });
});

export default router;
