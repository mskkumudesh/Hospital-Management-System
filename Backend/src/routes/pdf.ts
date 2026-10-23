import { Router } from 'express';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { authorize } from '../middleware/auth.js';
import { one, rows } from '../db.js';
import { BILLING, CLINICAL } from '../roles.js';

const router = Router();

function sendPdf(res: Response, title: string, lines: string[]) {
  const doc = new PDFDocument({ margin: 50 });
  res.type('pdf');
  doc.pipe(res);
  doc.fontSize(20).text(title).moveDown();
  doc.fontSize(12);
  lines.forEach((line) => doc.text(line).moveDown(0.3));
  doc.end();
}

router.get('/records/:id/pdf', authorize(...CLINICAL), async (req, res) => {
  const r = await one(
    `SELECT m.*, p.full_name patient, p.dob, d.full_name doctor FROM medical_records m
       JOIN patients p ON p.id = m.patient_id
       LEFT JOIN doctors d ON d.id = m.doctor_id WHERE m.id = ?`,
    [req.params.id],
  );
  if (!r) return res.status(404).json({ error: 'Record not found.' });
  sendPdf(res, 'Medical report', [
    `Patient: ${r.patient} (DOB ${r.dob || '-'})`,
    `Doctor: ${r.doctor || '-'}`,
    `Date: ${r.created_at}`,
    `Diagnosis: ${r.diagnosis || ''}`,
    `Prescription: ${r.prescription || ''}`,
    `Treatment: ${r.treatment || ''}`,
  ]);
});

router.get('/lab-requests/:id/pdf', authorize('doctor', 'nurse', 'lab'), async (req, res) => {
  const r = await one(
    `SELECT l.*, p.full_name patient, t.name test FROM lab_requests l
       JOIN patients p ON p.id = l.patient_id
       JOIN lab_tests t ON t.id = l.test_id WHERE l.id = ?`,
    [req.params.id],
  );
  if (!r) return res.status(404).json({ error: 'Request not found.' });
  sendPdf(res, 'Laboratory report', [
    `Patient: ${r.patient}`,
    `Test: ${r.test}`,
    `Requested: ${r.requested_at}`,
    `Status: ${r.status}`,
    `Result: ${r.result || 'Pending'}`,
  ]);
});

const getInvoice = (id: string) =>
  one('SELECT i.*, p.full_name patient FROM invoices i JOIN patients p ON p.id = i.patient_id WHERE i.id = ?', [id]);

router.get('/invoices/:id/pdf', authorize(...BILLING), async (req, res) => {
  const inv = await getInvoice(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found.' });
  const items = await rows('SELECT * FROM invoice_items WHERE invoice_id = ?', [inv.id]);
  sendPdf(res, 'Invoice #' + inv.id, [
    `Patient: ${inv.patient}`,
    ...items.map((i) => `${i.type} - ${i.description}: ${Number(i.amount).toFixed(2)}`),
    `Total: ${inv.total}   Paid: ${inv.paid}   Status: ${inv.status}`,
  ]);
});

router.get('/invoices/:id/receipt', authorize(...BILLING), async (req, res) => {
  const inv = await getInvoice(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found.' });
  const payments = await rows('SELECT * FROM payments WHERE invoice_id = ? ORDER BY id', [inv.id]);
  sendPdf(res, 'Payment receipt #' + inv.id, [
    `Patient: ${inv.patient}`,
    ...payments.map((p) => `${p.paid_at}  ${p.method}  ${Number(p.amount).toFixed(2)}`),
    `Total billed: ${inv.total}`,
    `Total paid: ${inv.paid}`,
    `Balance: ${(inv.total - inv.paid).toFixed(2)}`,
  ]);
});

export default router;
