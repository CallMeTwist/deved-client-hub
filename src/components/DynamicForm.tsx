import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { TemplateField } from "@/services/api";

interface DynamicFormProps {
  fields: TemplateField[];
  onSubmit: (data: Record<string, any>) => void;
  loading?: boolean;
  submitLabel?: string;
}

export function DynamicForm({ fields, onSubmit, loading, submitLabel = "Submit" }: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setValue = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.required && !values[f.name]) {
        newErrors[f.name] = `${f.label} is required`;
      }
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    onSubmit(values);
  };

  const inputClasses =
    "w-full h-10 px-3 rounded-lg bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/30 transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </label>

          {field.type === "textarea" ? (
            <textarea
              value={values[field.name] || ""}
              onChange={(e) => setValue(field.name, e.target.value)}
              className={inputClasses + " min-h-[100px] py-2.5 resize-y"}
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          ) : field.type === "select" ? (
            <select
              value={values[field.name] || ""}
              onChange={(e) => setValue(field.name, e.target.value)}
              className={inputClasses}
            >
              <option value="">Select {field.label.toLowerCase()}</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              value={values[field.name] || ""}
              onChange={(e) => setValue(field.name, e.target.value)}
              className={inputClasses}
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          )}

          {errors[field.name] && (
            <p className="text-xs text-destructive mt-1">{errors[field.name]}</p>
          )}
        </div>
      ))}

      <Button type="submit" disabled={loading} className="active:scale-[0.97] transition-transform">
        {loading ? "Submitting..." : submitLabel}
      </Button>
    </form>
  );
}
