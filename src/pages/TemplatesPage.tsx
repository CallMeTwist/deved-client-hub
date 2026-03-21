// src/pages/TemplatesPage.tsx
import { useEffect, useState } from "react";
import { Plus, FileText } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ReusableTable, type Column } from "@/components/ReusableTable";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { templatesApi, type Template } from "@/services/api";
import { useNavigate } from "react-router-dom";

// ─── Table columns ────────────────────────────────────────────────────────────

const columns: Column<Template>[] = [
  {
    key: "name",
    header: "Template",
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.description ?? "—"}</p>
        </div>
      </div>
    ),
  },
  {
    key: "key",
    header: "Key",
    render: (row) => (
      <code className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
        {row.key}
      </code>
    ),
  },
  {
    key: "version",
    header: "Version",
    render: (row) => (
      <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
        v{row.version}
      </span>
    ),
  },
  {
    key: "schema",
    header: "Fields",
    // schema.fields — NOT row.fields
    render: (row) => (
      <span className="tabular-nums text-sm">
        {row.schema.fields.length} fields
      </span>
    ),
  },
  {
    key: "is_active",
    header: "Status",
    render: (row) => (
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          row.is_active
            ? "bg-emerald-500/10 text-emerald-600"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {row.is_active ? "Active" : "Inactive"}
      </span>
    ),
  },
  {
    key: "created_at",
    header: "Created",
    render: (row) => new Date(row.created_at).toLocaleDateString(),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const can = (p: string) => user?.permissions?.includes(p) ?? false;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    templatesApi.list()
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="page-header animate-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Templates</h1>
            <p className="page-subtitle">
              {loading
                ? "Loading..."
                : `${templates.length} template${templates.length !== 1 ? "s" : ""} — manage dynamic form schemas`}
            </p>
          </div>
          {/* Backend permission is manage_templates, not create_templates */}
          {can("manage_templates") && (
            <Button
              onClick={() => navigate("/templates/new")}
              className="active:scale-[0.97] transition-transform"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Template
            </Button>
          )}
        </div>
      </div>

      <div className="animate-in animate-in-delay-1">
        <ReusableTable
          columns={columns}
          data={templates}
          onRowClick={(row) => navigate(`/templates/${row.id}/edit`)}
          emptyMessage={
            loading ? "Loading templates..." : "No templates created yet"
          }
        />
      </div>
    </AppLayout>
  );
}