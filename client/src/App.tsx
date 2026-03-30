import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
    __GOOGLE_ADS_INITIALIZED__?: boolean;
  }
}

import Home from "./pages/Home";
import Products from "./pages/Products";
import BlogList from "./pages/BlogList";
import BlogPost from "./pages/BlogPost";
import AdminDashboard from "./pages/AdminDashboard";
import ProductDetail from "./pages/ProductDetail";

function Router() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Track page views with Google Ads
  useEffect(() => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'page_view', {
        page_path: location,
        page_title: document.title,
      });
    }
  }, [location]);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Products} />
      <Route path="/shop/:category" component={Products} />
      <Route path="/journal" component={BlogList} />
      <Route path="/journal/:slug" component={BlogPost} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize Google Ads on app load
  useEffect(() => {
    if (typeof window.gtag !== 'undefined' && !window.__GOOGLE_ADS_INITIALIZED__) {
      window.__GOOGLE_ADS_INITIALIZED__ = true;
      window.gtag('config', 'AW-18019264911');
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
