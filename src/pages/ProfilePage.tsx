import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Key, User, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { activityApi, type ActivityItem } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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


  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    activityApi.list()
      .then(setActivities)
      .finally(() => setLoadingActivity(false));
  }, []);

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
                { label: "Full Name", value: user.name },
                { label: "Email", value: user.email },
                { label: "Phone", value: user.phone ?? "—" },
                { label: "Role", value: user.role },
                { label: "Organisation", value: user.tenant.name },
                { label: "Clinic Type", value: user.tenant.clinic_type },
                // { label: "User ID",      value: `#${user.id}` },
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

    {loadingActivity ? (
      <div className="flex items-center justify-center h-20 text-muted-foreground">
        <p className="text-sm">Loading activity...</p>
      </div>
    ) : activities.length === 0 ? (
      <div className="flex items-center justify-center h-20 text-muted-foreground">
        <p className="text-sm">No activity yet. Start by adding a client or a record.</p>
      </div>
    ) : (
      <div className="space-y-3">
        {activities.map((item) => (
          <div
            key={item.id}
            onClick={() => item.link && navigate(item.link)}
            className={cn(
              "flex items-start gap-3",
              item.link && "cursor-pointer group"
            )}
          >
            <div className="mt-1.5 h-2 w-2 rounded-full bg-primary/60 shrink-0" />
            <div className="flex-1 flex items-center justify-between gap-4">
              <p className={cn(
                "text-sm text-foreground",
                item.link && "group-hover:text-primary transition-colors"
              )}>
                {item.description}
              </p>
              <span className="text-xs text-muted-foreground shrink-0">
                {timeAgo(item.occurred_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>

      </div>
    </AppLayout>
  );

  // Helper — converts ISO string to relative time
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return 'Just now';
  if (mins  < 60)  return `${mins} min ago`;
  if (hours < 24)  return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  if (days  === 1) return 'Yesterday';
  return `${days} days ago`;
}
}