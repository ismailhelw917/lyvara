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
      <Route key="home" path="/" component={Home} />
      <Route key="shop" path="/shop" component={Products} />
      <Route key="shop-category" path="/shop/:category" component={Products} />
      <Route key="journal" path="/journal" component={BlogList} />
      <Route key="journal-post" path="/journal/:slug" component={BlogPost} />
      <Route key="product-detail" path="/product/:id" component={ProductDetail} />
      <Route key="admin" path="/admin" component={AdminDashboard} />
      <Route key="404" path="/404" component={NotFound} />
      <Route key="not-found" component={NotFound} />
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
