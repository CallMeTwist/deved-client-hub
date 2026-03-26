import { useEffect, useState } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { rolesApi, type AppRole } from "@/services/api";
import { cn } from "@/lib/utils";

export default function RolesPage() {
  const [roles,       setRoles]       = useState<AppRole[]>([]);
  const [allPerms,    setAllPerms]    = useState<string[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [expandedId,  setExpandedId]  = useState<number | null>(null);
  const [creating,    setCreating]    = useState(false);

  // New role form state
  const [newName,     setNewName]     = useState("");
  const [newPerms,    setNewPerms]    = useState<string[]>([]);
  const [saving,      setSaving]      = useState(false);

  // Edit state — track which role is being edited
  const [editingId,   setEditingId]   = useState<number | null>(null);
  const [editPerms,   setEditPerms]   = useState<string[]>([]);

  useEffect(() => {
    Promise.all([rolesApi.list(), rolesApi.listPermissions()])
      .then(([r, p]) => { setRoles(r); setAllPerms(p); })
      .finally(() => setLoading(false));
  }, []);

  const togglePerm = (perm: string, selected: string[], setSelected: (p: string[]) => void) => {
    setSelected(
      selected.includes(perm)
        ? selected.filter((p) => p !== perm)
        : [...selected, perm]
    );
  };

  const handleCreate = async () => {
    if (!newName.trim() || newPerms.length === 0) return;
    setSaving(true);
    try {
      const role = await rolesApi.create({ name: newName.trim(), permissions: newPerms });
      setRoles((prev) => [...prev, role]);
      setNewName("");
      setNewPerms([]);
      setCreating(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (roleId: number) => {
    setSaving(true);
    try {
      const updated = await rolesApi.update(roleId, editPerms);
      setRoles((prev) => prev.map((r) => (r.id === roleId ? updated : r)));
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-header animate-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Roles & Permissions</h1>
            <p className="page-subtitle">
              Manage roles and control what each role can do
            </p>
          </div>
          <Button onClick={() => setCreating((v) => !v)} className="active:scale-[0.97]">
            <Plus className="h-4 w-4 mr-1.5" />
            New Role
          </Button>
        </div>
      </div>

      {/* Create new role form */}
      {creating && (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 mb-6 animate-in">
          <h3 className="text-sm font-semibold text-foreground mb-4">Create New Role</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Role Name <span className="text-destructive">*</span>
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                placeholder="e.g. supervisor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Permissions <span className="text-destructive">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {allPerms.map((perm) => (
                  <button
                    key={perm}
                    type="button"
                    onClick={() => togglePerm(perm, newPerms, setNewPerms)}
                    className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors",
                      newPerms.includes(perm)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                    )}
                  >
                    {perm}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                size="sm"
                disabled={saving || !newName.trim() || newPerms.length === 0}
                onClick={handleCreate}
              >
                {saving ? "Creating..." : "Create Role"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setCreating(false); setNewName(""); setNewPerms([]); }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Roles list */}
      <div className="space-y-3 animate-in animate-in-delay-1">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Loading roles...
          </div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
              {/* Role header */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpandedId(expandedId === role.id ? null : role.id)}
              >
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-foreground capitalize">{role.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {expandedId === role.id
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
              </div>

              {/* Expanded — view or edit permissions */}
              {expandedId === role.id && (
                <div className="px-5 pb-5 border-t border-border/50">
                  {editingId === role.id ? (
                    // Edit mode
                    <div className="pt-4 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {allPerms.map((perm) => (
                          <button
                            key={perm}
                            type="button"
                            onClick={() => togglePerm(perm, editPerms, setEditPerms)}
                            className={cn(
                              "text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors",
                              editPerms.includes(perm)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                            )}
                          >
                            {perm}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" disabled={saving} onClick={() => handleSaveEdit(role.id)}>
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="pt-4">
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {role.permissions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No permissions assigned.</p>
                        ) : (
                          role.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="text-[11px] font-medium px-2 py-1 rounded-md bg-primary/10 text-primary"
                            >
                              {perm}
                            </span>
                          ))
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditingId(role.id); setEditPerms([...role.permissions]); }}
                      >
                        Edit Permissions
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}