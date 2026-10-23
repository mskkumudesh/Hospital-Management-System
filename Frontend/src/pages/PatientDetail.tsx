import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api, openFile, session } from '../api';
import type { Row } from '../types';

const CAN_UPLOAD = ['admin', 'receptionist', 'nurse', 'doctor'];

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Row | null>(null);
  const [history, setHistory] = useState<{ records: Row[]; labs: Row[] } | null>(null);
  const [documents, setDocuments] = useState<Row[]>([]);
  const [error, setError] = useState('');

  const load = () => {
    api<Row>(`/patients/${id}`).then(setPatient).catch((e) => setError(e.message));
    api(`/patients/${id}/history`).then(setHistory).catch(() => setHistory(null)); // only doctors and nurses may see this
    api<Row[]>(`/patients/${id}/documents`).then(setDocuments).catch(() => {});
  };
  useEffect(load, [id]);

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    try {
      await api(`/patients/${id}/documents`, { method: 'POST', body });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!patient) return <p>{error || 'Loading…'}</p>;
  const canUpload = CAN_UPLOAD.includes(session.get()?.user.role ?? '');

  return (
    <section className="space-y-6">
      <div>
        <a href="/patients" className="text-sm underline">Back to patients</a>
        <h1 className="text-2xl font-semibold">{patient.full_name}</h1>
        <p className="text-sm text-ink/70">
          {[patient.gender, patient.dob, patient.blood_group, patient.phone].filter(Boolean).join(', ')}
        </p>
      </div>
      {error && <p role="alert" className="text-alert">{error}</p>}

      <div>
        <h2 className="mb-2 text-lg font-semibold">Medical history</h2>
        {!history ? (
          <p className="text-sm text-ink/60">Medical history is visible to doctors and nurses only.</p>
        ) : (
          <>
            {history.records.map((r) => (
              <article key={r.id} className="mb-2 rounded-lg border border-ink/10 bg-white p-3 text-sm">
                <p className="text-ink/60">{r.created_at}</p>
                <p><b>Diagnosis:</b> {r.diagnosis}</p>
                <p><b>Prescription:</b> {r.prescription}</p>
                <p><b>Treatment:</b> {r.treatment}</p>
              </article>
            ))}
            {history.labs.map((l) => (
              <p key={l.id} className="text-sm">Lab: {l.test} ({l.status}) {l.result}</p>
            ))}
            {!history.records.length && !history.labs.length && (
              <p className="text-sm text-ink/60">No records yet. Doctors can add one under Medical records.</p>
            )}
          </>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Documents</h2>
        {canUpload && <input type="file" onChange={upload} aria-label="Upload document" className="mb-2 text-sm" />}
        <ul className="text-sm">
          {documents.map((d) => (
            <li key={d.id}>
              <button className="underline" onClick={() => openFile(`/documents/${d.id}/download`)}>{d.file_name}</button>{' '}
              <span className="text-ink/60">{d.created_at}</span>
            </li>
          ))}
        </ul>
        {!documents.length && <p className="text-sm text-ink/60">No documents uploaded yet.</p>}
      </div>
    </section>
  );
}
