import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Search, Gem } from "lucide-react";

const categories = [
  { label: "Classic", href: "/shop" },
  { label: "Bargains", href: "/shop?sort=price_asc" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-card py-3"
            : "py-5"
        }`}
        style={!scrolled ? {
          background: "linear-gradient(to bottom, rgba(10,8,5,0.65) 0%, transparent 100%)",
        } : {}}
      >
        <div className="container flex items-center justify-between">
          {/* Logo — explicit flex-shrink-0 on icon prevents overlap */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <Gem
              className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:rotate-12"
              style={{ color: "var(--gold)" }}
            />
            <span
              className="font-serif text-xl leading-none whitespace-nowrap"
              style={{
                color: scrolled ? "var(--gold-dark)" : "var(--gold-light)",
                letterSpacing: "0.18em",
              }}
            >
              LYVARA
            </span>
            <span
              className="font-sans text-xs font-light hidden sm:inline-block leading-none whitespace-nowrap"
              style={{
                color: scrolled ? "var(--muted-foreground)" : "rgba(255,255,255,0.6)",
                letterSpacing: "0.22em",
              }}
            >
              JEWELS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: "/shop", label: "All Jewelry", match: location === "/shop" },
              ...categories.map((c) => ({ href: c.href, label: c.label, match: location === c.href })),
              { href: "/journal", label: "Journal", match: location.startsWith("/journal") },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${item.match ? "active" : ""}`}
                style={{ color: scrolled ? "var(--foreground)" : "rgba(255,255,255,0.85)" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-full hover:bg-secondary transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
            </button>
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" style={{ color: "var(--foreground)" }} />
              ) : (
                <Menu className="w-5 h-5" style={{ color: "var(--foreground)" }} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer */}
          <nav
            className="absolute top-0 right-0 h-full w-72 bg-white shadow-hover flex flex-col"
            style={{ maxWidth: "85vw" }}
          >
            {/* Drawer Header */}
            <div
              className="flex items-center justify-between px-6 py-5 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              {/* Logo in drawer — icon + text side by side, no overlap */}
              <div className="flex items-center gap-2">
                <Gem className="w-4 h-4 flex-shrink-0" style={{ color: "var(--gold)" }} />
                <span
                  className="font-serif text-base tracking-widest"
                  style={{ color: "var(--gold-dark)", letterSpacing: "0.18em" }}
                >
                  LYVARA JEWELS
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* Nav Links */}
            <div className="flex flex-col px-6 py-4 gap-0.5 flex-1 overflow-y-auto">
              <Link
                href="/shop"
                className="py-3.5 nav-link text-sm border-b"
                style={{ color: "var(--foreground)", borderColor: "var(--border)" }}
              >
                All Jewelry
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="py-3.5 nav-link text-sm border-b"
                  style={{ color: "var(--foreground)", borderColor: "var(--border)" }}
                >
                  {cat.label}
                </Link>
              ))}
              <div className="py-2" />
              <Link
                href="/journal"
                className="py-3.5 nav-link text-sm"
                style={{ color: "var(--foreground)" }}
              >
                Journal
              </Link>
            </div>

            {/* Drawer Footer */}
            <div
              className="px-6 py-5 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <p
                className="text-xs font-sans font-light tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                Curated luxury jewelry, delivered daily
              </p>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
