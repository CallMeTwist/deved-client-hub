import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import ClientsListPage from "./pages/ClientsListPage";
import ClientProfilePage from "./pages/ClientProfilePage";
import ClientFormPage from "./pages/ClientFormPage";
import TemplatesPage from "./pages/TemplatesPage";
import TemplateFormPage from "./pages/TemplateFormPage";
import DynamicRecordFormPage from "./pages/DynamicRecordFormPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>

            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route path="/clients" element={<ProtectedRoute permission="view_clients"><ClientsListPage /></ProtectedRoute>} />
            <Route path="/clients/new" element={<ProtectedRoute permission="create_clients"><ClientFormPage /></ProtectedRoute>} />
            <Route path="/clients/:id" element={<ProtectedRoute permission="view_clients"><ClientProfilePage /></ProtectedRoute>} />
            <Route path="/clients/:id/edit" element={<ProtectedRoute permission="edit_clients"><ClientFormPage /></ProtectedRoute>} />
            <Route path="/clients/:clientId/records/new/:templateKey" element={<DynamicRecordFormPage />} />
            // Change all three template routes to:
            <Route path="/templates" element={
              <ProtectedRoute permission="manage_templates"><TemplatesPage /></ProtectedRoute>
            } />
            <Route path="/templates/new" element={
              <ProtectedRoute permission="manage_templates"><TemplateFormPage /></ProtectedRoute>
            } />
            <Route path="/templates/:id/edit" element={
              <ProtectedRoute permission="manage_templates"><TemplateFormPage /></ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
