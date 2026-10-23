import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../api';
import { TextField } from '../components/ui';

export default function Account() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api('/auth/change-password', { method: 'POST', body: { current, next } });
      setMessage('Password changed.');
      setCurrent('');
      setNext('');
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-sm space-y-3">
      <h1 className="text-2xl font-semibold">Change password</h1>
      {message && <p role="status" className="text-sm">{message}</p>}
      <TextField label="Current password" type="password" value={current} onChange={setCurrent} />
      <TextField label="New password" type="password" minLength={8} value={next} onChange={setNext} />
      <button className="btn">Save password</button>
    </form>
  );
}
