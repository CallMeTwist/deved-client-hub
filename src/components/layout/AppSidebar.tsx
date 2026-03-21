// src/components/layout/AppSidebar.tsx
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Clients",
    path: "/clients",
    icon: Users,
    permission: "view_clients",
  },
  {
    label: "Templates",
    path: "/templates",
    icon: FileText,
    permission: "manage_templates", // ← was "view_templates" which doesn't exist
  },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Derive helpers from the real user object
  const can     = (permission: string) => user?.permissions?.includes(permission) ?? false;
  const hasRole = (role: string)       => user?.role === role;

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "?";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <span className="text-sidebar-primary-foreground font-bold text-sm">CM</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-sidebar-accent-foreground text-sm whitespace-nowrap">
              Client Manager
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          // Hide item if user lacks the required permission
          if (item.permission && !can(item.permission)) return null;

          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {user && (
          <NavLink
            to="/profile"
            className={cn(
              "flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors mb-1",
              collapsed && "justify-center"
            )}
          >
            <div className="h-7 w-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-sidebar-accent-foreground">
                {initials}
              </span>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-sidebar-accent-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-sidebar-foreground capitalize">
                  {user.role}
                </p>
              </div>
            )}
          </NavLink>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span>Collapse</span>}
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}