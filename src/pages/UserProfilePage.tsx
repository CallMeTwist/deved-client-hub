import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Key, Shield } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { usersApi, type TenantUser, type ActivityItem } from "@/services/api";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return "Just now";
  if (mins  < 60)  return `${mins} min ago`;
  if (hours < 24)  return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  if (days  === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user,    setUser]    = useState<TenantUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    usersApi.get(Number(id))
      .then(setUser)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading...
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          User not found.
        </div>
      </AppLayout>
    );
  }

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <AppLayout>
      <div className="animate-in">
        <button
          onClick={() => navigate("/users")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </button>

        {/* Header */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6 mb-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-primary">{initials}</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-medium text-primary capitalize">{user.role}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
            {!user.is_active && (
              <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                Account inactive
              </span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`/users/${id}/edit`)}
            className="active:scale-[0.97] shrink-0"
          >
            Edit User
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Permissions */}
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

          {/* Recent Activity */}
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </h3>
            {(user.activity ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {(user.activity ?? []).map((item) => (
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
}