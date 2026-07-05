"use client";

import { useEffect, useState } from "react";
import Input from "@/app/admin/(components)/Forms/Input";
import { SecurityShell } from "../(components)/SecurityShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";

export default function Security2faPage() {
  const toast = useToast();
  const [enabled, setEnabled] = useState(false);
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const refresh = async () => {
    const res = await adminOperationalAPI.security.totpStatus();
    if (res.status && res.data) {
      const d = res.data as { totp_enabled: boolean };
      setEnabled(!!d.totp_enabled);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const setup = async () => {
    const res = await adminOperationalAPI.security.totpSetup();
    if (res.status && res.data) {
      const d = res.data as { secret: string; otpauthUrl: string };
      setSecret(d.secret);
      setOtpauthUrl(d.otpauthUrl);
      toast.success("Scan the secret in your authenticator app");
    } else toast.error(res.message || "Setup failed");
  };

  const enable = async () => {
    const res = await adminOperationalAPI.security.totpEnable({ code });
    if (res.status) {
      toast.success("2FA enabled");
      setEnabled(true);
      setCode("");
    } else toast.error(res.message || "Invalid code");
  };

  const disable = async () => {
    const res = await adminOperationalAPI.security.totpDisable({ password });
    if (res.status) {
      toast.success("2FA disabled");
      setEnabled(false);
      setPassword("");
    } else toast.error(res.message || "Failed");
  };

  return (
    <SecurityShell title="Two-factor authentication" description="TOTP authenticator for admin sign-in.">
      <Card>
        <CardHeader>
          <CardTitle>Status: {enabled ? "Enabled" : "Disabled"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!enabled ? (
            <>
              <Button onClick={() => void setup()}>Generate setup key</Button>
              {secret ? (
                <div className="rounded-lg border bg-[#f8fafc] p-3 text-sm">
                  <p className="font-mono break-all">{secret}</p>
                  {otpauthUrl ? (
                    <p className="mt-2 text-xs text-[#53697e] break-all">{otpauthUrl}</p>
                  ) : null}
                </div>
              ) : null}
              <Input title="Verification code" value={code} onChange={(e) => setCode(e.target.value)} />
              <Button onClick={() => void enable()}>Enable 2FA</Button>
            </>
          ) : (
            <>
              <Input title="Password to disable" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button variant="destructive" onClick={() => void disable()}>
                Disable 2FA
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </SecurityShell>
  );
}
