import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DynamicForm } from "@/components/DynamicForm";
import { templatesService, recordsService, type Template } from "@/services/api";

export default function DynamicRecordFormPage() {
  const { clientId, templateKey } = useParams(); // ← templateKey not templateId
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (templateKey) {
      // Fetch all templates and find by key
      templatesService.list().then((templates) => {
        const found = templates.find((t) => t.key === templateKey);
        setTemplate(found ?? null);
      });
    }
  }, [templateKey]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!template || !clientId) return;
    setLoading(true);
    try {
      await recordsService.submit(
        Number(clientId),
        template.key,  // ← pass template.key not templateId
        data,
      );
      navigate(`/clients/${clientId}`);
    } catch (err: unknown) {
      // Handle schema validation errors from backend
      const error = err as {
        response?: { data?: { errors?: Record<string, string[]> } }
      };
      console.error('Validation errors:', error.response?.data?.errors);
    } finally {
      setLoading(false);
    }
  };

  if (!template) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading template...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-in">
        <button
          onClick={() => navigate(`/clients/${clientId}`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Client
        </button>

        <div className="page-header">
          <h1 className="page-title">{template.name}</h1>
          <p className="page-subtitle">{template.description}</p>
        </div>
      </div>

      <div className="max-w-lg animate-in animate-in-delay-1">
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
          <DynamicForm
            fields={template.schema.fields}  // ← template.schema.fields not template.fields
            onSubmit={handleSubmit}
            loading={loading}
            submitLabel="Save Record"
          />
        </div>
      </div>
    </AppLayout>
  );
}