import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DynamicForm } from "./DynamicForm";
import { templatesService, recordsService, type Template } from "@/services/api";

interface RecordModalProps {
  open: boolean;
  onClose: () => void;
  clientId: number;
}

export function RecordModal({ open, onClose, clientId }: RecordModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      templatesService.list().then(setTemplates);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (data: Record<string, any>) => {
    if (!selectedTemplate) return;
    setLoading(true);
    try {
      await recordsService.submit(clientId, selectedTemplate.id, data);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-xl shadow-xl border border-border/50 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto animate-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">New Record</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors active:scale-95"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5">
          {!selectedTemplate ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">Select a template:</p>
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className="w-full text-left p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all active:scale-[0.98]"
                >
                  <p className="font-medium text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                </button>
              ))}
            </div>
          ) : (
            <>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-xs text-primary hover:underline mb-4 inline-block"
              >
                ← Change template
              </button>
              <DynamicForm
                fields={selectedTemplate.fields}
                onSubmit={handleSubmit}
                loading={loading}
                submitLabel="Save Record"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
