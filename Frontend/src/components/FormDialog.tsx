import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Field, Row } from '../types';

interface Props {
  title: string;
  fields: Field[];
  initial: Row;
  choices: Record<string, Row[]>; // loaded options for fields with `ref`
  onSave: (values: Row) => void;
  onCancel: () => void;
}

/** Modal add/edit form built from a list of field descriptions. */
export default function FormDialog({ title, fields, initial, choices, onSave, onCancel }: Props) {
  const [values, setValues] = useState<Row>(initial);
  const set = (key: string, value: string) => setValues({ ...values, [key]: value });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave(values);
  };

  const input = (f: Field) => {
    const common = { className: 'inp mt-1', value: values[f.key] ?? '' };
    const change = (e: { target: { value: string } }) => set(f.key, e.target.value);

    if (f.ref || f.options) {
      const options = f.ref
        ? (choices[f.key] || []).map((o) => ({ value: o.id, text: o[f.refLabel || 'full_name'] || o.name }))
        : f.options!.map((o) => ({ value: o, text: o }));
      return (
        <select {...common} required={f.required} onChange={change}>
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.text}
            </option>
          ))}
        </select>
      );
    }
    if (f.type === 'textarea') return <textarea {...common} rows={3} onChange={change} />;
    return <input {...common} type={f.type || 'text'} required={f.required} onChange={change} />;
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="max-h-full w-full max-w-lg space-y-3 overflow-auto rounded-lg bg-white p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        {fields.map((f) => (
          <label key={f.key} className="block text-sm font-medium">
            {f.label}
            {input(f)}
          </label>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn">Save</button>
        </div>
      </form>
    </div>
  );
}
