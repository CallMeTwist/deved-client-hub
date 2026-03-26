import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, UserCheck, UserX } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { usersApi, type TenantUser } from "@/services/api";
import { cn } from "@/lib/utils";

const roleColors: Record<string, string> = {
  admin:     "bg-primary/10 text-primary",
  clinician: "bg-emerald-500/10 text-emerald-600",
  viewer:    "bg-muted text-muted-foreground",
};

export default function UsersPage() {
  const navigate = useNavigate();
  const [users,   setUsers]   = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.list()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const handleToggleActive = async (user: TenantUser) => {
    const res = await usersApi.toggleActive(user.id);
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_active: res.is_active } : u))
    );
  };

  return (
    <AppLayout>
      <div className="page-header animate-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Users</h1>
            <p className="page-subtitle">
              {loading ? "Loading..." : `${users.length} users in your organisation`}
            </p>
          </div>
          <Button
            onClick={() => navigate("/users/new")}
            className="active:scale-[0.97]"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New User
          </Button>
        </div>
      </div>

      <div className="space-y-3 animate-in animate-in-delay-1">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No other users yet.
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="bg-card rounded-xl border border-border/50 shadow-sm p-5 flex items-center gap-4"
            >
              {/* Avatar */}
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => navigate(`/users/${user.id}`)}
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <span className={cn(
                    "text-[11px] font-medium px-2 py-0.5 rounded-full capitalize",
                    roleColors[user.role] ?? "bg-muted text-muted-foreground"
                  )}>
                    {user.role}
                  </span>
                  {!user.is_active && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/users/${user.id}/edit`)}
                >
                  Edit
                </Button>
                <button
                  onClick={() => handleToggleActive(user)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    user.is_active
                      ? "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      : "hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600"
                  )}
                  title={user.is_active ? "Deactivate user" : "Activate user"}
                >
                  {user.is_active
                    ? <UserX className="h-4 w-4" />
                    : <UserCheck className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}