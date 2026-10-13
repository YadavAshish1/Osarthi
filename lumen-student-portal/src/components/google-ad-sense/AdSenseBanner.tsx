"use client";

import React, { useEffect, useRef, useState } from "react";

export interface AdSenseBannerProps {
  slot: string;
  client?: string;
  format?: string;
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable Google AdSense Banner Component
 * - Takes 0px height and 0px margin until Google fills the ad (prevents blank/white space)
 * - Automatically expands only when Google successfully delivers an ad
 * - Completely hides if Google returns "unfilled"
 */
export default function AdSenseBanner({
  slot,
  client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-3501059367732668",
  format = "auto",
  responsive = true,
  className = "",
  style = { display: "block" },
}: AdSenseBannerProps) {
  const pushedRef = useRef(false);
  const insRef = useRef<HTMLModElement | null>(null);
  const [isFilled, setIsFilled] = useState(false);
  const [isUnfilled, setIsUnfilled] = useState(false);

  useEffect(() => {
    const node = insRef.current;
    if (!node) return;

    const checkStatus = () => {
      const hasIframe = !!node.querySelector("iframe");
      const status = node.getAttribute("data-ad-status");
      if (hasIframe || status === "filled") {
        setIsFilled(true);
        setIsUnfilled(false);
      } else if (status === "unfilled") {
        setIsFilled(false);
        setIsUnfilled(true);
      }
    };

    checkStatus();

    const observer = new MutationObserver(checkStatus);
    observer.observe(node, {
      childList: true,
      attributes: true,
      attributeFilter: ["data-ad-status"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (pushedRef.current) return;
    try {
      if (typeof window !== "undefined") {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        pushedRef.current = true;
      }
    } catch {
      // silent
    }
  }, []);

  if (isUnfilled) {
    return null;
  }

  return (
    <aside
      aria-label="Advertisement"
      className={`w-full overflow-hidden flex justify-center items-center ${
        isFilled ? (className || "my-6") : "h-0 my-0 py-0"
      }`}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={style}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </aside>
  );
}
