import { Link } from "wouter";
import { Gem, Instagram, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{ background: "oklch(0.14 0.015 30)" }} className="text-white">
      {/* Top section */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Gem className="w-5 h-5" style={{ color: "var(--gold)" }} />
              <span className="font-serif text-2xl tracking-widest" style={{ color: "var(--gold-light)", letterSpacing: "0.2em" }}>
                AURUM JEWELS
              </span>
            </div>
            <p className="font-sans font-light text-sm leading-relaxed mb-6" style={{ color: "oklch(0.75 0.01 60)", maxWidth: "320px" }}>
              Curating the world's most exquisite gold and silver jewelry for the discerning woman. 
              Every piece tells a story of craftsmanship, elegance, and timeless beauty.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{ background: "oklch(0.22 0.02 30)" }}
              >
                <Instagram className="w-4 h-4" style={{ color: "var(--gold-light)" }} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-sans text-xs tracking-widest uppercase mb-5 font-medium" style={{ color: "var(--gold)" }}>
              Shop
            </h4>
            <ul className="space-y-3">
              {[
                { label: "All Jewelry", href: "/shop" },
                { label: "Necklaces", href: "/shop/necklaces" },
                { label: "Bracelets", href: "/shop/bracelets" },
                { label: "Rings", href: "/shop/rings" },
                { label: "Earrings", href: "/shop/earrings" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-sans font-light text-sm transition-colors duration-200 hover:text-white"
                    style={{ color: "oklch(0.65 0.01 60)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Journal & Info */}
          <div>
            <h4 className="font-sans text-xs tracking-widest uppercase mb-5 font-medium" style={{ color: "var(--gold)" }}>
              Discover
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Style Journal", href: "/journal" },
                { label: "Gold Guide", href: "/journal" },
                { label: "Gift Ideas", href: "/journal" },
                { label: "Care Tips", href: "/journal" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-sans font-light text-sm transition-colors duration-200 hover:text-white"
                    style={{ color: "oklch(0.65 0.01 60)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="container">
        <div style={{ height: "1px", background: "oklch(0.25 0.015 30)" }} />
      </div>

      {/* Bottom bar */}
      <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="font-sans font-light text-xs" style={{ color: "oklch(0.45 0.01 60)" }}>
          © {new Date().getFullYear()} Aurum Jewels. As an Amazon Associate, we earn from qualifying purchases.
        </p>
        <p className="font-sans font-light text-xs flex items-center gap-1" style={{ color: "oklch(0.45 0.01 60)" }}>
          Crafted with <Heart className="w-3 h-3 inline" style={{ color: "var(--rose-gold)" }} /> for the modern woman
        </p>
      </div>
    </footer>
  );
}
