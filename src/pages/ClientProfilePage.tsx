// src/pages/ClientProfilePage.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Edit, Trash2, Plus, FileText,
  MessageSquare, Folder, Activity, Clock,
} from "lucide-react";
import {
  clientsApi, recordsApi, templatesApi,
  notesApi, filesApi, interactionsApi,
  type Client, type ClinicalRecord, type Template,
  type ClientNote, type ClientFile, type ClientInteraction,
  type InteractionType,
} from "@/services/api";
import { Eye, Download } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/RichTextEditor";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "records" | "notes" | "files" | "interactions";

const tabs: { key: Tab; label: string; icon: React.ElementType; permission?: string }[] = [
  { key: "overview", label: "Overview", icon: FileText },
  { key: "records", label: "Records", icon: Activity, permission: "view_records" },
  { key: "notes", label: "Notes", icon: MessageSquare, permission: "view_records" },
  { key: "files", label: "Files", icon: Folder, permission: "view_records" },
  { key: "interactions", label: "Interactions", icon: Activity, permission: "view_records" },
];

const recordStatusColors: Record<string, string> = {
  submitted: "bg-emerald-500/10 text-emerald-600",
  draft: "bg-amber-500/10 text-amber-600",
  reviewed: "bg-primary/10 text-primary",
  archived: "bg-muted text-muted-foreground",
};

const interactionTypeConfig: Record<string, { label: string; color: string }> = {
  call: { label: "Phone Call", color: "bg-sky-500/10 text-sky-600" },
  email: { label: "Email", color: "bg-violet-500/10 text-violet-600" },
  visit: { label: "In-Person Visit", color: "bg-emerald-500/10 text-emerald-600" },
  meeting: { label: "Meeting", color: "bg-amber-500/10 text-amber-600" },
};

