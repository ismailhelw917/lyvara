import { useState } from "react";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface NewsletterSignupProps {
  source?: "homepage" | "footer" | "popup" | "blog" | "product_page" | "other";
  variant?: "inline" | "modal" | "footer";
}

export default function NewsletterSignup({ source = "other", variant = "inline" }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const subscribeMutation = trpc.newsletter.subscribe.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter your email");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      await subscribeMutation.mutateAsync({
        email,
        name: name || undefined,
        source,
      });
      setStatus("success");
      setEmail("");
      setName("");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Failed to subscribe. Please try again.");
    }
  };

  if (variant === "footer") {
    return (
      <div className="space-y-3">
        <h4 className="font-sans text-xs tracking-widest uppercase font-medium" style={{ color: "var(--gold)" }}>
          Stay Updated
        </h4>
        <p className="font-sans font-light text-sm" style={{ color: "oklch(0.65 0.01 60)" }}>
          Get jewelry trends, styling tips, and exclusive offers delivered to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm"
            style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
            disabled={status === "loading"}
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="w-full px-3 py-2 rounded text-sm font-medium transition-all duration-200"
            style={{
              background: status === "success" ? "var(--gold)" : "var(--gold-dark)",
              color: "white",
              opacity: status === "loading" ? 0.7 : 1,
            }}
          >
            {status === "loading" ? "Subscribing..." : status === "success" ? "✓ Subscribed!" : "Subscribe"}
          </button>
        </form>
        {errorMessage && (
          <p className="font-sans text-xs" style={{ color: "var(--rose-gold)" }}>
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg p-6" style={{ background: "var(--champagne)" }}>
      <div className="flex items-start gap-4">
        <Mail className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "var(--gold)" }} />
        <div className="flex-1">
          <h3 className="font-serif text-xl font-light mb-2" style={{ color: "var(--foreground)" }}>
            Join Our Newsletter
          </h3>
          <p className="font-sans text-sm mb-4 font-light" style={{ color: "var(--muted-foreground)" }}>
            Get exclusive styling tips, jewelry trends, and special offers delivered to your inbox.
          </p>

          {status === "success" ? (
            <div className="flex items-center gap-2 p-3 rounded" style={{ background: "rgba(34, 197, 94, 0.1)" }}>
              <CheckCircle className="w-4 h-4" style={{ color: "#22c55e" }} />
              <span className="font-sans text-sm font-medium" style={{ color: "#22c55e" }}>
                Thank you for subscribing!
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded border"
                style={{
                  borderColor: "var(--border)",
                  background: "white",
                  color: "var(--foreground)",
                }}
                disabled={status === "loading"}
              />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded border"
                style={{
                  borderColor: "var(--border)",
                  background: "white",
                  color: "var(--foreground)",
                }}
                disabled={status === "loading"}
                required
              />
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                  <AlertCircle className="w-4 h-4" style={{ color: "#ef4444" }} />
                  <span className="font-sans text-sm" style={{ color: "#ef4444" }}>
                    {errorMessage}
                  </span>
                </div>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full btn-luxury-filled py-2.5 font-medium transition-all duration-200"
                style={{ opacity: status === "loading" ? 0.7 : 1 }}
              >
                {status === "loading" ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
