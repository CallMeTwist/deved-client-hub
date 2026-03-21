// src/pages/ClientProfilePage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Edit, Trash2, Plus, FileText,
  MessageSquare, Folder, Activity, Clock,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  clientsApi,
  recordsApi,
  templatesApi,
  type Client,
  type ClinicalRecord,
  type Template,
} from "@/services/api";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "records" | "notes" | "files" | "interactions";

const tabs: { key: Tab; label: string; icon: React.ElementType; permission?: string }[] = [
  { key: "overview",     label: "Overview",     icon: FileText },
  { key: "records",      label: "Records",      icon: Activity,      permission: "view_records" },
  { key: "notes",        label: "Notes",        icon: MessageSquare, permission: "view_records" },
  { key: "files",        label: "Files",        icon: Folder,        permission: "view_records" },
  { key: "interactions", label: "Interactions", icon: Activity,      permission: "view_records" },
];

const recordStatusColors: Record<string, string> = {
  submitted: "bg-emerald-500/10 text-emerald-600",
  draft:     "bg-amber-500/10 text-amber-600",
  reviewed:  "bg-primary/10 text-primary",
  archived:  "bg-muted text-muted-foreground",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Permission helper derived from the real user object
  const can = (permission: string) =>
    user?.permissions?.includes(permission) ?? false;

  const [client,        setClient]        = useState<Client | null>(null);
  const [records,       setRecords]       = useState<ClinicalRecord[]>([]);
  const [templates,     setTemplates]     = useState<Template[]>([]);
  const [loadingClient, setLoadingClient] = useState(true);
  const [loadingRecords,setLoadingRecords]= useState(false);
  const [activeTab,     setActiveTab]     = useState<Tab>("overview");
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  // Fetch client on mount
  useEffect(() => {
    if (!id) return;
    setLoadingClient(true);
    clientsApi.get(Number(id))
      .then(setClient)
      .finally(() => setLoadingClient(false));
  }, [id]);

  // Fetch records only when the Records tab is opened
  useEffect(() => {
    if (activeTab !== "records" || !id) return;
    setLoadingRecords(true);
    recordsApi.list(Number(id))
      .then((res) => setRecords(res.data))
      .finally(() => setLoadingRecords(false));
  }, [activeTab, id]);

  // Fetch templates for the "New Record" dropdown
  useEffect(() => {
    if (!can("create_records")) return;
    templatesApi.list().then(setTemplates);
  }, [user]);

  // Delete handler
  const handleDelete = async () => {
    if (!id || !confirm(`Delete ${client?.full_name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await clientsApi.delete(Number(id));
      navigate("/clients");
    } finally {
      setDeleting(false);
    }
  };

  // ─── Loading states ───────────────────────────────────────────────────────

  if (loadingClient) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading client...
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Client not found.
        </div>
      </AppLayout>
    );
  }

  const initials =
    `${client.first_name[0] ?? ""}${client.last_name[0] ?? ""}`.toUpperCase();

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AppLayout>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="animate-in">
        <button
          onClick={() => navigate("/clients")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">{initials}</span>
            </div>
            <div>
              <h1 className="page-title">{client.full_name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <StatusBadge status={client.status} />
                <span className="text-sm text-muted-foreground">
                  {client.phone ?? "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {can("edit_clients") && (
              <Button
                variant="outline"
                onClick={() => navigate(`/clients/${id}/edit`)}
                className="active:scale-[0.97]"
              >
                <Edit className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            )}
            {can("delete_clients") && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="active:scale-[0.97]"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-border mb-6 animate-in animate-in-delay-1">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            if (tab.permission && !can(tab.permission)) return null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <div className="animate-in animate-in-delay-2">

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Contact information */}
            <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Contact Information
              </h3>
              <dl className="space-y-3">
                {[
                  { label: "Full Name",     value: client.full_name },
                  { label: "Email",         value: client.email ?? "—" },
                  { label: "Phone",         value: client.phone ?? "—" },
                  { label: "Date of Birth", value: client.date_of_birth ?? "—" },
                  { label: "Age",           value: client.age ? `${client.age} yrs` : "—" },
                  { label: "Gender",        value: client.gender ?? "—" },
                  { label: "Status",        value: client.status },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">{item.label}</dt>
                    <dd className="text-sm font-medium text-foreground capitalize">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="space-y-6">
              {/* Address */}
              <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Address</h3>
                <dl className="space-y-3">
                  {[
                    { label: "Street",      value: client.address.line ?? "—" },
                    { label: "City",        value: client.address.city ?? "—" },
                    { label: "State",       value: client.address.state ?? "—" },
                    { label: "Country",     value: client.address.country ?? "—" },
                    { label: "Postal Code", value: client.address.postal_code ?? "—" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">{item.label}</dt>
                      <dd className="text-sm font-medium text-foreground">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Emergency Contact */}
              <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Emergency Contact
                </h3>
                <dl className="space-y-3">
                  {[
                    { label: "Name",         value: client.emergency_contact.name ?? "—" },
                    { label: "Phone",        value: client.emergency_contact.phone ?? "—" },
                    { label: "Relationship", value: client.emergency_contact.relationship ?? "—" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">{item.label}</dt>
                      <dd className="text-sm font-medium text-foreground capitalize">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* Records */}
        {activeTab === "records" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {loadingRecords ? "Loading..." : `${records.length} records found`}
              </p>

              {/* New Record — dropdown to pick a template */}
              {can("create_records") && templates.length > 0 && (
                <div className="relative">
                  <Button
                    size="sm"
                    onClick={() => setShowTemplateMenu((v) => !v)}
                    className="active:scale-[0.97]"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    New Record
                  </Button>

                  {showTemplateMenu && (
                    <>
                      {/* Click-away overlay */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowTemplateMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-1.5 z-20 bg-card border border-border rounded-xl shadow-lg min-w-[200px] py-1 overflow-hidden">
                        <p className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                          Choose template
                        </p>
                        {templates.map((t) => (
                          <button
                            key={t.key}
                            onClick={() => {
                              setShowTemplateMenu(false);
                              navigate(`/clients/${id}/records/new/${t.key}`);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors"
                          >
                            {t.name}
                            <span className="block text-[11px] text-muted-foreground">
                              {t.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Records list */}
            {loadingRecords ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading records...
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                <Activity className="h-8 w-8 opacity-30" />
                <p className="text-sm">No records yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-card rounded-xl border border-border/50 shadow-sm p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-semibold text-foreground capitalize">
                          {rec.template_key.replace(/_/g, " ")}
                        </h4>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
                          recordStatusColors[rec.status] ?? "bg-muted text-muted-foreground"
                        )}>
                          {rec.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          v{rec.template_version}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(rec.recorded_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Dynamic data from the template schema */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(rec.data).map(([key, val]) => (
                        <div key={key}>
                          <p className="text-[11px] text-muted-foreground capitalize">
                            {key.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {String(val)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {rec.notes && (
                      <p className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                        {rec.notes}
                      </p>
                    )}

                    {rec.created_by && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Recorded by {rec.created_by.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes / Files / Interactions — placeholder */}
        {(activeTab === "notes" ||
          activeTab === "files" ||
          activeTab === "interactions") && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
            <p className="text-sm capitalize">{activeTab} — coming soon</p>
            <p className="text-xs">
              This section will be connected in a future update.
            </p>
          </div>
        )}

      </div>
    </AppLayout>
  );
}