"use client";

import Link from "next/link";
import { SecurityShell } from "./(components)/SecurityShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSecurityDashboard } from "@/src/features/security/hooks/useSecurity";

export default function SecurityOverviewPage() {
  const { stats, loading, refresh } = useSecurityDashboard();

  return (
    <SecurityShell
      title="Security Center"
      description="Authentication hardening, sessions, IP policy, and threat monitoring."
      actions={
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      }
    >
      {loading ? <p className="text-sm text-[#53697e]">Loading…</p> : null}
      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Active sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{stats.activeSessions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Failed logins (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-[#b45309]">{stats.failedLogins24h}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Security alerts (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-[#dc2626]">{stats.openAlerts7d}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Locked accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{stats.lockedAccounts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>2FA enabled</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{stats.totpEnabledAdmins}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>IP rules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{stats.ipRules}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/security/sessions">
          <Button size="sm">Manage sessions</Button>
        </Link>
        <Link href="/admin/security/2fa">
          <Button variant="outline" size="sm">
            Configure 2FA
          </Button>
        </Link>
        <Link href="/admin/security/alerts">
          <Button variant="outline" size="sm">
            View alerts
          </Button>
        </Link>
      </div>
    </SecurityShell>
  );
}
