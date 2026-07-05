import { Badge } from "@/components/ui/badge";
import type { BookingDetail } from "@/src/features/bookings/types";

export function FraudIndicators({ fraud }: { fraud: BookingDetail["fraud"] }) {
  const score = fraud.fraud_score ?? 0;
  const variant = score >= 50 ? "danger" : score >= 25 ? "warning" : "secondary";

  return (
    <div className="space-y-3 rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1e293b]">Fraud & duplicates</h3>
        <Badge variant={variant}>Score {score}</Badge>
      </div>

      {fraud.fraud_flags?.length ? (
        <ul className="space-y-1">
          {fraud.fraud_flags.map((f) => (
            <li key={f.code} className="flex items-center justify-between text-sm">
              <span className="text-[#334155]">{f.code.replace(/_/g, " ")}</span>
              <Badge variant={f.severity === "high" ? "danger" : f.severity === "medium" ? "warning" : "secondary"}>
                {f.severity}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#94a3b8]">No risk flags detected.</p>
      )}

      {fraud.duplicates?.length ? (
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-[#53697e]">Possible duplicates</p>
          <ul className="text-sm text-[#475569]">
            {fraud.duplicates.map((d) => (
              <li key={d.booking_id}>
                {d.booking_uid} · {new Date(d.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
