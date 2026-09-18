"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { sanitizeAnalyticsEvent, trackProductEvent } from "../analytics";

function RouteEvents() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    if (pathname === "/") trackProductEvent("homepage_viewed");
    if (pathname === "/queue") trackProductEvent("queue_opened");
  }, [pathname]);
  return null;
}

export default function PrivacyAnalytics() {
  return <>
    <Analytics beforeSend={sanitizeAnalyticsEvent} />
    <Suspense fallback={null}><RouteEvents /></Suspense>
  </>;
}
