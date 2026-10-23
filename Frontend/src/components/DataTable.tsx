import type { ReactNode } from 'react';
import type { Row } from '../types';

const YES_NO_COLUMNS = ['dispensed', 'is_active', 'billed'];

export const cellText = (column: string, value: unknown) =>
  YES_NO_COLUMNS.includes(column) ? (Number(value) ? 'Yes' : 'No') : String(value ?? '');

interface Props {
  columns: string[];
  rows: Row[];
  empty: ReactNode;
  rowActions?: (row: Row) => ReactNode; // adds a right-hand column
}

/** Plain table used by every list, report and alert screen. */
export default function DataTable({ columns, rows, empty, rowActions }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-ink/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-sea-soft">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 font-semibold">
                {c.replace(/_/g, ' ')}
              </th>
            ))}
            {rowActions && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="border-t border-ink/10">
              {columns.map((c) => (
                <td key={c} className="px-3 py-2">
                  {cellText(c, row[c])}
                </td>
              ))}
              {rowActions && <td className="space-x-2 whitespace-nowrap px-3 py-2 text-right">{rowActions(row)}</td>}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td className="px-3 py-8 text-center text-ink/60" colSpan={columns.length + (rowActions ? 1 : 0)}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
