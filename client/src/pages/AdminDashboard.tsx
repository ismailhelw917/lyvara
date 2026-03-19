import { useState } from "react";
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
  Activity,
  Calendar,
  ChevronDown,
  Zap,
  Eye,
  MousePointer,
  BookOpen,
  Star,
  Cpu,
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
          <a href={getLoginUrl()} className="btn-luxury-filled">Sign In</a>
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
          <p className="font-sans text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>Admin privileges required.</p>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Clicks" value={summary?.totalClicks || 0} icon={Activity} color="var(--gold)" />
        <StatCard label="Affiliate Clicks" value={summary?.affiliateClicks || 0} icon={TrendingUp} color="var(--rose-gold)" />
        <StatCard label="Page Views" value={summary?.pageViews || 0} icon={BarChart2} color="var(--silver)" />
        <StatCard label="Blog Views" value={summary?.blogViews || 0} icon={FileText} color="oklch(0.65 0.12 250)" />
      </div>

      {chartData.length > 0 && (
        <div className="p-6 rounded" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-serif text-lg mb-4" style={{ color: "var(--foreground)" }}>Traffic — Last 14 Days</h3>
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
              <Tooltip contentStyle={{ fontFamily: "var(--font-sans)", fontSize: "12px", border: "1px solid var(--border)" }} />
              <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "var(--font-sans)" }} />
              <Area type="monotone" dataKey="clicks" stroke="var(--gold)" fill="url(#colorClicks)" strokeWidth={2} name="Clicks" />
              <Area type="monotone" dataKey="views" stroke="var(--rose-gold)" fill="url(#colorViews)" strokeWidth={2} name="Page Views" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

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

// ─── Blog Content Type Labels ─────────────────────────────────────────────────
const CONTENT_TYPES = [
  { value: "style_guide",     label: "Style Guide",      desc: "How to layer & style jewelry" },
  { value: "trend_report",    label: "Trend Report",     desc: "Seasonal & runway trends" },
  { value: "gift_ideas",      label: "Gift Guide",       desc: "Curated gift recommendations" },
  { value: "care_tips",       label: "Care Tips",        desc: "Jewelry care & maintenance" },
  { value: "brand_spotlight", label: "Brand Spotlight",  desc: "Featured brand deep-dive" },
  { value: "seasonal",        label: "Seasonal Edit",    desc: "Season-specific curation" },
  { value: "promotional",     label: "Promotional",      desc: "Deals & featured collections" },
] as const;

type ContentTypeValue = typeof CONTENT_TYPES[number]["value"];

// ─── Automation Schedule Card ─────────────────────────────────────────────────
function ScheduleCard({ time, label, desc, color }: { time: string; label: string; desc: string; color: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded" style={{ background: "var(--champagne)" }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${color}25` }}>
        <Calendar className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-sans text-xs font-semibold" style={{ color: "var(--foreground)" }}>{label}</span>
          <span className="font-sans text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>{time}</span>
        </div>
        <p className="font-sans text-xs font-light" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
      </div>
    </div>
  );
}

