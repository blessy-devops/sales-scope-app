import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SetupCheck } from "@/components/SetupCheck";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Channels from "./pages/Channels";
import Targets from "./pages/Targets";
import Sales from "./pages/Sales";
import Settings from "./pages/Settings";
import Analises from "./pages/Analises";
import PerformanceDiaria from "./pages/PerformanceDiaria";
import Sazonalidade from "./pages/Sazonalidade";
import SocialMedia from "./pages/SocialMedia";
import Ferramentas from "./pages/Ferramentas";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Setup from "./pages/Setup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SetupCheck>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/setup" element={<Setup />} />
              
              {/* Protected routes */}
              <Route path="/change-password" element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              } />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Index />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/channels" element={
                <ProtectedRoute>
                  <Layout>
                    <Channels />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/targets" element={
                <ProtectedRoute>
                  <Layout>
                    <Targets />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/sales" element={
                <ProtectedRoute>
                  <Layout>
                    <Sales />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/analises" element={
                <ProtectedRoute>
                  <Layout>
                    <Analises />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/analises/performance-diaria" element={
                <ProtectedRoute>
                  <Layout>
                    <PerformanceDiaria />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/analises/sazonalidade" element={
                <ProtectedRoute>
                  <Layout>
                    <Sazonalidade />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/analises/social-media" element={
                <ProtectedRoute>
                  <Layout>
                    <SocialMedia />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/ferramentas" element={
                <ProtectedRoute>
                  <Layout>
                    <Ferramentas />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </SetupCheck>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
