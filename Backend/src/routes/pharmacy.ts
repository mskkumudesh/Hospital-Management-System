import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import { one, rows, run } from '../db.js';

const router = Router();

/** Take stock out; returns false if there is not enough. */
async function takeStock(medicineId: unknown, qty: unknown) {
  const r = await run('UPDATE medicines SET stock_qty = stock_qty - ? WHERE id = ? AND stock_qty >= ?', [
    qty,
    medicineId,
    qty,
  ]);
  return r.affectedRows > 0;
}

router.post('/pharmacy/dispense', authorize('pharmacist'), async (req, res) => {
  const { medicine_id, qty } = req.body;
  if (!(await takeStock(medicine_id, qty))) return res.status(400).json({ error: 'Not enough stock.' });
  res.json({ ok: true });
});

router.get('/pharmacy/alerts', authorize('pharmacist', 'doctor'), async (_req, res) => {
  res.json({
    low: await rows('SELECT * FROM medicines WHERE stock_qty <= reorder_level'),
    expiring: await rows('SELECT * FROM medicines WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)'),
  });
});

// The pharmacist dispenses what the doctor prescribed
router.post('/prescriptions/:id/dispense', authorize('pharmacist'), async (req, res) => {
  const item = await one('SELECT * FROM prescription_items WHERE id = ? AND dispensed = 0', [req.params.id]);
  if (!item) return res.status(400).json({ error: 'Already dispensed or not found.' });
  if (!(await takeStock(item.medicine_id, item.qty))) return res.status(400).json({ error: 'Not enough stock.' });
  await run('UPDATE prescription_items SET dispensed = 1 WHERE id = ?', [item.id]);
  res.json({ ok: true });
});

export default router;
