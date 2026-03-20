import { useState, useEffect } from "react";
import { X, Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

export function EmailCapturePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Show popup after 30 seconds on first visit
  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("jewelry-email-popup-seen");
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, []);

  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      localStorage.setItem("jewelry-email-popup-seen", "true");
      setTimeout(() => {
        setIsOpen(false);
        setEmail("");
        setIsSubmitted(false);
      }, 3000);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    try {
      await subscribeMutation.mutateAsync({ email });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("jewelry-email-popup-seen", "true");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md mx-4 rounded-lg shadow-2xl overflow-hidden"
        style={{ background: "var(--background)" }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-200 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />
        </button>

        {/* Content */}
        <div className="p-8">
          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-6" style={{ background: "var(--gold)" }} />
                  <h2 className="font-serif text-2xl font-light" style={{ color: "var(--foreground)" }}>
                    Jewelry Care Guide
                  </h2>
                </div>
                <p className="font-sans text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Get expert tips on caring for your precious jewelry collection
                </p>
              </div>

              {/* Benefits */}
              <div className="mb-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Download className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: "var(--gold)" }} />
                  <span className="font-sans text-sm" style={{ color: "var(--foreground)" }}>
                    Free PDF guide with professional care tips
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: "var(--gold)" }} />
                  <span className="font-sans text-sm" style={{ color: "var(--foreground)" }}>
                    Exclusive jewelry trends and styling tips
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="font-sans text-sm"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--champagne)",
                  }}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full font-sans text-sm font-medium"
                  style={{
                    background: "var(--gold)",
                    color: "white",
                  }}
                >
                  {isSubmitting ? "Sending..." : "Get Free Guide"}
                </Button>
              </form>

              {/* Privacy notice */}
              <p className="font-sans text-xs mt-4 text-center" style={{ color: "var(--muted-foreground)" }}>
                We respect your privacy. Unsubscribe anytime.
              </p>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-8">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--gold-light)" }}
              >
                <Download className="w-6 h-6" style={{ color: "var(--gold)" }} />
              </div>
              <h3 className="font-serif text-xl font-light mb-2" style={{ color: "var(--foreground)" }}>
                Check Your Email!
              </h3>
              <p className="font-sans text-sm" style={{ color: "var(--muted-foreground)" }}>
                Your Jewelry Care Guide is on its way. Look for it in your inbox.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
