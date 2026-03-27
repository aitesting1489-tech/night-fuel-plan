import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Don't show in iframes (Lovable preview)
    try {
      if (window.self !== window.top) return;
    } catch {
      return;
    }
    if (window.location.hostname.includes("lovableproject.com")) return;

    const dismissed = localStorage.getItem("circadia-install-dismissed");
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      // Re-show after 7 days
      if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const ua = navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    setDismissed(true);
  };

  const handleDismiss = () => {
    localStorage.setItem("circadia-install-dismissed", Date.now().toString());
    setDismissed(true);
  };

  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIos) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 sm:left-auto sm:right-6 sm:max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="rounded-2xl bg-card border border-border p-4 shadow-xl dreamy-blur">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-display font-semibold text-foreground">
              Install Circadia
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isIos
                ? "Tap the share button, then \"Add to Home Screen\" for quick access."
                : "Add to your home screen for a native app experience."}
            </p>
          </div>
        </div>

        {!isIos && (
          <button
            onClick={handleInstall}
            className="mt-3 w-full h-9 rounded-xl bg-primary text-primary-foreground text-xs font-display font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Install
          </button>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;
