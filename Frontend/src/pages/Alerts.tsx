import { useEffect, useState } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';
import type { Row } from '../types';

const COLUMNS = ['name', 'stock_qty', 'reorder_level', 'expiry_date'];

export default function Alerts() {
  const [data, setData] = useState<{ low: Row[]; expiring: Row[] }>({ low: [], expiring: [] });
  useEffect(() => {
    api('/pharmacy/alerts').then(setData).catch(() => {});
  }, []);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Stock alerts</h1>
      <div>
        <h2 className="mb-2 text-lg font-semibold">Low stock</h2>
        <DataTable columns={COLUMNS} rows={data.low} empty="Nothing to act on." />
      </div>
      <div>
        <h2 className="mb-2 text-lg font-semibold">Expired or expiring within 60 days</h2>
        <DataTable columns={COLUMNS} rows={data.expiring} empty="Nothing to act on." />
      </div>
    </section>
  );
}
