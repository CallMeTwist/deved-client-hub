import { Bell, Search, Menu, User, Check, AlertCircle, Calendar, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning" | "reminder";
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, title: "New client added", message: "Priya Sharma was added to the system.", time: "5 min ago", read: false, type: "success" },
  { id: 2, title: "Record overdue", message: "Health Assessment for Amara Osei is 3 days overdue.", time: "1 hr ago", read: false, type: "warning" },
  { id: 3, title: "Follow-up reminder", message: "Case follow-up with Liam Chen scheduled for today.", time: "2 hrs ago", read: false, type: "reminder" },
  { id: 4, title: "Template updated", message: "Health Assessment template was modified by admin.", time: "Yesterday", read: true, type: "info" },
  { id: 5, title: "File uploaded", message: "MRI scan uploaded for Amara Osei.", time: "Yesterday", read: true, type: "info" },
];

const typeIcon = {
  info: FileText,
  success: Check,
  warning: AlertCircle,
  reminder: Calendar,
};

const typeDot = {
  info: "bg-muted-foreground",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  reminder: "bg-primary",
};

interface TopBarProps {
  onMobileMenuToggle?: () => void;
}

export function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
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
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors active:scale-95">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => {
                const Icon = typeIcon[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "w-full text-left flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <div className={cn("mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0", n.read ? "bg-muted" : "bg-primary/10")}>
                      <Icon className={cn("h-3.5 w-3.5", n.read ? "text-muted-foreground" : "text-primary")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm truncate", !n.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground")}>{n.title}</p>
                        {!n.read && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", typeDot[n.type])} />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">{n.time}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-border px-4 py-2.5">
              <button className="w-full text-center text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                View all notifications
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <button
          onClick={() => navigate("/profile")}
          className="h-8 w-8 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity active:scale-95"
        >
          <span className="text-primary-foreground text-xs font-semibold">
            {user?.name?.split(" ").map((n) => n[0]).join("") || "?"}
          </span>
        </button>
      </div>
    </header>
  );
}
