// Shared list-view pattern reused across every /admin/<section> page: a
// plain data table plus an optional per-row action slot. One reference
// implementation (used first in /admin/bookings), repeated for the rest
// rather than each section inventing its own table markup.
export function AdminTable<T extends Record<string, unknown>>({
  rows,
  columns,
  renderActions,
  emptyLabel = "Nothing here yet.",
}: {
  rows: T[];
  columns: { key: string; label: string }[];
  renderActions?: (row: T) => React.ReactNode;
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return <p className="mt-6 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary text-left">
            {columns.map((c) => (
              <th key={c.key} className="whitespace-nowrap px-4 py-2 font-medium text-foreground">
                {c.label}
              </th>
            ))}
            {renderActions && <th className="px-4 py-2" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {columns.map((c) => (
                <td key={c.key} className="whitespace-nowrap px-4 py-2 text-foreground">
                  {String(row[c.key] ?? "")}
                </td>
              ))}
              {renderActions && <td className="px-4 py-2 text-right">{renderActions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
