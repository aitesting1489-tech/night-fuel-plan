const GA_ID = "G-BZ75TFM3CB";

// Load gtag script
export const initGA = () => {
  if (typeof window === "undefined") return;
  if (document.getElementById("ga-script")) return;

  const script = document.createElement("script");
  script.id = "ga-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID);
};

// Track page views (call on route change)
export const trackPageView = (path: string) => {
  if (typeof (window as any).gtag !== "function") return;
  (window as any).gtag("event", "page_view", { page_path: path });
};

// Track custom events
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof (window as any).gtag !== "function") return;
  (window as any).gtag("event", eventName, params);
};
