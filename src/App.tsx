import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Billing from "./pages/Billing";
import Diagnostic from "./pages/Diagnostic";
import TrainingPlan from "./pages/TrainingPlan";
import ModuleStudio from "./pages/ModuleStudio";
import ModuleStudioLanding from "./pages/ModuleStudioLanding";
import CertificateGenerator from "./pages/CertificateGenerator";
import Marketplace from "./pages/Marketplace";
import AIPlanBuilder from "./pages/AIPlanBuilder";
import Analytics from "./pages/Analytics";
import UserManagement from "./pages/UserManagement";
import TeamCollaboration from "./pages/TeamCollaboration";
import Navigation from "./components/Navigation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex min-h-screen">
            <Navigation />
            <main className="flex-1 main-content">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/diagnostic" element={<Diagnostic />} />
                <Route path="/training-plan/:id" element={<TrainingPlan />} />
                <Route path="/module-studio" element={<ModuleStudioLanding />} />
                <Route path="/module-studio/:planId" element={<ModuleStudio />} />
                <Route path="/module-studio/:planId/:moduleId" element={<ModuleStudio />} />
                <Route path="/certificate-generator" element={<CertificateGenerator />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/ai-plan-builder" element={<AIPlanBuilder />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/team-collaboration" element={<TeamCollaboration />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
