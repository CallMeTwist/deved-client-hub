// src/pages/ProfilePage.tsx
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Key, User, Settings } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">

        {/* ── Profile Header ─────────────────────────────────────────────── */}
        <div className="animate-in">
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-primary">{initials}</span>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium text-primary capitalize">
                  {user.role}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {user.tenant.name} · Member since {memberSince}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={logout}
                className="active:scale-[0.97]"
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 animate-in animate-in-delay-1">

          {/* ── Account Details ───────────────────────────────────────────── */}
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Account Details
            </h3>
            <dl className="space-y-3">
              {[
                { label: "Full Name",    value: user.name },
                { label: "Email",        value: user.email },
                { label: "Phone",        value: user.phone ?? "—" },
                { label: "Role",         value: user.role },
                { label: "Organisation", value: user.tenant.name },
                { label: "Clinic Type",  value: user.tenant.clinic_type },
                { label: "User ID",      value: `#${user.id}` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between gap-4">
                  <dt className="text-sm text-muted-foreground shrink-0">{item.label}</dt>
                  <dd className="text-sm font-medium text-foreground capitalize text-right">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ── Permissions ───────────────────────────────────────────────── */}
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              Permissions ({user.permissions.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {user.permissions.map((perm) => (
                <span
                  key={perm}
                  className="text-[11px] font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Activity placeholder ───────────────────────────────── */}
        <div className="mt-6 animate-in animate-in-delay-2">
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </h3>
            <div className="flex items-center justify-center h-20 text-muted-foreground">
              <p className="text-sm">Activity log coming soon.</p>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}