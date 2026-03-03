import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RealtimeNotificationsProvider } from "@/components/RealtimeNotificationsProvider";
import Index from "./pages/Index";
import Devices from "./pages/Devices";
import DeviceDetails from "./pages/DeviceDetails";
import Screenshots from "./pages/Screenshots";
import Productivity from "./pages/Productivity";
import Activity from "./pages/Activity";
import Timeline from "./pages/Timeline";
import Goals from "./pages/Goals";
import AppsUrls from "./pages/AppsUrls";
import Sessions from "./pages/Sessions";
import Users from "./pages/Users";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import AgentDownload from "./pages/AgentDownload";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RealtimeNotificationsProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />
              <Route path="/devices/:id" element={<ProtectedRoute><DeviceDetails /></ProtectedRoute>} />
              <Route path="/screenshots" element={<ProtectedRoute><Screenshots /></ProtectedRoute>} />
              <Route path="/productivity" element={<ProtectedRoute><Productivity /></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
              <Route path="/timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
              <Route path="/apps-urls" element={<ProtectedRoute><AppsUrls /></ProtectedRoute>} />
              <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="/audit" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/agent-download" element={<ProtectedRoute><AgentDownload /></ProtectedRoute>} />
              <Route path="/super-admin" element={<ProtectedRoute><SuperAdmin /></ProtectedRoute>} />
              <Route path="/install" element={<Install />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RealtimeNotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
