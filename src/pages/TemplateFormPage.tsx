// src/pages/TemplateFormPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, GripVertical, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { templatesApi, type FormField, type FieldType } from "@/services/api";

// ─── Field types the backend accepts ─────────────────────────────────────────

const FIELD_TYPES: FieldType[] = [
  "text", "number", "boolean", "select", "date", "textarea", "scale",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a human label into a valid snake_case key */
const toKey = (str: string) =>
  str.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

// ─── Component ────────────────────────────────────────────────────────────────

export default function TemplateFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading,     setLoading]     = useState(false);
  const [fetching,    setFetching]    = useState(isEdit);
  const [error,       setError]       = useState("");
  const [name,        setName]        = useState("");
  const [key,         setKey]         = useState("");  // snake_case machine key
  const [description, setDescription] = useState("");
  const [fields,      setFields]      = useState<FormField[]>([]);

  // When editing, hydrate from real API
  useEffect(() => {
    if (!id) return;
    setFetching(true);
    templatesApi.get(Number(id))
      .then((t) => {
        setName(t.name);
        setKey(t.key);
        setDescription(t.description ?? "");
        setFields(t.schema.fields); // schema.fields — not t.fields
      })
      .finally(() => setFetching(false));
  }, [id]);

  // Auto-generate key from name (only while creating, not editing)
  const handleNameChange = (value: string) => {
    setName(value);
    if (!isEdit) setKey(toKey(value));
  };

  // ── Field operations ───────────────────────────────────────────────────────

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { name: "", label: "", type: "text", required: false },
    ]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate that all fields have a name and label
    const incomplete = fields.find((f) => !f.name || !f.label);
    if (incomplete) {
      setError("All fields must have a label.");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        // Update only accepts metadata — schema changes create a new version
        await templatesApi.update(Number(id), {
          name,
          description: description || undefined,
          is_active: true,
        });
      } else {
        // Create accepts the full schema
        await templatesApi.create({
          name,
          key,
          description: description || undefined,
          schema: { fields },
        });
      }
      navigate("/templates");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = e.response?.data?.message ?? "Something went wrong.";
      const validationErrors = e.response?.data?.errors;
      setError(
        validationErrors
          ? Object.values(validationErrors).flat().join(" ")
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────────

  const inputClasses =
    "w-full h-9 px-3 rounded-lg bg-muted/40 border border-border text-sm text-foreground " +
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all";

  // ── Loading ────────────────────────────────────────────────────────────────

  if (fetching) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading template...
        </div>
      </AppLayout>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="animate-in">
        <button
          onClick={() => navigate("/templates")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </button>

        <div className="page-header">
          <h1 className="page-title">
            {isEdit ? "Edit Template" : "New Template"}
          </h1>
          <p className="page-subtitle">
            {isEdit
              ? "Update template name or description. To change fields, create a new version."
              : "Define the fields that appear when creating records for this template."}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-6 animate-in animate-in-delay-1"
      >
        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* ── Basic info ────────────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Template Details
          </h3>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Template Name <span className="text-destructive">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={inputClasses}
              placeholder="e.g. Physiotherapy Assessment"
            />
          </div>

          {/* Key — shown when creating, read-only when editing */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Template Key
              {!isEdit && (
                <span className="text-muted-foreground font-normal ml-1">
                  (auto-generated, lowercase + underscores only)
                </span>
              )}
            </label>
            <input
              required={!isEdit}
              value={key}
              onChange={(e) => !isEdit && setKey(toKey(e.target.value))}
              readOnly={isEdit}
              className={
                inputClasses +
                (isEdit ? " opacity-50 cursor-not-allowed bg-muted" : "")
              }
              placeholder="e.g. physio_assessment"
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground mt-1">
                Key cannot be changed after creation. Create a new template to change the key.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClasses}
              placeholder="Brief description of when to use this template"
            />
          </div>
        </div>

        {/* ── Fields builder — only shown when creating ─────────────────── */}
        {isEdit ? (
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Schema is locked after creation
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  This template has {fields.length} field{fields.length !== 1 ? "s" : ""}.
                  To change the schema, create a new template with the same key — the backend
                  will automatically create version {"{current + 1}"} and preserve existing records.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 active:scale-[0.97]"
                  onClick={() => navigate("/templates/new")}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Create New Version
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Fields
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addField}
                className="active:scale-[0.97]"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Field
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No fields yet. Click "Add Field" to start building your template.
              </p>
            ) : (
              <div className="space-y-3">
                {fields.map((field, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-muted/20"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-2.5 shrink-0 cursor-grab" />

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Label — auto-generates name */}
                      <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">
                          Label
                        </label>
                        <input
                          value={field.label}
                          onChange={(e) =>
                            updateField(i, {
                              label: e.target.value,
                              name: toKey(e.target.value),
                            })
                          }
                          className={inputClasses}
                          placeholder="e.g. Pain Level"
                        />
                      </div>

                      {/* Type */}
                      <div>
                        <label className="text-[11px] text-muted-foreground mb-1 block">
                          Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateField(i, { type: e.target.value as FieldType })
                          }
                          className={inputClasses}
                        >
                          {FIELD_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Required toggle */}
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required ?? false}
                            onChange={(e) =>
                              updateField(i, { required: e.target.checked })
                            }
                            className="rounded border-border"
                          />
                          Required
                        </label>
                      </div>

                      {/* Field name (read-only, auto-generated) */}
                      <div className="sm:col-span-3">
                        <label className="text-[11px] text-muted-foreground mb-1 block">
                          Field key (auto-generated)
                        </label>
                        <input
                          value={field.name}
                          readOnly
                          className={inputClasses + " opacity-50 cursor-not-allowed"}
                        />
                      </div>

                      {/* Options — only for select type */}
                      {field.type === "select" && (
                        <div className="sm:col-span-3">
                          <label className="text-[11px] text-muted-foreground mb-1 block">
                            Options (comma-separated)
                          </label>
                          <input
                            value={field.options?.join(", ") ?? ""}
                            onChange={(e) =>
                              updateField(i, {
                                options: e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            className={inputClasses}
                            placeholder="e.g. improved, unchanged, worse"
                          />
                        </div>
                      )}

                      {/* Min/Max — only for number and scale types */}
                      {(field.type === "number" || field.type === "scale") && (
                        <div className="sm:col-span-3 grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">
                              Min value
                            </label>
                            <input
                              type="number"
                              value={field.validation?.min ?? ""}
                              onChange={(e) =>
                                updateField(i, {
                                  validation: {
                                    ...field.validation,
                                    min: e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  },
                                })
                              }
                              className={inputClasses}
                              placeholder="e.g. 0"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-muted-foreground mb-1 block">
                              Max value
                            </label>
                            <input
                              type="number"
                              value={field.validation?.max ?? ""}
                              onChange={(e) =>
                                updateField(i, {
                                  validation: {
                                    ...field.validation,
                                    max: e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  },
                                })
                              }
                              className={inputClasses}
                              placeholder="e.g. 10"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Remove field */}
                    <button
                      type="button"
                      onClick={() => removeField(i)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors mt-1 active:scale-95"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="active:scale-[0.97] transition-transform"
          >
            {loading
              ? "Saving..."
              : isEdit
              ? "Update Template"
              : "Create Template"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/templates")}
            className="active:scale-[0.97]"
          >
            Cancel
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}