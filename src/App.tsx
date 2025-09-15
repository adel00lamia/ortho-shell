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
import CertificateGenerator from "./pages/CertificateGenerator";
import Marketplace from "./pages/Marketplace";
import AIPlanBuilder from "./pages/AIPlanBuilder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/diagnostic" element={<Diagnostic />} />
            <Route path="/training-plan/:id" element={<TrainingPlan />} />
            <Route path="/module-studio/:planId" element={<ModuleStudio />} />
            <Route path="/module-studio/:planId/:moduleId" element={<ModuleStudio />} />
            <Route path="/certificate-generator" element={<CertificateGenerator />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/ai-plan-builder" element={<AIPlanBuilder />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
