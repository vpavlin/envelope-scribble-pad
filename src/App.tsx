
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { NotesProvider } from "@/context/NotesContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // This ensures queries aren't garbage collected too quickly
      // which helps when navigating between routes
      gcTime: 1000 * 60 * 5, // 5 minutes
      staleTime: 1000 * 60, // 1 minute
      retry: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <NotesProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/envelope/:envelopeId" element={<Index />} />
            <Route path="/label/:labelId" element={<Index />} />
            <Route path="/note/:noteId" element={<Index />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </NotesProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
