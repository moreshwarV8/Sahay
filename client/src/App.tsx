import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PathwayGenerator from "./pages/PathwayGenerator";
import Profile from "./pages/profile";
import Research from "./pages/GamifiedLearning";
import Community from "./pages/Community";
import SignupPage from "./pages/signnnup";
import Testmonial from "./pages/Testimonials";
import LoginPage from "./pages/loginpage";
import SkillAssessmentPage from "./pages/SkillAssessment";

// Import the Job Portal component from the new folder structure
import JobPortal from "@/components/JobPortal/JobPortal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/PathwayGenerator" element={<PathwayGenerator />} />
          <Route path="/GamifiedLearning" element={<Research />} />
          {/* Use the new JobPortal component for job search */}
          <Route path="/JobSearch" element={<JobPortal />} />
          <Route path="/Community" element={<Community />} />
          <Route path="/signnnup" element={<SignupPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/Testimonials" element={<Testmonial />} />
          <Route path="/loginpage" element={<LoginPage />} />
          <Route path="/Assessment" element={<SkillAssessmentPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
