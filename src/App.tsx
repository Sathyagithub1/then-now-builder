import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Workers from "./pages/Workers";
import WorkerDetail from "./pages/WorkerDetail";
import Orders from "./pages/Orders";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AdvancedSearch from "./pages/AdvancedSearch";
import WorkerAvailability from "./pages/WorkerAvailability";
import SavedSearches from "./pages/SavedSearches";
import AdminPanel from "./pages/AdminPanel";
import MyWorkTypes from "./pages/MyWorkTypes";
import NotFound from "./pages/NotFound";
import JobPostings from "./pages/JobPostings";
import CreateJobPosting from "./pages/CreateJobPosting";
import Notifications from "./pages/Notifications";
import { NotificationToast } from "./components/notifications/NotificationToast";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <NotificationToast />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/workers/:id" element={<WorkerDetail />} />
          <Route path="/search" element={<AdvancedSearch />} />
          <Route path="/saved-searches" element={<SavedSearches />} />
          <Route path="/availability" element={<WorkerAvailability />} />
          <Route path="/my-work-types" element={<MyWorkTypes />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route path="/job-postings" element={<JobPostings />} />
          <Route path="/create-job" element={<CreateJobPosting />} />
          <Route path="/notifications" element={<Notifications />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
