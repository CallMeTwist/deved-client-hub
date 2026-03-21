import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ReusableTable, type Column } from "@/components/ReusableTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { clientsApi, type Client } from "@/services/api";

// ─── Table column definitions ─────────────────────────────────────────────────

const columns: Column<Client>[] = [
  {
    key: "full_name",
    header: "Name",
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-medium text-primary">
            {row.first_name[0]}{row.last_name[0]}
          </span>
        </div>
        <div>
          <p className="font-medium text-foreground">{row.full_name}</p>
          <p className="text-xs text-muted-foreground">{row.email ?? "—"}</p>
        </div>
      </div>
    ),
  },
  {
    key: "phone",
    header: "Phone",
    render: (row) => row.phone ?? "—",
  },
  {
    key: "status",
    header: "Status",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: "created_at",
    header: "Created",
    render: (row) => new Date(row.created_at).toLocaleDateString(),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const can = (p: string) => user?.permissions?.includes(p) ?? false;

  const [clients,      setClients]      = useState<Client[]>([]);
  const [total,        setTotal]        = useState(0);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading,      setLoading]      = useState(true);

  // ── Fetch — passes search & status to the API, not filtered client-side ──

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientsApi.list({
        search:   search   || undefined,
        status:   statusFilter === "all" ? undefined : statusFilter,
        per_page: 50,
      });
      setClients(res.data);
      setTotal(res.meta.total);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    // Debounce search so we don't fire on every keystroke
    const timer = setTimeout(fetchClients, 300);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="page-header animate-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Clients</h1>
            <p className="page-subtitle">
              {loading ? "Loading..." : `${total} total clients in the system`}
            </p>
          </div>
          {can("create_clients") && (
            <Button
              onClick={() => navigate("/clients/new")}
              className="active:scale-[0.97] transition-transform"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Client
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-in animate-in-delay-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full h-10 pl-9 pr-4 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
          />
        </div>

        {/* Status options match the backend enum exactly */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="animate-in animate-in-delay-2">
        <ReusableTable
          columns={columns}
          data={clients}
          onRowClick={(row) => navigate(`/clients/${row.id}`)}
          emptyMessage={
            loading
              ? "Loading clients..."
              : "No clients match your search"
          }
        />
      </div>
    </AppLayout>
  );
}