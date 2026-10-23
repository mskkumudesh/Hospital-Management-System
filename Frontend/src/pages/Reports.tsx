import { useEffect, useState } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';
import { ErrorText, PageHeader } from '../components/ui';
import type { Row } from '../types';

const REPORTS = ['patients', 'appointments', 'revenue', 'pharmacy', 'laboratory', 'staff'];

export default function Reports() {
  const [name, setName] = useState('patients');
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api<Row[]>('/reports/' + name).then(setRows).catch((e) => setError(e.message));
  }, [name]);

  return (
    <section>
      <PageHeader title="Reports">
        <select className="inp w-48" aria-label="Report" value={name} onChange={(e) => setName(e.target.value)}>
          {REPORTS.map((r) => (
            <option key={r} value={r}>{r} report</option>
          ))}
        </select>
        <button className="btn-ghost" onClick={() => print()}>Print</button>
      </PageHeader>
      <ErrorText>{error}</ErrorText>
      <DataTable columns={rows[0] ? Object.keys(rows[0]) : []} rows={rows} empty="No data for this report yet." />
    </section>
  );
}