// ─── Automation Controls ──────────────────────────────────────────────────────
function AutomationSection() {
  const { data: logs, refetch: refetchLogs } = trpc.automation.logs.useQuery({ limit: 15 });
  const [selectedContentType, setSelectedContentType] = useState<ContentTypeValue | "auto">("auto");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const fetchProducts = trpc.automation.triggerProductFetch.useMutation({ onSuccess: () => refetchLogs() });
  const generateBlog = trpc.automation.triggerBlogGeneration.useMutation({ onSuccess: () => refetchLogs() });
  const optimizeLayout = trpc.automation.triggerLayoutOptimization.useMutation({ onSuccess: () => refetchLogs() });
  const scorePerformance = trpc.automation.triggerPerformanceScoring.useMutation({ onSuccess: () => refetchLogs() });

  const isAnyRunning = fetchProducts.isPending || generateBlog.isPending || optimizeLayout.isPending || scorePerformance.isPending;

  const handleGenerateBlog = () => {
    generateBlog.mutate(
      selectedContentType === "auto"
        ? undefined
        : { contentType: selectedContentType }
    );
  };

  const selectedLabel = selectedContentType === "auto"
    ? "Auto-rotate"
    : CONTENT_TYPES.find(t => t.value === selectedContentType)?.label ?? "Auto-rotate";

  return (
    <div className="space-y-6">

      {/* Automation Schedule */}
      <div className="p-6 rounded" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
        <h3 className="font-serif text-lg mb-1" style={{ color: "var(--foreground)" }}>Automation Schedule</h3>
        <p className="font-sans text-xs font-light mb-4" style={{ color: "var(--muted-foreground)" }}>
          All jobs run automatically — no action required
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ScheduleCard
            time="Every 24 hrs"
            label="Product Refresh"
            desc="Fetches new gold & silver jewelry from Amazon, updates prices and availability"
            color="var(--gold)"
          />
          <ScheduleCard
            time="Every 24 hrs"
            label="AI Blog Post"
            desc="Generates a new editorial post (style guide, trend report, gift guide, etc.) with a hero image"
            color="var(--rose-gold)"
          />
          <ScheduleCard
            time="Every 6 hrs"
            label="Performance Scoring"
            desc="Recalculates CTR, conversion rate, and revenue score for every product"
            color="oklch(0.65 0.12 250)"
          />
          <ScheduleCard
            time="Every 7 days"
            label="Layout Optimization"
            desc="Promotes top 20% performers to hero/featured slots, hides underperformers"
            color="var(--silver)"
          />
        </div>
      </div>

      {/* Manual Triggers */}
      <div className="p-6 rounded" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
        <h3 className="font-serif text-lg mb-1" style={{ color: "var(--foreground)" }}>Manual Triggers</h3>
        <p className="font-sans text-xs font-light mb-4" style={{ color: "var(--muted-foreground)" }}>
          Run any job immediately without waiting for the schedule
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fetch Products */}
          <div className="p-4 rounded border" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="w-4 h-4 flex-shrink-0" style={{ color: "var(--gold)" }} />
              <span className="font-sans text-sm font-medium" style={{ color: "var(--foreground)" }}>Fetch Products</span>
            </div>
            <p className="font-sans text-xs font-light mb-3" style={{ color: "var(--muted-foreground)" }}>
              Pull latest jewelry listings from Amazon across all categories
            </p>
            <button
              onClick={() => fetchProducts.mutate()}
              disabled={isAnyRunning}
              className="btn-luxury text-xs px-4 py-2 flex items-center gap-2 disabled:opacity-50"
              style={{ borderColor: "var(--gold)", color: "var(--gold)" }}
            >
              {fetchProducts.isPending ? <><Loader2 className="w-3 h-3 animate-spin" /> Running...</> : "Run Now"}
            </button>
          </div>

          {/* Generate Blog Post with content type selector */}
          <div className="p-4 rounded border" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "var(--rose-gold)" }} />
              <span className="font-sans text-sm font-medium" style={{ color: "var(--foreground)" }}>Generate Blog Post</span>
            </div>
            <p className="font-sans text-xs font-light mb-3" style={{ color: "var(--muted-foreground)" }}>
              AI writes a full editorial post with hero image and product links
            </p>
            {/* Content type picker */}
            <div className="relative mb-3">
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 rounded border text-xs font-sans"
                style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--champagne)" }}
              >
                <span>{selectedLabel}</span>
                <ChevronDown className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
              </button>
              {showTypeDropdown && (
                <div
                  className="absolute top-full left-0 right-0 z-10 mt-1 rounded border shadow-hover overflow-hidden"
                  style={{ background: "white", borderColor: "var(--border)" }}
                >
                  <button
                    className="w-full text-left px-3 py-2 text-xs font-sans hover:bg-champagne transition-colors"
                    style={{ color: selectedContentType === "auto" ? "var(--gold)" : "var(--foreground)" }}
                    onClick={() => { setSelectedContentType("auto"); setShowTypeDropdown(false); }}
                  >
                    Auto-rotate (recommended)
                  </button>
                  {CONTENT_TYPES.map(t => (
                    <button
                      key={t.value}
                      className="w-full text-left px-3 py-2 text-xs font-sans hover:bg-champagne transition-colors"
                      style={{ color: selectedContentType === t.value ? "var(--gold)" : "var(--foreground)" }}
                      onClick={() => { setSelectedContentType(t.value); setShowTypeDropdown(false); }}
                    >
                      <span className="font-medium">{t.label}</span>
                      <span className="ml-2" style={{ color: "var(--muted-foreground)" }}>— {t.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleGenerateBlog}
              disabled={isAnyRunning}
              className="btn-luxury text-xs px-4 py-2 flex items-center gap-2 disabled:opacity-50"
              style={{ borderColor: "var(--rose-gold)", color: "var(--rose-gold)" }}
            >
              {generateBlog.isPending ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</> : "Generate Now"}
            </button>
          </div>

          {/* Optimize Layout */}
          <div className="p-4 rounded border" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3 mb-2">
              <Layout className="w-4 h-4 flex-shrink-0" style={{ color: "var(--silver)" }} />
              <span className="font-sans text-sm font-medium" style={{ color: "var(--foreground)" }}>Optimize Layout</span>
            </div>
            <p className="font-sans text-xs font-light mb-3" style={{ color: "var(--muted-foreground)" }}>
              Promote top sellers to hero positions, deactivate underperformers
            </p>
            <button
              onClick={() => optimizeLayout.mutate()}
              disabled={isAnyRunning}
              className="btn-luxury text-xs px-4 py-2 flex items-center gap-2 disabled:opacity-50"
              style={{ borderColor: "var(--silver)", color: "var(--silver)" }}
            >
              {optimizeLayout.isPending ? <><Loader2 className="w-3 h-3 animate-spin" /> Running...</> : "Run Now"}
            </button>
          </div>

          {/* Score Performance */}
          <div className="p-4 rounded border" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.65 0.12 250)" }} />
              <span className="font-sans text-sm font-medium" style={{ color: "var(--foreground)" }}>Score Performance</span>
            </div>
            <p className="font-sans text-xs font-light mb-3" style={{ color: "var(--muted-foreground)" }}>
              Recalculate CTR, conversion rate, and revenue scores for all products
            </p>
            <button
              onClick={() => scorePerformance.mutate()}
              disabled={isAnyRunning}
              className="btn-luxury text-xs px-4 py-2 flex items-center gap-2 disabled:opacity-50"
              style={{ borderColor: "oklch(0.65 0.12 250)", color: "oklch(0.65 0.12 250)" }}
            >
              {scorePerformance.isPending ? <><Loader2 className="w-3 h-3 animate-spin" /> Running...</> : "Run Now"}
            </button>
          </div>
        </div>
      </div>

      {/* Automation Logs */}
      {logs && logs.length > 0 && (
        <div className="p-6 rounded" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-serif text-lg mb-4" style={{ color: "var(--foreground)" }}>Recent Automation Logs</h3>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded text-xs" style={{ background: "var(--champagne)" }}>
                <div className="mt-0.5 flex-shrink-0">
                  {log.status === "success" ? (
                    <CheckCircle className="w-4 h-4" style={{ color: "oklch(0.55 0.15 145)" }} />
                  ) : log.status === "failed" ? (
                    <XCircle className="w-4 h-4" style={{ color: "var(--destructive)" }} />
                  ) : (
                    <Clock className="w-4 h-4" style={{ color: "var(--gold)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-sans font-medium capitalize" style={{ color: "var(--foreground)" }}>
                      {log.jobType.replace(/_/g, " ")}
                    </span>
                    <span className="font-sans" style={{ color: "var(--muted-foreground)", fontSize: "0.6rem" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {log.message && (
                    <p className="font-sans font-light mt-0.5" style={{ color: "var(--muted-foreground)", wordBreak: "break-word" }}>
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


// ─── CounterAPI Live Stats Section ───────────────────────────────────────────
function CounterStatsSection() {
  const { data: counters, isLoading, refetch } = trpc.automation.counters.useQuery();

  const stats = [
    { key: "page-views" as const, label: "Page Views", icon: Eye, color: "var(--gold)" },
    { key: "product-clicks" as const, label: "Product & Affiliate Clicks", icon: MousePointer, color: "var(--rose-gold)" },
    { key: "content-events" as const, label: "Blog Reads & Searches", icon: BookOpen, color: "oklch(0.55 0.12 250)" },
    { key: "review-events" as const, label: "Review Interactions", icon: Star, color: "oklch(0.55 0.14 160)" },
    { key: "automation-runs" as const, label: "Automation Job Runs", icon: Cpu, color: "oklch(0.50 0.10 300)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-light" style={{ color: "var(--foreground)" }}>Live Event Counters</h2>
          <p className="font-sans text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Powered by CounterAPI — cumulative counts since launch</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 btn-luxury text-xs px-4 py-2">
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((s) => (
            <div key={s.key} className="p-5 rounded animate-pulse" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
              <div className="skeleton h-8 w-16 rounded mb-2" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((s) => {
            const count = (counters as any)?.[s.key] ?? 0;
            const Icon = s.icon;
            return (
              <div key={s.key} className="p-5 rounded" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${s.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                </div>
                <div className="font-serif text-3xl font-light mb-1" style={{ color: "var(--foreground)" }}>
                  {count.toLocaleString()}
                </div>
                <div className="font-sans text-xs" style={{ color: "var(--muted-foreground)", fontSize: "0.65rem", letterSpacing: "0.05em" }}>
                  {s.label.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="p-5 rounded" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
        <h3 className="font-serif text-base font-light mb-4" style={{ color: "var(--foreground)" }}>Counter Breakdown</h3>
        <div className="space-y-3">
          {stats.map((s) => {
            const count = (counters as any)?.[s.key] ?? 0;
            const maxCount = Math.max(...stats.map((st) => (counters as any)?.[st.key] ?? 0), 1);
            const pct = Math.round((count / maxCount) * 100);
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex items-center gap-4">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: s.color }} />
                <span className="font-sans text-xs w-44 flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>{s.label}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--champagne)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: s.color }} />
                </div>
                <span className="font-sans text-xs font-medium w-12 text-right" style={{ color: "var(--foreground)" }}>
                  {count.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"analytics" | "automation" | "counters">("analytics");

  const tabs = [
    { id: "analytics" as const, label: "Analytics", icon: BarChart2 },
    { id: "automation" as const, label: "Automation", icon: Settings },
    { id: "counters" as const, label: "Live Counters", icon: Zap },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen" style={{ background: "var(--champagne)" }}>
        {/* Admin Header */}
        <div style={{ background: "oklch(0.14 0.015 30)" }} className="px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gem className="w-5 h-5 flex-shrink-0" style={{ color: "var(--gold)" }} />
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

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-light mb-1" style={{ color: "var(--foreground)" }}>Dashboard</h1>
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

          {activeTab === "analytics" && <AnalyticsSection />}
          {activeTab === "automation" && <AutomationSection />}
          {activeTab === "counters" && <CounterStatsSection />}
        </div>
      </div>
    </AdminGuard>
  );
}
