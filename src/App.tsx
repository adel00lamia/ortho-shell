import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FeatureErrorBoundary } from "@/components/error-boundaries/FeatureErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";

import WorkforceOrg from "./pages/WorkforceOrg";
import SkillsGaps from "./pages/SkillsGaps";
import AssessmentReportPage from "./pages/AssessmentReportPage";
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
import OFPPTReimbursement from "./pages/OFPPTReimbursement";
import ManagerDashboard from "./pages/ManagerDashboard";
import Referrals from "./pages/Referrals";
import Career from "./pages/Career";
import JobBoard from "./pages/JobBoard";
import TalentPipeline from "./pages/TalentPipeline";
import HRKnowledgeBase from "./pages/HRKnowledgeBase";
import { HierarchicalSidebar } from "./components/navigation/HierarchicalSidebar";
import { Breadcrumbs } from "./components/shared/Breadcrumbs";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import SubscriptionGate from "./components/SubscriptionGate";
import CompanyProfile from "./pages/CompanyProfile";
import { CommandPalette } from "./components/command-palette/CommandPalette";
import { OnboardingChecklist } from "./components/onboarding/OnboardingChecklist";
import { PWAInstallBanner } from "./components/pwa/PWAInstallBanner";
import { TrialBanner } from "./components/billing/TrialBanner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedLayout = ({ children, featureName }: { children: React.ReactNode; featureName?: string }) => (
  <ProtectedRoute>
    <div className="flex w-full min-h-screen">
      <HierarchicalSidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <TrialBanner />
        <Breadcrumbs />
        <main className="flex-1">
          <FeatureErrorBoundary featureName={featureName}>
            {children}
          </FeatureErrorBoundary>
        </main>
      </div>
    </div>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CommandPalette />
            <OnboardingChecklist />
            <PWAInstallBanner />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/pricing" element={<Pricing />} />
              
              {/* Protected routes with sidebar */}
              <Route path="/dashboard" element={<ProtectedLayout featureName="Dashboard"><Dashboard /></ProtectedLayout>} />

              {/* Company Profile - pre-diagnostic */}
              <Route path="/company-profile" element={<ProtectedLayout featureName="Company Profile"><CompanyProfile /></ProtectedLayout>} />

              {/* Workflow Routes - Assess */}
              <Route path="/workflow/assess/workforce" element={<ProtectedLayout featureName="Workforce & Org"><WorkforceOrg /></ProtectedLayout>} />
              <Route path="/workflow/assess/performance" element={<ProtectedLayout featureName="Performance Evaluation"><PerformanceEvaluation /></ProtectedLayout>} />
              <Route path="/workflow/assess/skills" element={<ProtectedLayout featureName="Skills & Gaps"><SkillsGaps /></ProtectedLayout>} />
              <Route path="/workflow/assess/report" element={<ProtectedLayout featureName="360° Report"><AssessmentReportPage /></ProtectedLayout>} />
              {/* Legacy assess routes */}
              <Route path="/workflow/assess/diagnostic" element={<Navigate to="/workflow/assess/skills" replace />} />
              <Route path="/workflow/assess/benchmark" element={<Navigate to="/workflow/assess/report" replace />} />
              
              {/* Workflow Routes - Plan */}
              <Route path="/workflow/plan/builder" element={<ProtectedLayout featureName="AI Plan Builder"><SubscriptionGate requiredPlan="starter"><AIPlanBuilder /></SubscriptionGate></ProtectedLayout>} />
              <Route path="/workflow/plan/plans" element={<ProtectedLayout featureName="Training Plans"><SubscriptionGate requiredPlan="starter"><AIPlanBuilder /></SubscriptionGate></ProtectedLayout>} />
              <Route path="/workflow/plan/plans/:id" element={<ProtectedLayout featureName="Training Plan"><TrainingPlan /></ProtectedLayout>} />

              {/* Workflow Routes - Execute */}
              <Route path="/workflow/execute/modules" element={<ProtectedLayout featureName="Module Studio"><SubscriptionGate requiredPlan="starter"><ModuleStudio /></SubscriptionGate></ProtectedLayout>} />
              <Route path="/workflow/execute/modules/:planId" element={<ProtectedLayout featureName="Module Studio"><SubscriptionGate requiredPlan="starter"><ModuleStudio /></SubscriptionGate></ProtectedLayout>} />
              <Route path="/workflow/execute/modules/:planId/:moduleId" element={<ProtectedLayout featureName="Module Studio"><SubscriptionGate requiredPlan="starter"><ModuleStudio /></SubscriptionGate></ProtectedLayout>} />
              <Route path="/workflow/execute/marketplace" element={<ProtectedLayout featureName="Marketplace"><Marketplace /></ProtectedLayout>} />

              {/* Workflow Routes - Track */}
              <Route path="/workflow/track/analytics" element={<ProtectedLayout featureName="Analytics"><SubscriptionGate requiredPlan="professional"><Analytics /></SubscriptionGate></ProtectedLayout>} />
              <Route path="/workflow/track/progress" element={<Navigate to="/workflow/track/analytics" replace />} />
              <Route path="/workflow/track/certificates" element={<ProtectedLayout featureName="Certificates"><CertificateGenerator /></ProtectedLayout>} />
              <Route path="/workflow/track/reimbursement" element={<ProtectedLayout featureName="OFPPT Reimbursement"><OFPPTReimbursement /></ProtectedLayout>} />

              {/* Manager Dashboard */}
              <Route path="/manager" element={<ProtectedLayout featureName="Manager Dashboard"><ManagerDashboard /></ProtectedLayout>} />

              {/* Management Routes */}
              <Route path="/manage/users" element={<ProtectedLayout featureName="User Management"><UserManagement /></ProtectedLayout>} />
              <Route path="/manage/team" element={<ProtectedLayout featureName="Team"><TeamCollaboration /></ProtectedLayout>} />
              <Route path="/manage/settings" element={<ProtectedLayout featureName="Settings"><Settings /></ProtectedLayout>} />

              {/* Billing & Growth */}
              <Route path="/billing" element={<ProtectedLayout featureName="Billing"><Billing /></ProtectedLayout>} />
              <Route path="/referrals" element={<ProtectedLayout featureName="Referrals"><Referrals /></ProtectedLayout>} />

              {/* Career & Talent */}
              <Route path="/career" element={<ProtectedLayout featureName="Career"><Career /></ProtectedLayout>} />
              <Route path="/career/jobs" element={<ProtectedLayout featureName="Job Board"><JobBoard /></ProtectedLayout>} />
              <Route path="/manage/talent" element={<ProtectedLayout featureName="Talent Pipeline"><TalentPipeline /></ProtectedLayout>} />
              
              {/* Legacy route redirects */}
              <Route path="/diagnostic" element={<Navigate to="/workflow/assess/skills" replace />} />
              <Route path="/performance-evaluation" element={<Navigate to="/workflow/assess/performance" replace />} />
              <Route path="/benchmark" element={<Navigate to="/workflow/assess/report" replace />} />
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
              <Route path="/profile" element={<Navigate to="/manage/settings" replace />} />
              <Route path="/ofppt-reimbursement" element={<Navigate to="/workflow/track/reimbursement" replace />} />
              <Route path="/training-plan" element={<Navigate to="/workflow/plan/plans" replace />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
