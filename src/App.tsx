import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { WorkflowProvider } from "@/contexts/WorkflowContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import Billing from "./pages/Billing";
import Diagnostic from "./pages/Diagnostic";
import TrainingPlan from "./pages/TrainingPlan";
import ModuleStudio from "./pages/ModuleStudio";
import CertificateGenerator from "./pages/CertificateGenerator";
import Marketplace from "./pages/Marketplace";
import AIPlanBuilder from "./pages/AIPlanBuilder";
import Analytics from "./pages/Analytics";
import UserManagement from "./pages/UserManagement";
import TeamCollaboration from "./pages/TeamCollaboration";
import PerformanceEvaluation from "./pages/PerformanceEvaluation";
import Benchmark from "./pages/Benchmark";
import { HierarchicalSidebar } from "./components/navigation/HierarchicalSidebar";
import NotFound from "./pages/NotFound";
import { RoleBasedRedirect } from "./components/RoleBasedRedirect";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <div className="flex w-full min-h-screen">
      <HierarchicalSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  </ProtectedRoute>
);

const App = () => (
  <AuthProvider>
    <WorkflowProvider>
      <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/pricing" element={<Pricing />} />
              
              {/* Root redirect */}
              <Route path="/" element={<RoleBasedRedirect />} />
              
              {/* Protected routes with sidebar */}
              <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
              
              {/* Workflow Routes - Assess */}
              <Route path="/workflow/assess/diagnostic" element={<ProtectedLayout><Diagnostic /></ProtectedLayout>} />
              <Route path="/workflow/assess/performance" element={<ProtectedLayout><PerformanceEvaluation /></ProtectedLayout>} />
              <Route path="/workflow/assess/benchmark" element={<ProtectedLayout><Benchmark /></ProtectedLayout>} />
              
              {/* Workflow Routes - Plan */}
              <Route path="/workflow/plan/builder" element={<ProtectedLayout><AIPlanBuilder /></ProtectedLayout>} />
              <Route path="/workflow/plan/plans" element={<Navigate to="/dashboard" replace />} />
              <Route path="/workflow/plan/plans/:id" element={<ProtectedLayout><TrainingPlan /></ProtectedLayout>} />
              
              {/* Workflow Routes - Execute */}
              <Route path="/workflow/execute/modules" element={<ProtectedLayout><ModuleStudio /></ProtectedLayout>} />
              <Route path="/workflow/execute/modules/:planId" element={<ProtectedLayout><ModuleStudio /></ProtectedLayout>} />
              <Route path="/workflow/execute/modules/:planId/:moduleId" element={<ProtectedLayout><ModuleStudio /></ProtectedLayout>} />
              <Route path="/workflow/execute/marketplace" element={<ProtectedLayout><Marketplace /></ProtectedLayout>} />
              
              {/* Workflow Routes - Track */}
              <Route path="/workflow/track/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
              <Route path="/workflow/track/progress" element={<Navigate to="/workflow/track/analytics" replace />} />
              <Route path="/workflow/track/certificates" element={<ProtectedLayout><CertificateGenerator /></ProtectedLayout>} />
              
              {/* Management Routes */}
              <Route path="/manage/users" element={<ProtectedLayout><UserManagement /></ProtectedLayout>} />
              <Route path="/manage/team" element={<ProtectedLayout><TeamCollaboration /></ProtectedLayout>} />
              <Route path="/manage/settings" element={<Navigate to="/dashboard" replace />} />
              
              {/* Billing */}
              <Route path="/billing" element={<ProtectedLayout><Billing /></ProtectedLayout>} />
              
              {/* Legacy route redirects */}
              <Route path="/diagnostic" element={<Navigate to="/workflow/assess/diagnostic" replace />} />
              <Route path="/performance-evaluation" element={<Navigate to="/workflow/assess/performance" replace />} />
              <Route path="/benchmark" element={<Navigate to="/workflow/assess/benchmark" replace />} />
              <Route path="/ai-plan-builder" element={<Navigate to="/workflow/plan/builder" replace />} />
              <Route path="/module-studio" element={<Navigate to="/workflow/execute/modules" replace />} />
              <Route path="/marketplace" element={<Navigate to="/workflow/execute/marketplace" replace />} />
              <Route path="/analytics" element={<Navigate to="/workflow/track/analytics" replace />} />
              <Route path="/certificate-generator" element={<Navigate to="/workflow/track/certificates" replace />} />
              <Route path="/user-management" element={<Navigate to="/manage/users" replace />} />
              <Route path="/team-collaboration" element={<Navigate to="/manage/team" replace />} />
              <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard/company" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard/trainer" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WorkflowProvider>
    </AuthProvider>
);

export default App;
