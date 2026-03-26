import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DynamicForm } from '@/components/DynamicForm';
import { recordsApi, templatesApi, type ClinicalRecord, type Template, type TemplateField } from '@/services/api';

interface EditRecordModalProps {
  record: ClinicalRecord | null;
  clientId: number;
  open: boolean;
  onClose: () => void;
  onUpdated: (record: ClinicalRecord) => void;
}

export function EditRecordModal({
  record,
  clientId,
  open,
  onClose,
  onUpdated,
}: EditRecordModalProps) {
  const [fields,   setFields]   = useState<TemplateField[]>([]);
  const [template, setTemplate] = useState<Template | null>(null);
  const [status,   setStatus]   = useState<string>('submitted');
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!record || !open) return;

    setStatus(record.status);
    setFields([]);       // reset so old fields don't flash
    setTemplate(null);
    setFetching(true);

    templatesApi.list()
      .then((templates) => {
        const found = templates.find((t) => t.key === record.template_key);
        if (found) {
          setTemplate(found);
          // Safely extract fields — guard against missing schema
          setFields(found.schema?.fields ?? []);
        }
      })
      .finally(() => setFetching(false));
  }, [record, open]);

  // Don't render the modal content until fields are ready
  if (!record) return null;

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setLoading(true);
    try {
      const updated = await recordsApi.update(clientId, record.id, {
        data:   formData,
        status: status,
        notes:  record.notes ?? undefined,
      });
      onUpdated(updated);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {template?.name ?? record.template_key.replace(/_/g, ' ')}
          </DialogTitle>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Loading form...
          </div>
        ) : fields.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Template not found. The schema may have changed.
          </div>
        ) : (
          <>
            {/* Status */}
            <div className="mb-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-muted/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Form — only rendered when fields is a non-empty array */}
            <DynamicForm
              fields={fields}
              onSubmit={handleSubmit}
              loading={loading}
              submitLabel="Save Changes"
              initialData={record.data}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}