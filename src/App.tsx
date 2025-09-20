import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RoleBasedRedirect } from "@/components/RoleBasedRedirect";
import Index from "./pages/Index";
import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Features from "./pages/public/Features";
import Contact from "./pages/public/Contact";
import PublicMarketplace from "./pages/public/Marketplace";
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
import CompanyDashboard from "./pages/dashboard/CompanyDashboard";
import TrainerDashboard from "./pages/dashboard/TrainerDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/marketplace" element={<PublicMarketplace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/forgot-password" element={<div>Password Reset - Coming Soon</div>} />
            
            {/* Routes with Navigation */}
            <Route path="/*" element={
              <div className="flex min-h-screen">
                <Navigation />
                <main className="flex-1 main-content">
                  <Routes>
                    {/* Protected Routes - Role-based redirection */}
                    <Route path="/" element={<RoleBasedRedirect />} />
                    <Route path="/dashboard" element={<RoleBasedRedirect />} />
                    
                    {/* Public with Navigation */}
                    <Route path="/pricing" element={<Pricing />} />
                    
                    {/* Legacy routes for backward compatibility */}
                    <Route path="/index" element={<Index />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/diagnostic" element={<Diagnostic />} />
                    <Route path="/training-plan/:id" element={<TrainingPlan />} />
                    <Route path="/module-studio" element={<ModuleStudioLanding />} />
                    <Route path="/module-studio/:planId" element={<ModuleStudio />} />
                    <Route path="/module-studio/:planId/:moduleId" element={<ModuleStudio />} />
                    <Route path="/certificate-generator" element={<CertificateGenerator />} />
                    <Route path="/ai-plan-builder" element={<AIPlanBuilder />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/user-management" element={<UserManagement />} />
                    <Route path="/team-collaboration" element={<TeamCollaboration />} />
                    
                    {/* Company Dashboard Routes */}
                    <Route path="/dashboard/company" element={<CompanyDashboard />} />
                    <Route path="/dashboard/company/diagnostic" element={<Diagnostic />} />
                    <Route path="/dashboard/company/compliance" element={<div>Compliance Tracker - Coming Soon</div>} />
                    <Route path="/dashboard/company/kpi" element={<Analytics />} />
                    <Route path="/dashboard/company/certificates" element={<CertificateGenerator />} />
                    
                    {/* Trainer Dashboard Routes */}
                    <Route path="/dashboard/trainer" element={<TrainerDashboard />} />
                    <Route path="/dashboard/trainer/profile" element={<div>Profile Manager - Coming Soon</div>} />
                    <Route path="/dashboard/trainer/catalog" element={<div>Training Catalog - Coming Soon</div>} />
                    <Route path="/dashboard/trainer/studio" element={<ModuleStudio />} />
                    <Route path="/dashboard/trainer/compliance" element={<div>Evaluation Forms - Coming Soon</div>} />
                    <Route path="/dashboard/trainer/certificates" element={<CertificateGenerator />} />
                    
                    {/* Admin Dashboard Routes */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<UserManagement />} />
                    <Route path="/admin/marketplace" element={<div>Marketplace Control - Coming Soon</div>} />
                    <Route path="/admin/analytics" element={<Analytics />} />
                    
                    {/* Onboarding Routes */}
                    <Route path="/onboarding/company" element={<div>Company Onboarding - Coming Soon</div>} />
                    <Route path="/onboarding/trainer" element={<div>Trainer Onboarding - Coming Soon</div>} />
                    
                    {/* Catch-all route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
