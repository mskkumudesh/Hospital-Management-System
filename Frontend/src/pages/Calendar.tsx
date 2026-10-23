import { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHeader } from '../components/ui';
import type { Row } from '../types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [appointments, setAppointments] = useState<Row[]>([]);
  useEffect(() => {
    api<Row[]>('/appointments').then(setAppointments).catch(() => {});
  }, []);

  const year = month.getFullYear();
  const monthNumber = month.getMonth() + 1;
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const blanks = month.getDay(); // empty cells before the 1st
  const shift = (n: number) => setMonth(new Date(year, month.getMonth() + n, 1));
  const dateKey = (day: number) => `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <section>
      <PageHeader title={month.toLocaleString('en', { month: 'long', year: 'numeric' })}>
        <button className="btn-ghost" onClick={() => shift(-1)}>Previous</button>
        <button className="btn-ghost" onClick={() => shift(1)}>Next</button>
      </PageHeader>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-ink/10 bg-ink/10 text-sm">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-sea-soft p-2 font-semibold">{d}</div>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <div key={'blank' + i} className="bg-paper" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
          <div key={day} className="min-h-24 bg-white p-2">
            <p className="font-semibold">{day}</p>
            {appointments
              .filter((a) => a.scheduled_at.startsWith(dateKey(day)) && a.status !== 'cancelled')
              .map((a) => (
                <p key={a.id} className="mt-1 truncate rounded bg-sea-soft px-1 text-xs" title={`${a.patient} with ${a.doctor}`}>
                  {a.scheduled_at.slice(11, 16)} {a.patient}
                </p>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
