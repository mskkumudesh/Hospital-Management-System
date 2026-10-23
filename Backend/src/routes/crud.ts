import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import { one, rows, run, Row } from '../db.js';
import type { Role } from '../roles.js';

// Extra columns + joins so list screens show names instead of ids.
const withPatientDoctor = {
  select: 't.*, p.full_name patient, d.full_name doctor',
  joins: 'LEFT JOIN patients p ON p.id=t.patient_id LEFT JOIN doctors d ON d.id=t.doctor_id',
};
const withDepartment = {
  select: 't.*, g.name department',
  joins: 'LEFT JOIN departments g ON g.id=t.department_id',
};
const withEmployee = {
  select: 't.*, e.full_name employee',
  joins: 'LEFT JOIN employees e ON e.id=t.employee_id',
};
const VIEWS: Record<string, { select: string; joins: string }> = {
  medical_records: withPatientDoctor,
  admissions: withPatientDoctor,
  doctors: withDepartment,
  employees: withDepartment,
  attendance: withEmployee,
  leave_records: withEmployee,
  lab_requests: {
    select: 't.*, p.full_name patient, x.name test',
    joins: 'LEFT JOIN patients p ON p.id=t.patient_id LEFT JOIN lab_tests x ON x.id=t.test_id',
  },
  doctor_schedules: {
    select: 't.*, d.full_name doctor',
    joins: 'LEFT JOIN doctors d ON d.id=t.doctor_id',
  },
  prescription_items: {
    select: 't.*, p.full_name patient, m.name medicine',
    joins: 'LEFT JOIN patients p ON p.id=t.patient_id LEFT JOIN medicines m ON m.id=t.medicine_id',
  },
};

interface CrudOptions {
  fields: string[]; // columns that may be written
  read: Role[];
  write: Role[];
  search?: string[]; // columns matched by ?search=
  softDelete?: boolean;
  order?: string;
}

/** Standard list / get / create / update / delete routes for one table. */
export function crud(table: string, opts: CrudOptions) {
  const { fields, read, write, search = [], softDelete = false, order = 'id DESC' } = opts;
  const { select, joins } = VIEWS[table] ?? { select: 't.*', joins: '' };
  const notDeleted = softDelete ? 't.deleted_at IS NULL' : '1=1';
  const router = Router();

  // keep only known, non-empty fields from the request body
  const pick = (body: Row) =>
    Object.fromEntries(fields.filter((f) => body[f] !== undefined && body[f] !== '').map((f) => [f, body[f]]));

  router.get('/', authorize(...read), async (req, res) => {
    const where = [notDeleted];
    const params: unknown[] = [];
    const term = req.query.search;
    if (term && search.length) {
      where.push('(' + search.map((c) => `t.${c} LIKE ?`).join(' OR ') + ')');
      params.push(...search.map(() => `%${term}%`));
    }
    if (req.query.patient_id) {
      where.push('t.patient_id = ?');
      params.push(req.query.patient_id);
    }
    res.json(
      await rows(
        `SELECT ${select} FROM ${table} t ${joins} WHERE ${where.join(' AND ')} ORDER BY t.${order} LIMIT 200`,
        params,
      ),
    );
  });

  router.get('/:id', authorize(...read), async (req, res) => {
    const row = await one(`SELECT ${select} FROM ${table} t ${joins} WHERE t.id = ? AND ${notDeleted}`, [req.params.id]);
    row ? res.json(row) : res.status(404).json({ error: 'Record not found.' });
  });

  router.post('/', authorize(...write), async (req, res) => {
    const data = pick(req.body);
    if (!Object.keys(data).length) return res.status(400).json({ error: 'No data provided.' });
    const result = await run(`INSERT INTO ${table} SET ?`, [data]);
    res.status(201).json({ id: result.insertId, ...data });
  });

  router.put('/:id', authorize(...write), async (req, res) => {
    await run(`UPDATE ${table} SET ? WHERE id = ?`, [pick(req.body), req.params.id]);
    res.json({ ok: true });
  });

  router.delete('/:id', authorize(), async (req, res) => {
    if (softDelete) await run(`UPDATE ${table} SET deleted_at = NOW() WHERE id = ?`, [req.params.id]);
    else await run(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  });

  return router;
}
