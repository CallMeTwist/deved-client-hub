// src/components/layout/TopBar.tsx
import { Bell, Search, Menu, Check, AlertCircle, Calendar, FileText, Users, Upload, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { notificationsApi, type AppNotification } from "@/services/api";

// ─── Type → icon + dot colour mapping ────────────────────────────────────────

const typeConfig: Record<string, { icon: React.ElementType; dot: string }> = {
  client_created:     { icon: Users,         dot: 'bg-emerald-500' },
  note_added:         { icon: FileText,      dot: 'bg-primary' },
  file_uploaded:      { icon: Upload,        dot: 'bg-violet-500' },
  record_created:     { icon: ClipboardList, dot: 'bg-sky-500' },
  interaction_logged: { icon: Calendar,      dot: 'bg-amber-500' },
  template_created:   { icon: FileText,      dot: 'bg-muted-foreground' },
  default:            { icon: AlertCircle,   dot: 'bg-muted-foreground' },
};

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return 'Just now';
  if (mins  < 60)  return `${mins} min ago`;
  if (hours < 24)  return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  if (days  === 1) return 'Yesterday';
  return `${days} days ago`;
}

interface TopBarProps {
  onMobileMenuToggle?: () => void;
}

export function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [open,          setOpen]          = useState(false);

  // Poll every 60 seconds for new notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.list();
      setNotifications(res.data);
      setUnreadCount(res.unread_count);
    } catch {
      // Silently fail — don't crash the app if notifications fail
    }
  }, []);

  useEffect(() => {
  if (!user) return; // ← wait until auth is resolved

  fetchNotifications();
  const interval = setInterval(fetchNotifications, 60_000);
  return () => clearInterval(interval);
}, [fetchNotifications, user]);

  const handleMarkRead = async (id: number) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleClick = async (n: AppNotification) => {
    if (!n.read) await handleMarkRead(n.id);
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-sm border-b border-border flex items-center px-6 gap-4">
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors active:scale-95"
      >
        <Menu className="h-5 w-5 text-muted-foreground" />
      </button>

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients, records..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-muted/60 border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* ── Notifications bell ───────────────────────────────────────── */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors active:scale-95">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>

          <PopoverContent align="end" className="w-80 p-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h4 className="text-sm font-semibold text-foreground">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    ({unreadCount} unread)
                  </span>
                )}
              </h4>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => {
                  const config = typeConfig[n.type] ?? typeConfig.default;
                  const Icon   = config.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={cn(
                        "w-full text-left flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0",
                        !n.read && "bg-primary/5"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                        n.read ? "bg-muted" : "bg-primary/10"
                      )}>
                        <Icon className={cn("h-3.5 w-3.5", n.read ? "text-muted-foreground" : "text-primary")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-sm truncate",
                            !n.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                          )}>
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-1">{timeAgo(n.occurred_at)}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2.5">
              <p className="text-center text-xs text-muted-foreground">
                Showing last {notifications.length} notifications
              </p>
            </div>
          </PopoverContent>
        </Popover>

        {/* ── Avatar → Profile ─────────────────────────────────────────── */}
        <button
          onClick={() => navigate("/profile")}
          className="h-8 w-8 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity active:scale-95"
        >
          <span className="text-primary-foreground text-xs font-semibold">
            {user?.name?.split(" ").map((n) => n[0]).join("") ?? "?"}
          </span>
        </button>
      </div>
    </header>
  );
}