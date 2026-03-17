import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Search, Gem } from "lucide-react";

const categories = [
  { label: "Necklaces", href: "/shop/necklaces" },
  { label: "Bracelets", href: "/shop/bracelets" },
  { label: "Rings", href: "/shop/rings" },
  { label: "Earrings", href: "/shop/earrings" },
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

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-card py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="container flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Gem
              className="w-5 h-5 text-gold transition-transform duration-300 group-hover:rotate-12"
              style={{ color: "var(--gold)" }}
            />
            <span
              className="font-serif text-xl tracking-widest"
              style={{ color: "var(--gold-dark)", letterSpacing: "0.2em" }}
            >
              AURUM
            </span>
            <span
              className="font-sans text-xs tracking-widest font-light hidden sm:block"
              style={{ color: "var(--muted-foreground)", letterSpacing: "0.25em" }}
            >
              JEWELS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/shop" className={`nav-link ${location === "/shop" ? "active" : ""}`} style={{ color: "var(--foreground)" }}>
              All Jewelry
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`nav-link ${location === cat.href ? "active" : ""}`}
                style={{ color: "var(--foreground)" }}
              >
                {cat.label}
              </Link>
            ))}
            <Link href="/journal" className={`nav-link ${location.startsWith("/journal") ? "active" : ""}`} style={{ color: "var(--foreground)" }}>
              Journal
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-full hover:bg-secondary transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
            </button>
            <button
              className="md:hidden flex items-center justify-center w-8 h-8"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
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

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-400 md:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
        <nav
          className={`absolute top-0 right-0 h-full w-72 bg-white shadow-hover transition-transform duration-400 ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--border)" }}>
              <span className="font-serif text-lg tracking-widest" style={{ color: "var(--gold-dark)" }}>
                AURUM JEWELS
              </span>
              <button onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>
            <div className="flex flex-col gap-1 p-6">
              <Link href="/shop" className="py-3 nav-link text-sm" style={{ color: "var(--foreground)" }}>
                All Jewelry
              </Link>
              {categories.map((cat) => (
                <Link key={cat.href} href={cat.href} className="py-3 nav-link text-sm" style={{ color: "var(--foreground)" }}>
                  {cat.label}
                </Link>
              ))}
              <div className="my-3 divider-gold" />
              <Link href="/journal" className="py-3 nav-link text-sm" style={{ color: "var(--foreground)" }}>
                Journal
              </Link>
            </div>
            <div className="mt-auto p-6 border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-sans font-light tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                Curated luxury jewelry, delivered daily
              </p>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
