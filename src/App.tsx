import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { lazy, Suspense } from "react";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { FeatureErrorBoundary } from "@/components/error-boundaries/FeatureErrorBoundary";
import { HierarchicalSidebar } from "./components/navigation/HierarchicalSidebar";
import { Breadcrumbs } from "./components/shared/Breadcrumbs";
import { TrialBanner } from "./components/billing/TrialBanner";
import { DashboardSkeleton } from "./components/skeletons/DashboardSkeleton";

// Eagerly loaded (public / always needed)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Billing = lazy(() => import("./pages/Billing"));
const Settings = lazy(() => import("./pages/Settings"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const WorkforceOrg = lazy(() => import("./pages/WorkforceOrg"));
const SkillsGaps = lazy(() => import("./pages/SkillsGaps"));
const AssessmentReportPage = lazy(() => import("./pages/AssessmentReportPage"));
const TrainingPlan = lazy(() => import("./pages/TrainingPlan"));
const ModuleStudio = lazy(() => import("./pages/ModuleStudio"));
const CertificateGenerator = lazy(() => import("./pages/CertificateGenerator"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const AIPlanBuilder = lazy(() => import("./pages/AIPlanBuilder"));
const IngenieriePage = lazy(() => import("./pages/IngenieriePage"));
const Analytics = lazy(() => import("./pages/Analytics"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const TeamCollaboration = lazy(() => import("./pages/TeamCollaboration"));
const PerformanceEvaluation = lazy(() => import("./pages/PerformanceEvaluation"));
const Benchmark = lazy(() => import("./pages/Benchmark"));
const OFPPTReimbursement = lazy(() => import("./pages/OFPPTReimbursement"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Career = lazy(() => import("./pages/Career"));
const JobBoard = lazy(() => import("./pages/JobBoard"));
const TalentPipeline = lazy(() => import("./pages/TalentPipeline"));
const HRKnowledgeBase = lazy(() => import("./pages/HRKnowledgeBase"));

// Lazy loaded components
const SubscriptionGate = lazy(() => import("./components/SubscriptionGate"));
const CommandPalette = lazy(() => import("./components/command-palette/CommandPalette").then(m => ({ default: m.CommandPalette })));
const OnboardingChecklist = lazy(() => import("./components/onboarding/OnboardingChecklist").then(m => ({ default: m.OnboardingChecklist })));
const PWAInstallBanner = lazy(() => import("./components/pwa/PWAInstallBanner").then(m => ({ default: m.PWAInstallBanner })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const ProtectedLayout = ({ children, featureName }: { children: React.ReactNode; featureName?: string }) => (
  <ProtectedRoute>
    <div className="flex w-full min-h-screen">
      <HierarchicalSidebar />
      <div className="flex-1 overflow-auto flex flex-col min-w-0">
        <TrialBanner />
        <Breadcrumbs />
        <main className="flex-1 pl-12 md:pl-0">
          <FeatureErrorBoundary featureName={featureName}>
            <Suspense fallback={<PageLoader />}>
              {children}
            </Suspense>
          </FeatureErrorBoundary>
        </main>
      </div>
    </div>
  </ProtectedRoute>
);

const GatedPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    <SubscriptionGate requiredPlan="starter">{children}</SubscriptionGate>
  </Suspense>
);

const ProGatedPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    <SubscriptionGate requiredPlan="professional">{children}</SubscriptionGate>
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={null}>
              <CommandPalette />
              <OnboardingChecklist />
              <PWAInstallBanner />
            </Suspense>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/pricing" element={<Suspense fallback={<PageLoader />}><Pricing /></Suspense>} />
              
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
              <Route path="/workflow/plan/ingenierie" element={<ProtectedLayout featureName="Ingénierie de Formation"><GatedPage><IngenieriePage /></GatedPage></ProtectedLayout>} />
              <Route path="/workflow/plan/builder" element={<ProtectedLayout featureName="AI Plan Builder"><GatedPage><AIPlanBuilder /></GatedPage></ProtectedLayout>} />
              <Route path="/workflow/plan/plans" element={<ProtectedLayout featureName="Training Plans"><GatedPage><AIPlanBuilder /></GatedPage></ProtectedLayout>} />
              <Route path="/workflow/plan/plans/:id" element={<ProtectedLayout featureName="Training Plan"><TrainingPlan /></ProtectedLayout>} />

              {/* Workflow Routes - Execute */}
              <Route path="/workflow/execute/modules" element={<ProtectedLayout featureName="Module Studio"><GatedPage><ModuleStudio /></GatedPage></ProtectedLayout>} />
              <Route path="/workflow/execute/modules/:planId" element={<ProtectedLayout featureName="Module Studio"><GatedPage><ModuleStudio /></GatedPage></ProtectedLayout>} />
              <Route path="/workflow/execute/modules/:planId/:moduleId" element={<ProtectedLayout featureName="Module Studio"><GatedPage><ModuleStudio /></GatedPage></ProtectedLayout>} />
              <Route path="/workflow/execute/marketplace" element={<ProtectedLayout featureName="Marketplace"><Marketplace /></ProtectedLayout>} />

              {/* Workflow Routes - Track */}
              <Route path="/workflow/track/analytics" element={<ProtectedLayout featureName="Analytics"><ProGatedPage><Analytics /></ProGatedPage></ProtectedLayout>} />
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
              <Route path="/hr-knowledge" element={<ProtectedLayout featureName="HR Knowledge Base"><HRKnowledgeBase /></ProtectedLayout>} />
              
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
              <Route path="/dashboard/trainer" element={<ProtectedLayout featureName="Trainer Dashboard"><RoleProtectedRoute allowedRoles={["trainer"]}><Dashboard /></RoleProtectedRoute></ProtectedLayout>} />
              {/* Role-scoped dashboard placeholders — each loads only for the matching role */}
              <Route path="/dashboard/admin" element={<ProtectedLayout featureName="Admin Dashboard"><RoleProtectedRoute allowedRoles={["admin"]}><Dashboard /></RoleProtectedRoute></ProtectedLayout>} />
              <Route path="/dashboard/hr" element={<ProtectedLayout featureName="HR Dashboard"><RoleProtectedRoute allowedRoles={["hr_manager"]}><Dashboard /></RoleProtectedRoute></ProtectedLayout>} />
              <Route path="/dashboard/trainer" element={<ProtectedLayout featureName="Trainer Dashboard"><RoleProtectedRoute allowedRoles={["trainer"]}><Dashboard /></RoleProtectedRoute></ProtectedLayout>} />
              <Route path="/dashboard/employee" element={<ProtectedLayout featureName="Employee Dashboard"><RoleProtectedRoute allowedRoles={["employee"]}><Dashboard /></RoleProtectedRoute></ProtectedLayout>} />
              <Route path="/dashboard/company" element={<ProtectedLayout featureName="Company Dashboard"><RoleProtectedRoute allowedRoles={["admin", "hr_manager"]}><Dashboard /></RoleProtectedRoute></ProtectedLayout>} />
              <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
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
