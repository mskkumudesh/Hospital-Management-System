import { Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { config } from '../config.js';
import { authorize } from '../middleware/auth.js';
import { one, rows, run } from '../db.js';
import { CLINICAL, FRONT_DESK } from '../roles.js';

const router = Router();

// Uploaded files live outside any public folder
fs.mkdirSync(config.uploadDir, { recursive: true });
const upload = multer({ dest: config.uploadDir, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/patients/:id/history', authorize(...CLINICAL), async (req, res) => {
  const id = req.params.id;
  res.json({
    records: await rows('SELECT * FROM medical_records WHERE patient_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [id]),
    labs: await rows('SELECT l.*, t.name test FROM lab_requests l JOIN lab_tests t ON t.id = l.test_id WHERE patient_id = ?', [id]),
  });
});

router.post('/patients/:id/documents', authorize(...FRONT_DESK), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose a file to upload.' });
  await run('INSERT INTO patient_documents SET ?', [
    { patient_id: req.params.id, file_name: req.file.originalname, file_path: req.file.path, uploaded_by: req.user.id },
  ]);
  res.status(201).json({ ok: true });
});

router.get('/patients/:id/documents', authorize(...FRONT_DESK, 'lab'), async (req, res) => {
  res.json(await rows('SELECT id, file_name, created_at FROM patient_documents WHERE patient_id = ? ORDER BY id DESC', [req.params.id]));
});

router.get('/documents/:id/download', authorize(...FRONT_DESK, 'lab'), async (req, res) => {
  const doc = await one('SELECT * FROM patient_documents WHERE id = ?', [req.params.id]);
  if (!doc) return res.status(404).json({ error: 'File not found.' });
  res.download(path.resolve(doc.file_path), doc.file_name);
});

export default router;
