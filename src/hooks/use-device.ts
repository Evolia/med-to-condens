"use client";

import { useState, useEffect } from "react";

export type DeviceType = "mobile" | "desktop";

// Breakpoint: 768px (Tailwind's md breakpoint)
const MOBILE_BREAKPOINT = 768;

export function useDevice(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    // Initial value on server or first render
    if (typeof window === "undefined") return "desktop";
    return window.innerWidth < MOBILE_BREAKPOINT ? "mobile" : "desktop";
  });

  useEffect(() => {
    // Function to update device type based on window size
    const handleResize = () => {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      setDeviceType(isMobile ? "mobile" : "desktop");
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceType;
}
