"use client";

import { useState } from "react";
import Input from "@/app/admin/(components)/Forms/Input";
import { Button } from "@/components/ui/button";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";

/**
 * Call before sensitive API actions (e.g. refund approve). Sets efm_a_stepup cookie via API.
 */
export function StepUpDialog({ onConfirmed }: { onConfirmed: () => void }) {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    const res = await adminOperationalAPI.security.stepUp({
      password: password || undefined,
      totpCode: totpCode || undefined,
    });
    setLoading(false);
    if (res.status) {
      toast.success("Action confirmed");
      onConfirmed();
    } else {
      toast.error(res.message || "Confirmation failed");
    }
  };

  return (
    <div className="space-y-3 rounded-xl border bg-[#fffbeb] p-4">
      <p className="text-sm font-medium text-[#78350f]">Confirm sensitive action</p>
      <Input title="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Input title="Authenticator code (if 2FA on)" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} />
      <Button size="sm" onClick={() => void confirm()} disabled={loading}>
        Confirm
      </Button>
    </div>
  );
}
