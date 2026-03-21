import { useEffect, useState } from "react";
import { Users, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { clientsApi, type Client, type PaginatedResponse } from "@/services/api";

interface Stats {
  total: number;
  active: number;
  inactive: number;
  archived: number;
}

export default function DashboardPage() {
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, archived: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch first page — use meta.total for real counts
        const res: PaginatedResponse<Client> = await clientsApi.list({ per_page: 5 });
        setRecentClients(res.data);

        // Count by status using separate calls
        const [activeRes, inactiveRes, archivedRes] = await Promise.all([
          clientsApi.list({ status: 'active',   per_page: 1 }),
          clientsApi.list({ status: 'inactive', per_page: 1 }),
          clientsApi.list({ status: 'archived', per_page: 1 }),
        ]);

        setStats({
          total:    res.meta.total,
          active:   activeRes.meta.total,
          inactive: inactiveRes.meta.total,
          archived: archivedRes.meta.total,
        });
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    { label: "Total Clients",    icon: Users,       value: stats.total,    color: "text-primary" },
    { label: "Active Cases",     icon: TrendingUp,  value: stats.active,   color: "text-success" },
    { label: "Inactive",         icon: Clock,       value: stats.inactive, color: "text-warning" },
    { label: "Archived",         icon: AlertCircle, value: stats.archived, color: "text-destructive" },
  ];

  return (
    <AppLayout>
      <div className="page-header animate-in">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back. Here's an overview of your system.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div key={card.label} className={`stat-card animate-in animate-in-delay-${i}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {card.label}
              </span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {loading ? '—' : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 animate-in animate-in-delay-2">
          <h2 className="text-sm font-semibold text-foreground mb-4">Recent Clients</h2>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : recentClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clients yet.</p>
            ) : (
              recentClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {client.first_name[0]}{client.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{client.full_name}</p>
                      <p className="text-xs text-muted-foreground">{client.phone ?? '—'}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${
                    client.status === 'active'
                      ? 'bg-success/10 text-success'
                      : client.status === 'inactive'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {client.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 animate-in animate-in-delay-3">
          <h2 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "New Client",  desc: "Register a new client",   href: "/clients/new" },
              { label: "View All",    desc: "Browse client list",       href: "/clients" },
              { label: "Templates",   desc: "Manage form templates",    href: "/templates" },
              { label: "Reports",     desc: "Coming soon",              href: "#" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="p-4 rounded-lg border border-border/50 hover:border-primary/20 hover:bg-muted/30 transition-all active:scale-[0.97]"
              >
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}