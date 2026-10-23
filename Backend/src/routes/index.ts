import { Router } from 'express';
import { CLINICAL, FRONT_DESK } from '../roles.js';
import admin from './admin.js';
import appointments from './appointments.js';
import billing from './billing.js';
import { crud } from './crud.js';
import patients from './patients.js';
import pdf from './pdf.js';
import pharmacy from './pharmacy.js';

const router = Router();

// Simple tables: who may read, who may write (empty list = admin only)
router.use('/patients', crud('patients', {
  fields: ['full_name', 'dob', 'gender', 'phone', 'address', 'blood_group', 'emergency_contact'],
  search: ['full_name', 'phone'],
  read: [...FRONT_DESK, 'lab', 'accountant'],
  write: ['receptionist', 'nurse'],
  softDelete: true,
}));
router.use('/doctors', crud('doctors', {
  fields: ['full_name', 'department_id', 'specialization', 'consultation_fee', 'schedule', 'phone'],
  search: ['full_name', 'specialization'],
  read: [...FRONT_DESK, 'accountant'],
  write: [],
}));
router.use('/departments', crud('departments', {
  fields: ['name'],
  read: ['receptionist', 'nurse', 'doctor', 'lab', 'pharmacist', 'accountant'],
  write: [],
  order: 'name',
}));
router.use('/schedules', crud('doctor_schedules', {
  fields: ['doctor_id', 'weekday', 'start_time', 'end_time'],
  read: FRONT_DESK,
  write: [],
}));
router.use('/records', crud('medical_records', {
  fields: ['patient_id', 'doctor_id', 'diagnosis', 'prescription', 'treatment'],
  read: CLINICAL,
  write: ['doctor'],
  softDelete: true,
}));
router.use('/admissions', crud('admissions', {
  fields: ['patient_id', 'doctor_id', 'ward', 'bed_no', 'admitted_at', 'discharged_at', 'daily_charge'],
  read: FRONT_DESK,
  write: ['receptionist', 'nurse'],
}));
router.use('/lab-tests', crud('lab_tests', {
  fields: ['name', 'price'],
  read: ['doctor', 'lab', 'receptionist'],
  write: ['lab'],
}));
router.use('/lab-requests', crud('lab_requests', {
  fields: ['patient_id', 'test_id', 'status', 'result'],
  read: ['doctor', 'nurse', 'lab'],
  write: ['doctor', 'lab'],
}));
router.use('/medicines', crud('medicines', {
  fields: ['name', 'unit_price', 'stock_qty', 'reorder_level', 'expiry_date'],
  search: ['name'],
  read: ['doctor', 'pharmacist'],
  write: ['pharmacist'],
  order: 'name',
}));
router.use('/prescriptions', crud('prescription_items', {
  fields: ['patient_id', 'medicine_id', 'qty', 'instructions'],
  read: ['doctor', 'nurse', 'pharmacist'],
  write: ['doctor'],
}));
router.use('/employees', crud('employees', {
  fields: ['full_name', 'department_id', 'position', 'hire_date', 'phone'],
  search: ['full_name', 'position'],
  read: [],
  write: [],
}));
router.use('/attendance', crud('attendance', { fields: ['employee_id', 'day', 'status'], read: [], write: [] }));
router.use('/leaves', crud('leave_records', {
  fields: ['employee_id', 'from_date', 'to_date', 'reason'],
  read: [],
  write: [],
}));

// Routes with their own logic
router.use('/appointments', appointments);
router.use('/invoices', billing);
router.use(pdf);
router.use(patients);
router.use(pharmacy);
router.use(admin);

export default router;
