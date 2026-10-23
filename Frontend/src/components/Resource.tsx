import { useEffect, useState } from 'react';
import { api } from '../api';
import type { PageConfig, Role, Row } from '../types';
import DataTable from './DataTable';
import FormDialog from './FormDialog';
import { ErrorText, PageHeader } from './ui';

/** Generic list + search + add/edit screen, driven by a PageConfig. */
export default function Resource({ cfg, role }: { cfg: PageConfig; role: Role }) {
  const path = cfg.path!;
  const canWrite = role === 'admin' || (cfg.write || []).includes(role);
  const canAdd = canWrite && !cfg.readOnly;

  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Row | null>(null);
  const [error, setError] = useState('');
  const [choices, setChoices] = useState<Record<string, Row[]>>({});

  const load = () =>
    api<Row[]>(search ? `${path}?search=${encodeURIComponent(search)}` : path)
      .then(setRows)
      .catch((e) => setError(e.message));

  // run an async step and show any error
  const attempt = async (step: () => Promise<unknown>) => {
    setError('');
    try {
      await step();
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [path]);

  // load the options for dropdowns that point at another table
  useEffect(() => {
    (cfg.fields || [])
      .filter((f) => f.ref)
      .forEach((f) =>
        api<Row[]>(f.ref!)
          .then((data) => setChoices((c) => ({ ...c, [f.key]: data })))
          .catch(() => {}),
      );
  }, [path]);

  const save = (values: Row) =>
    attempt(async () => {
      const { id, ...rest } = values;
      const body = cfg.toBody ? cfg.toBody(rest) : rest;
      if (id) await api(`${path}/${id}`, { method: 'PUT', body });
      else await api(path, { method: 'POST', body });
      setForm(null);
    });

  const remove = (row: Row) => confirm('Delete this record?') && attempt(() => api(`${path}/${row.id}`, { method: 'DELETE' }));

  const actionsFor = (row: Row) =>
    (cfg.actions || []).filter(
      (a) => (!a.roles || role === 'admin' || a.roles.includes(role)) && (!a.when || a.when(row)),
    );

  return (
    <section>
      <PageHeader title={cfg.title}>
        {cfg.autoBill && canWrite && <AutoBill onDone={load} onError={setError} />}
        {cfg.searchable && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load();
            }}
          >
            <input className="inp w-64" placeholder="Search" aria-label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </form>
        )}
        {canAdd && (
          <button className="btn" onClick={() => setForm({})}>
            Add {cfg.singular}
          </button>
        )}
      </PageHeader>

      <ErrorText>{error}</ErrorText>

      <DataTable
        columns={cfg.columns!}
        rows={rows}
        empty={
          <>
            No {cfg.title.toLowerCase()} yet.
            {canAdd && <> Use “Add {cfg.singular}” to create the first one.</>}
          </>
        }
        rowActions={(row) => (
          <>
            {actionsFor(row).map((a) => (
              <button key={a.label} className="btn-ghost" onClick={() => attempt(() => a.run(row))}>
                {a.label}
              </button>
            ))}
            {canAdd && !cfg.noEdit && (
              <button className="btn-ghost" onClick={() => setForm(row)}>
                Edit
              </button>
            )}
            {cfg.deletable && role === 'admin' && (
              <button className="btn-ghost" onClick={() => remove(row)}>
                Delete
              </button>
            )}
          </>
        )}
      />

      {form && (
        <FormDialog
          title={`${form.id ? 'Edit' : 'Add'} ${cfg.singular}`}
          fields={cfg.fields!}
          initial={form}
          choices={choices}
          onSave={save}
          onCancel={() => setForm(null)}
        />
      )}
    </section>
  );
}

function AutoBill({ onDone, onError }: { onDone: () => void; onError: (message: string) => void }) {
  const [patients, setPatients] = useState<Row[]>([]);
  const [patientId, setPatientId] = useState('');

  useEffect(() => {
    api<Row[]>('/patients').then(setPatients).catch(() => {});
  }, []);

  const generate = () =>
    api('/invoices/auto', { method: 'POST', body: { patient_id: patientId } }).then(onDone).catch((e) => onError(e.message));

  return (
    <div className="flex gap-2">
      <select className="inp w-48" aria-label="Patient" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
        <option value="">Select patient…</option>
        {patients.map((p) => (
          <option key={p.id} value={p.id}>
            {p.full_name}
          </option>
        ))}
      </select>
      <button className="btn" disabled={!patientId} onClick={generate}>
        Generate bill from charges
      </button>
    </div>
  );
}