const mimeTypeIcon = (mime: string | null): string => {
  if (!mime) return "📎";
  if (mime.startsWith("image/")) return "🖼️";
  if (mime === "application/pdf") return "📄";
  if (mime.includes("dicom")) return "🧠";
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "📊";
  if (mime.includes("word")) return "📝";
  return "📎";
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Permission helper derived from the real user object
  const can = (permission: string) =>
    user?.permissions?.includes(permission) ?? false;

  const [client, setClient] = useState<Client | null>(null);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingClient, setLoadingClient] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [interactions, setInteractions] = useState<ClientInteraction[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (activeTab !== "notes" || !id) return;
    setLoadingNotes(true);
    notesApi.list(Number(id))
      .then(setNotes)
      .finally(() => setLoadingNotes(false));
  }, [activeTab, id]);

  useEffect(() => {
    if (activeTab !== "files" || !id) return;
    setLoadingFiles(true);
    filesApi.list(Number(id))
      .then(setFiles)
      .finally(() => setLoadingFiles(false));
  }, [activeTab, id]);

  useEffect(() => {
    if (activeTab !== "interactions" || !id) return;
    setLoadingInteractions(true);
    interactionsApi.list(Number(id))
      .then(setInteractions)
      .finally(() => setLoadingInteractions(false));
  }, [activeTab, id]);

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
                  { label: "Full Name", value: client.full_name },
                  { label: "Email", value: client.email ?? "—" },
                  { label: "Phone", value: client.phone ?? "—" },
                  { label: "Date of Birth", value: client.date_of_birth ?? "—" },
                  { label: "Age", value: client.age ? `${client.age} yrs` : "—" },
                  { label: "Gender", value: client.gender ?? "—" },
                  { label: "Status", value: client.status },
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
                    { label: "Street", value: client.address.line ?? "—" },
                    { label: "City", value: client.address.city ?? "—" },
                    { label: "State", value: client.address.state ?? "—" },
                    { label: "Country", value: client.address.country ?? "—" },
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
                    { label: "Name", value: client.emergency_contact.name ?? "—" },
                    { label: "Phone", value: client.emergency_contact.phone ?? "—" },
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
        {/* ── Notes ────────────────────────────────────────────────────────── */}
        {activeTab === "notes" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {loadingNotes ? "Loading..." : `${notes.length} notes`}
              </p>
              {can("create_records") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingNote((v) => !v)}
                  className="active:scale-[0.97]"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Note
                </Button>
              )}
            </div>

            {/* Add note form */}
            {addingNote && (
              <div className="mb-4 bg-card rounded-xl border border-border/50 shadow-sm p-4">
                <RichTextEditor
                  value={noteContent}
                  onChange={setNoteContent}
                  placeholder="Write your note here... Use the toolbar for bold, italic, lists etc."
                  minHeight="140px"
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    disabled={savingNote || !noteContent || noteContent === '<p></p>'}
                    onClick={async () => {
                      if (!id || !noteContent || noteContent === '<p></p>') return;
                      setSavingNote(true);
                      try {
                        const note = await notesApi.create(Number(id), noteContent);
                        setNotes((prev) => [note, ...prev]);
                        setNoteContent('');
                        setAddingNote(false);
                      } finally {
                        setSavingNote(false);
                      }
                    }}
                  >
                    {savingNote ? 'Saving...' : 'Save Note'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAddingNote(false);
                      setNoteContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {loadingNotes ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading notes...
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                <MessageSquare className="h-8 w-8 opacity-30" />
                <p className="text-sm">No notes yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-card rounded-xl border border-border/50 shadow-sm p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-primary">
                            {note.created_by?.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("") ?? "?"}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {note.created_by?.name ?? "Unknown"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleString()}
                      </span>
                    </div>
                    {/* Render HTML content safely */}
                    <div
                      className="prose prose-sm max-w-none text-foreground
                prose-strong:text-foreground prose-em:text-muted-foreground
                prose-ul:mt-2 prose-li:mt-0.5 prose-p:my-1.5"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Files ────────────────────────────────────────────────────────── */}
        {activeTab === "files" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {loadingFiles ? "Loading..." : `${files.length} files`}
              </p>
              {can("create_records") && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !id) return;
                      try {
                        const uploaded = await filesApi.upload(Number(id), file);
                        setFiles((prev) => [uploaded, ...prev]);
                      } catch {
                        alert("Upload failed. Please try again.");
                      }
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="active:scale-[0.97]"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Upload File
                  </Button>
                </>
              )}
            </div>

            {loadingFiles ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading files...
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                <Folder className="h-8 w-8 opacity-30" />
                <p className="text-sm">No files uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="bg-card rounded-xl border border-border/50 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                      {mimeTypeIcon(file.mime_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.formatted_size} · Uploaded by {file.uploaded_by?.name ?? "Unknown"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground mr-2">
                        {new Date(file.created_at).toLocaleDateString()}
                      </span>

                      {(file.mime_type?.startsWith('image/') || file.mime_type === 'application/pdf') && (
                        <button
                          className="p-1.5 rounded-md hover:bg-muted transition-colors active:scale-95"
                          title="View"
                          onClick={async () => {
                            try {
                              await filesApi.preview(Number(id), file.id, file.name);
                            } catch {
                              alert('Could not open file preview.');
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                      <button
                        className="p-1.5 rounded-md hover:bg-muted transition-colors active:scale-95"
                        title="Download"
                        onClick={async () => {
                          try {
                            await filesApi.download(Number(id), file.id, file.name);
                          } catch {
                            alert('Download failed. Please try again.');
                          }
                        }}
                      >
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Interactions ──────────────────────────────────────────────────── */}
        {activeTab === "interactions" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {loadingInteractions ? "Loading..." : `${interactions.length} interactions`}
              </p>
              {can("create_records") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddInteraction((v) => !v)}
                  className="active:scale-[0.97]"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Log Interaction
                </Button>
              )}
            </div>

            {/* Add interaction form */}
            {showAddInteraction && (
              <AddInteractionForm
                clientId={Number(id)}
                onSaved={(interaction) => {
                  setInteractions((prev) => [interaction, ...prev]);
                  setShowAddInteraction(false);
                }}
                onCancel={() => setShowAddInteraction(false)}
              />
            )}

            {loadingInteractions ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading interactions...
              </div>
            ) : interactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                <Activity className="h-8 w-8 opacity-30" />
                <p className="text-sm">No interactions logged yet.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {interactions.map((interaction) => {
                    const config = interactionTypeConfig[interaction.type];
                    return (
                      <div key={interaction.id} className="relative pl-10">
                        <div className="absolute left-2.5 top-4 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                config?.color ?? "bg-muted text-muted-foreground"
                              )}
                            >
                              {config?.label ?? interaction.type}
                            </span>
                            {interaction.duration && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {interaction.duration}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground">{interaction.summary}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              By {interaction.created_by?.name ?? "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(interaction.interacted_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ─── Add Interaction sub-component ───────────────────────────────────────────

interface AddInteractionFormProps {
  clientId: number;
  onSaved: (interaction: ClientInteraction) => void;
  onCancel: () => void;
}

function AddInteractionForm({ clientId, onSaved, onCancel }: AddInteractionFormProps) {
  const [type, setType] = useState<InteractionType>("call");
  const [summary, setSummary] = useState("");
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);

  const inputClasses =
    "w-full h-9 px-3 rounded-lg bg-muted/40 border border-border text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all";

  const handleSave = async () => {
    if (!summary.trim()) return;
    setSaving(true);
    try {
      const interaction = await interactionsApi.create(clientId, {
        type,
        summary,
        duration_minutes: duration ? Number(duration) : undefined,
      });
      onSaved(interaction);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-4 bg-card rounded-xl border border-border/50 shadow-sm p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as InteractionType)}
            className={inputClasses}
          >
            <option value="call">Phone Call</option>
            <option value="email">Email</option>
            <option value="visit">In-Person Visit</option>
            <option value="meeting">Meeting</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 30"
            className={inputClasses}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Summary</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="What happened during this interaction?"
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={saving || !summary.trim()}
          onClick={handleSave}
        >
          {saving ? "Saving..." : "Log Interaction"}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}