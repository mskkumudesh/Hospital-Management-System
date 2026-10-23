import { useEffect, useState } from 'react';
import { api } from '../api';
import type { User } from '../types';

interface Stats {
  patients: number;
  todayAppointments: number;
  revenue: number;
  labPending: number;
  pharmacyAlerts: number;
}

export default function Dashboard({ user }: { user: User }) {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    api<Stats>('/dashboard').then(setStats).catch(() => {});
  }, []);

  const tiles: [string, number, boolean?][] = stats
    ? [
        ['Patients', stats.patients],
        ['Appointments today', stats.todayAppointments],
        ['Revenue collected', stats.revenue],
        ['Lab requests open', stats.labPending],
        ['Pharmacy alerts', stats.pharmacyAlerts, stats.pharmacyAlerts > 0],
      ]
    : [];

  return (
    <section>
      <h1 className="mb-1 text-2xl font-semibold">Good day, {user.name}</h1>
      <p className="mb-6 text-ink/70">Here is where the hospital stands right now.</p>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map(([label, value, warn]) => (
          <div key={label} className={`rounded-lg border p-4 ${warn ? 'border-alert bg-alert/5' : 'border-ink/10 bg-white'}`}>
            <dd className="text-3xl font-semibold">{value}</dd>
            <dt className="text-sm text-ink/70">{label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
