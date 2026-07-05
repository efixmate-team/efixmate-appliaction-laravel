import Input from "@/app/admin/(components)/Forms/Input";

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input title="From" type="date" value={from} onChange={(e) => onFromChange(e.target.value)} />
      <Input title="To" type="date" value={to} onChange={(e) => onToChange(e.target.value)} />
    </div>
  );
}
