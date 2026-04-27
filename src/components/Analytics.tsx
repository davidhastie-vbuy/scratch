import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = "G-KK49SKQERP";

/**
 * Sends a page_view to GA4 on every SPA route change.
 * The initial page_view is suppressed in index.html (send_page_view: false)
 * and fired here instead, so first-load and subsequent navigations are
 * tracked consistently.
 */
const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    const path = location.pathname + location.search;
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
      send_to: GA_MEASUREMENT_ID,
    });
  }, [location.pathname, location.search]);

  return null;
};

export default Analytics;
