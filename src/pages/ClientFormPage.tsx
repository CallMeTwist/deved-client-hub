// src/pages/ClientFormPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { clientsApi, type Client } from "@/services/api";

// ─── Form shape matches exactly what the backend accepts ─────────────────────

interface ClientForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  status: Client["status"];
}

const EMPTY_FORM: ClientForm = {
  first_name:                      "",
  last_name:                       "",
  email:                           "",
  phone:                           "",
  date_of_birth:                   "",
  gender:                          "",
  address:                         "",
  city:                            "",
  state:                           "",
  country:                         "",
  postal_code:                     "",
  emergency_contact_name:          "",
  emergency_contact_phone:         "",
  emergency_contact_relationship:  "",
  status:                          "active",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError]       = useState("");
  const [form, setForm]         = useState<ClientForm>(EMPTY_FORM);

  // When editing, hydrate form from the real client data
  useEffect(() => {
    if (!id) return;
    setFetching(true);
    clientsApi.get(Number(id))
      .then((c) => {
        setForm({
          first_name:                     c.first_name,
          last_name:                      c.last_name,
          email:                          c.email ?? "",
          phone:                          c.phone ?? "",
          date_of_birth:                  c.date_of_birth ?? "",
          gender:                         c.gender ?? "",
          address:                        c.address.line ?? "",
          city:                           c.address.city ?? "",
          state:                          c.address.state ?? "",
          country:                        c.address.country ?? "",
          postal_code:                    c.address.postal_code ?? "",
          emergency_contact_name:         c.emergency_contact.name ?? "",
          emergency_contact_phone:        c.emergency_contact.phone ?? "",
          emergency_contact_relationship: c.emergency_contact.relationship ?? "",
          status:                         c.status,
        });
      })
      .finally(() => setFetching(false));
  }, [id]);

  const set = (key: keyof ClientForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Build payload — omit empty strings so the backend treats them as null
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== "")
    );

    try {
      if (isEdit) {
        await clientsApi.update(Number(id), payload);
      } else {
        await clientsApi.create(payload);
      }
      navigate("/clients");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full h-10 px-3 rounded-lg bg-muted/40 border border-border text-sm text-foreground " +
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 " +
    "focus:border-primary/30 transition-all";

  const labelClasses = "block text-sm font-medium text-foreground mb-1.5";

  if (fetching) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading client...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-in">
        <button
          onClick={() => navigate(isEdit ? `/clients/${id}` : "/clients")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEdit ? "Back to Profile" : "Back to Clients"}
        </button>

        <div className="page-header">
          <h1 className="page-title">{isEdit ? "Edit Client" : "New Client"}</h1>
          <p className="page-subtitle">
            {isEdit
              ? "Update client information"
              : "Register a new client in the system"}
          </p>
        </div>
      </div>

      <div className="max-w-2xl animate-in animate-in-delay-1">
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-xl border border-border/50 shadow-sm p-6 space-y-6"
        >

          {/* Error banner */}
          {error && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ── Personal Information ──────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border/50">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>
                  First Name <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  className={inputClasses}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className={labelClasses}>
                  Last Name <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                  className={inputClasses}
                  placeholder="Last name"
                />
              </div>
              <div>
                <label className={labelClasses}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputClasses}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className={labelClasses}>Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={inputClasses}
                  placeholder="+234 800 000 0000"
                />
              </div>
              <div>
                <label className={labelClasses}>Date of Birth</label>
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  className={inputClasses}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClasses}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className={inputClasses}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Address ──────────────────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border/50">
              Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClasses}>Street Address</label>
                <input
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  className={inputClasses}
                  placeholder="123 Main Street"
                />
              </div>
              <div>
                <label className={labelClasses}>City</label>
                <input
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  className={inputClasses}
                  placeholder="Lagos"
                />
              </div>
              <div>
                <label className={labelClasses}>State</label>
                <input
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  className={inputClasses}
                  placeholder="Lagos State"
                />
              </div>
              <div>
                <label className={labelClasses}>Country</label>
                <input
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  className={inputClasses}
                  placeholder="Nigeria"
                />
              </div>
              <div>
                <label className={labelClasses}>Postal Code</label>
                <input
                  value={form.postal_code}
                  onChange={(e) => set("postal_code", e.target.value)}
                  className={inputClasses}
                  placeholder="100001"
                />
              </div>
            </div>
          </div>

          {/* ── Emergency Contact ─────────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border/50">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Contact Name</label>
                <input
                  value={form.emergency_contact_name}
                  onChange={(e) => set("emergency_contact_name", e.target.value)}
                  className={inputClasses}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className={labelClasses}>Contact Phone</label>
                <input
                  value={form.emergency_contact_phone}
                  onChange={(e) => set("emergency_contact_phone", e.target.value)}
                  className={inputClasses}
                  placeholder="+234 800 000 0000"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClasses}>Relationship</label>
                <input
                  value={form.emergency_contact_relationship}
                  onChange={(e) => set("emergency_contact_relationship", e.target.value)}
                  className={inputClasses}
                  placeholder="e.g. Spouse, Parent, Sibling"
                />
              </div>
            </div>
          </div>

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="active:scale-[0.97] transition-transform"
            >
              {loading
                ? "Saving..."
                : isEdit
                ? "Update Client"
                : "Create Client"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEdit ? `/clients/${id}` : "/clients")}
              className="active:scale-[0.97]"
            >
              Cancel
            </Button>
          </div>

        </form>
      </div>
    </AppLayout>
  );
}