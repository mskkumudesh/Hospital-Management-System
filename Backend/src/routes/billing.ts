import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import { rows, run } from '../db.js';
import { BILLING } from '../roles.js';

const router = Router();
router.use(authorize(...BILLING));


/** Where unbilled charges come from. Each query returns id, amt and n (a name for the description). */
const CHARGE_SOURCES = [
  {
    table: 'appointments',
    type: 'consultation',
    label: (n: string) => 'Consultation with ' + n,
    sql: `SELECT a.id, d.consultation_fee amt, d.full_name n FROM appointments a
            JOIN doctors d ON d.id = a.doctor_id
           WHERE a.patient_id = ? AND a.status = 'completed' AND a.billed = 0`,
  },
  {
    table: 'lab_requests',
    type: 'laboratory',
    label: (n: string) => 'Lab: ' + n,
    sql: `SELECT l.id, t.price amt, t.name n FROM lab_requests l
            JOIN lab_tests t ON t.id = l.test_id
           WHERE l.patient_id = ? AND l.status = 'completed' AND l.billed = 0`,
  },
  {
    table: 'prescription_items',
    type: 'pharmacy',
    label: (n: string) => 'Medicine: ' + n,
    sql: `SELECT i.id, i.qty * m.unit_price amt, CONCAT(m.name, ' x', i.qty) n FROM prescription_items i
            JOIN medicines m ON m.id = i.medicine_id
           WHERE i.patient_id = ? AND i.dispensed = 1 AND i.billed = 0`,
  },
  {
    table: 'admissions',
    type: 'admission',
    label: (n: string) => 'Admission: ' + n,
    sql: `SELECT id, GREATEST(DATEDIFF(discharged_at, admitted_at), 1) * daily_charge amt,
                 CONCAT(ward, ' bed ', bed_no) n
            FROM admissions
           WHERE patient_id = ? AND discharged_at IS NOT NULL AND billed = 0`,
  },
];

async function createInvoice(
  patientId: unknown,
  items: { type: string; description: string; amount: number }[],
) {
  const total = items.reduce((sum, i) => sum + Number(i.amount), 0);
  const invoice = await run('INSERT INTO invoices(patient_id, total) VALUES(?, ?)', [patientId, total]);
  for (const i of items) await run('INSERT INTO invoice_items SET ?', [{ invoice_id: invoice.insertId, ...i }]);
  return { id: invoice.insertId, total };
}

router.get('/', async (_req, res) => {
  res.json(
    await rows(
      `SELECT i.*, p.full_name patient FROM invoices i
         JOIN patients p ON p.id = i.patient_id ORDER BY i.id DESC LIMIT 200`,
    ),
  );
});

router.post('/', async (req, res) => {
  const { patient_id, items = [] } = req.body;
  res.status(201).json(await createInvoice(patient_id, items));
});

// Automatic billing: collect every unbilled charge for a patient
router.post('/auto', async (req, res) => {
  const patientId = req.body.patient_id;
  const found: { table: string; id: number; type: string; description: string; amount: number }[] = [];

  for (const src of CHARGE_SOURCES) {
    for (const row of await rows(src.sql, [patientId])) {
      found.push({ table: src.table, id: row.id, type: src.type, description: src.label(row.n), amount: row.amt });
    }
  }
  if (!found.length) return res.status(400).json({ error: 'No unbilled charges for this patient.' });

  const invoice = await createInvoice(patientId, found);
  for (const c of found) await run(`UPDATE ${c.table} SET billed = 1 WHERE id = ?`, [c.id]);
  res.status(201).json(invoice);
});

router.post('/:id/payments', async (req, res) => {
  const { amount, method } = req.body;
  const { id } = req.params;
  await run('INSERT INTO payments SET ?', [{ invoice_id: id, amount, method, received_by: req.user.id }]);
  await run("UPDATE invoices SET paid = paid + ?, status = IF(paid >= total, 'paid', 'partial') WHERE id = ?", [
    amount,
    id,
  ]);
  res.json({ ok: true });
});

export default router;
