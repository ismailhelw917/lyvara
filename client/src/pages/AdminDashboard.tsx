import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  BarChart2,
  RefreshCw,
  FileText,
  Layout,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Settings,
  Gem,
  ArrowLeft,
  Star,
  Activity,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// ─── Auth Guard ───────────────────────────────────────────────────────────────
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--gold)" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-center">
          <Gem className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--gold)" }} />
          <h2 className="font-serif text-2xl mb-4" style={{ color: "var(--foreground)" }}>Admin Access Required</h2>
          <a href={getLoginUrl()} className="btn-luxury-filled">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--destructive)" }} />
          <h2 className="font-serif text-2xl mb-2" style={{ color: "var(--foreground)" }}>Access Denied</h2>
          <p className="font-sans text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>You need admin privileges to access this page.</p>
          <Link href="/" className="btn-luxury">Go Home</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="p-6 rounded" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-sans text-xs tracking-widest uppercase" style={{ color: "var(--muted-foreground)", fontSize: "0.6rem" }}>
          {label}
        </span>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="font-serif text-3xl font-light" style={{ color: "var(--foreground)" }}>
        {value}
      </div>
    </div>
  );
}

// ─── Analytics Section ────────────────────────────────────────────────────────
function AnalyticsSection() {
  const { data: summary } = trpc.analytics.summary.useQuery({ days: 30 });
  const { data: daily } = trpc.analytics.daily.useQuery({ days: 14 });
  const { data: topProducts } = trpc.analytics.topProducts.useQuery({ limit: 5 });

  // Process daily data for chart
  const chartData = (() => {
    if (!daily) return [];
    const byDate: Record<string, Record<string, number>> = {};
    daily.forEach((row) => {
      if (!byDate[row.date]) byDate[row.date] = {};
      byDate[row.date][row.eventType] = row.count;
    });
    return Object.entries(byDate).map(([date, events]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      clicks: (events.product_click || 0) + (events.affiliate_click || 0),
      views: events.page_view || 0,
      blog: events.blog_view || 0,
    }));
  })();

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Clicks" value={summary?.totalClicks || 0} icon={Activity} color="var(--gold)" />
        <StatCard label="Affiliate Clicks" value={summary?.affiliateClicks || 0} icon={TrendingUp} color="var(--rose-gold)" />
        <StatCard label="Page Views" value={summary?.pageViews || 0} icon={BarChart2} color="var(--silver)" />
        <StatCard label="Blog Views" value={summary?.blogViews || 0} icon={FileText} color="oklch(0.65 0.12 250)" />
      </div>

      {/* Daily Chart */}
      {chartData.length > 0 && (
        <div className="p-6 rounded" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-serif text-lg mb-4" style={{ color: "var(--foreground)" }}>Traffic (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--rose-gold)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--rose-gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <Tooltip
                contentStyle={{ fontFamily: "var(--font-sans)", fontSize: "12px", border: "1px solid var(--border)" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "var(--font-sans)" }} />
              <Area type="monotone" dataKey="clicks" stroke="var(--gold)" fill="url(#colorClicks)" strokeWidth={2} name="Clicks" />
              <Area type="monotone" dataKey="views" stroke="var(--rose-gold)" fill="url(#colorViews)" strokeWidth={2} name="Page Views" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Products */}
      {topProducts && topProducts.length > 0 && (
        <div className="p-6 rounded" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-serif text-lg mb-4" style={{ color: "var(--foreground)" }}>Top Performing Products</h3>
          <div className="space-y-3">
            {topProducts.map((product, i) => (
              <div key={product.id} className="flex items-center gap-4 p-3 rounded" style={{ background: "var(--champagne)" }}>
                <span className="font-serif text-lg w-6 text-center" style={{ color: "var(--gold)" }}>{i + 1}</span>
                {product.imageUrl && (
                  <img src={product.imageUrl} alt={product.title} className="w-10 h-10 object-cover rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-xs font-medium truncate" style={{ color: "var(--foreground)" }}>{product.title}</p>
                  <p className="font-sans text-xs" style={{ color: "var(--muted-foreground)", fontSize: "0.6rem" }}>
                    {product.clickCount} clicks · Score: {product.performanceScore?.toFixed(1)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-sm" style={{ color: "var(--gold-dark)" }}>${product.price}</p>
                  {product.isFeatured && <span className="badge-gold text-xs">Featured</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Automation Controls ──────────────────────────────────────────────────────
function AutomationSection() {
  const { data: logs, refetch: refetchLogs } = trpc.automation.logs.useQuery({ limit: 10 });

  const fetchProducts = trpc.automation.triggerProductFetch.useMutation({
    onSuccess: () => refetchLogs(),
  });
  const generateBlog = trpc.automation.triggerBlogGeneration.useMutation({
    onSuccess: () => refetchLogs(),
  });
  const optimizeLayout = trpc.automation.triggerLayoutOptimization.useMutation({
    onSuccess: () => refetchLogs(),
  });
  const scorePerformance = trpc.automation.triggerPerformanceScoring.useMutation({
    onSuccess: () => refetchLogs(),
  });

  const isAnyRunning = fetchProducts.isPending || generateBlog.isPending || optimizeLayout.isPending || scorePerformance.isPending;

  const controls = [
    {
      label: "Fetch Products",
      desc: "Refresh jewelry catalog from Amazon",
      icon: RefreshCw,
      action: () => fetchProducts.mutate(),
      loading: fetchProducts.isPending,
      color: "var(--gold)",
    },
    {
      label: "Generate Blog Post",
      desc: "Create AI-powered editorial content",
      icon: FileText,
      action: () => generateBlog.mutate(),
      loading: generateBlog.isPending,
      color: "var(--rose-gold)",
    },
    {
      label: "Optimize Layout",
      desc: "Promote top sellers, replace underperformers",
      icon: Layout,
      action: () => optimizeLayout.mutate(),
      loading: optimizeLayout.isPending,
      color: "var(--silver)",
    },
    {
      label: "Score Performance",
      desc: "Recalculate all product performance scores",
      icon: TrendingUp,
      action: () => scorePerformance.mutate(),
      loading: scorePerformance.isPending,
      color: "oklch(0.65 0.12 250)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Control Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {controls.map((ctrl) => (
          <div key={ctrl.label} className="p-5 rounded" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${ctrl.color}20` }}>
                <ctrl.icon className="w-5 h-5" style={{ color: ctrl.color }} />
              </div>
              <div className="flex-1">
                <h4 className="font-sans text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>{ctrl.label}</h4>
                <p className="font-sans text-xs font-light mb-3" style={{ color: "var(--muted-foreground)" }}>{ctrl.desc}</p>
                <button
                  onClick={ctrl.action}
                  disabled={isAnyRunning}
                  className="btn-luxury text-xs px-4 py-2 flex items-center gap-2 disabled:opacity-50"
                  style={{ borderColor: ctrl.color, color: ctrl.color }}
                >
                  {ctrl.loading ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Running...</>
                  ) : (
                    "Run Now"
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Automation Logs */}
      {logs && logs.length > 0 && (
        <div className="p-6 rounded" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-serif text-lg mb-4" style={{ color: "var(--foreground)" }}>Automation Logs</h3>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded text-xs" style={{ background: "var(--champagne)" }}>
                <div className="mt-0.5">
                  {log.status === "success" ? (
                    <CheckCircle className="w-4 h-4" style={{ color: "oklch(0.55 0.15 145)" }} />
                  ) : log.status === "failed" ? (
                    <XCircle className="w-4 h-4" style={{ color: "var(--destructive)" }} />
                  ) : (
                    <Clock className="w-4 h-4" style={{ color: "var(--gold)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans font-medium capitalize" style={{ color: "var(--foreground)" }}>
                      {log.jobType.replace("_", " ")}
                    </span>
                    <span className="font-sans" style={{ color: "var(--muted-foreground)", fontSize: "0.6rem" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {log.message && (
                    <p className="font-sans font-light mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>
                      {log.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"analytics" | "automation">("analytics");

  const tabs = [
    { id: "analytics" as const, label: "Analytics", icon: BarChart2 },
    { id: "automation" as const, label: "Automation", icon: Settings },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen" style={{ background: "var(--champagne)" }}>
        {/* Admin Header */}
        <div style={{ background: "oklch(0.14 0.015 30)" }} className="px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gem className="w-5 h-5" style={{ color: "var(--gold)" }} />
              <span className="font-serif text-lg tracking-widest" style={{ color: "var(--gold-light)" }}>
                LYVARA ADMIN
              </span>
            </div>
            <Link href="/" className="flex items-center gap-2 font-sans text-xs" style={{ color: "oklch(0.65 0.01 60)" }}>
              <ArrowLeft className="w-3 h-3" />
              View Site
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-light mb-1" style={{ color: "var(--foreground)" }}>
              Dashboard
            </h1>
            <p className="font-sans text-sm font-light" style={{ color: "var(--muted-foreground)" }}>
              Monitor performance and control automation
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 p-1 rounded-lg w-fit" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md font-sans text-xs transition-all duration-200"
                style={{
                  background: activeTab === tab.id ? "var(--gold)" : "transparent",
                  color: activeTab === tab.id ? "white" : "var(--muted-foreground)",
                  letterSpacing: "0.05em",
                }}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "analytics" && <AnalyticsSection />}
          {activeTab === "automation" && <AutomationSection />}
        </div>
      </div>
    </AdminGuard>
  );
}
