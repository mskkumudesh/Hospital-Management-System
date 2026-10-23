import type { ReactNode } from 'react';

export const ErrorText = ({ children }: { children?: ReactNode }) =>
  children ? (
    <p role="alert" className="mb-3 rounded-md bg-alert/10 px-3 py-2 text-sm text-alert">
      {children}
    </p>
  ) : null;

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoFocus?: boolean;
  minLength?: number;
}
export const TextField = ({ label, onChange, ...input }: TextFieldProps) => (
  <label className="block text-sm font-medium">
    {label}
    <input className="inp mt-1" {...input} onChange={(e) => onChange(e.target.value)} />
  </label>
);

export const PageHeader = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="mb-4 flex flex-wrap items-center gap-3">
    <h1 className="mr-auto text-2xl font-semibold">{title}</h1>
    {children}
  </div>
);
