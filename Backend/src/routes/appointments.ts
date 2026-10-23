import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import { one, rows, run } from '../db.js';
import { FRONT_DESK } from '../roles.js';

const router = Router();

/** True if the doctor has a schedule but not at this time. */
async function outsideWorkingHours(doctorId: unknown, at: unknown) {
  const when = String(at).replace('T', ' ');
  const s = await one(
    `SELECT COUNT(*) n,
            COALESCE(SUM(weekday = DAYNAME(?) AND TIME(?) BETWEEN start_time AND end_time), 0) ok
       FROM doctor_schedules WHERE doctor_id = ?`,
    [when, when, doctorId],
  );
  return s!.n > 0 && Number(s!.ok) === 0;
}

async function slotTaken(doctorId: unknown, at: unknown, ignoreId: unknown = 0) {
  const clash = await one(
    "SELECT id FROM appointments WHERE doctor_id = ? AND scheduled_at = ? AND status = 'booked' AND id <> ?",
    [doctorId, at, ignoreId],
  );
  return Boolean(clash);
}

const NOT_WORKING = 'That doctor does not work at this time. Check the doctor schedule.';

router.get('/', authorize(...FRONT_DESK), async (_req, res) => {
  res.json(
    await rows(
      `SELECT a.*, p.full_name patient, d.full_name doctor
         FROM appointments a
         JOIN patients p ON p.id = a.patient_id
         JOIN doctors d ON d.id = a.doctor_id
        ORDER BY scheduled_at DESC LIMIT 200`,
    ),
  );
});

router.post('/', authorize('receptionist', 'nurse'), async (req, res) => {
  const { patient_id, doctor_id, scheduled_at, notes } = req.body;
  if (await outsideWorkingHours(doctor_id, scheduled_at)) return res.status(400).json({ error: NOT_WORKING });
  if (await slotTaken(doctor_id, scheduled_at)) {
    return res.status(409).json({ error: 'That doctor already has an appointment at this time.' });
  }
  const result = await run('INSERT INTO appointments SET ?', [{ patient_id, doctor_id, scheduled_at, notes }]);
  res.status(201).json({ id: result.insertId });
});

router.patch('/:id', authorize('receptionist', 'nurse', 'doctor'), async (req, res) => {
  const { status, scheduled_at } = req.body;
  const { id } = req.params;
  if (scheduled_at) {
    const appt = await one('SELECT doctor_id FROM appointments WHERE id = ?', [id]);
    if (!appt) return res.status(404).json({ error: 'Appointment not found.' });
    if (await outsideWorkingHours(appt.doctor_id, scheduled_at)) return res.status(400).json({ error: NOT_WORKING });
    if (await slotTaken(appt.doctor_id, scheduled_at, id)) {
      return res.status(409).json({ error: 'That time slot is taken.' });
    }
    await run('UPDATE appointments SET scheduled_at = ? WHERE id = ?', [scheduled_at, id]);
  }
  if (status) await run('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
  res.json({ ok: true });
});

export default router;
