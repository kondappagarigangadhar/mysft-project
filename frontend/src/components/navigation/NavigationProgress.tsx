"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

import "nprogress/nprogress.css";

/**
 * YouTube-style top bar during client navigations.
 * Starts on internal `<Link>` clicks; completes when the route updates.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({
      showSpinner: false,
      trickleSpeed: 200,
      minimum: 0.08,
    });
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]");
      if (!anchor) return;
      if (e.defaultPrevented) return;
      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        href.startsWith("javascript:")
      ) {
        return;
      }
      try {
        const next = new URL(href, window.location.origin);
        const cur = new URL(window.location.href);
        if (next.pathname === cur.pathname && next.search === cur.search) return;
      } catch {
        return;
      }
      NProgress.start();
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  return null;
}
