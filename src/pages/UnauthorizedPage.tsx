import { ShieldOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center animate-in max-w-sm">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground mb-6">
          You don't have permission to access this page. Contact your administrator if you believe this is an error.
        </p>
        <Button onClick={() => navigate("/")} className="active:scale-[0.97] transition-transform">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
