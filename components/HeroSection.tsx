"use client";

import React from "react";
import dynamic from "next/dynamic";

const HeroSlideshow = dynamic(() => import("./heroSlideshow"), { ssr: false });
const HeroText = dynamic(() => import("./HeroText"), { ssr: false });

export default function HeroSection() {
  return (
    <div style={{ position: "relative", minHeight: "100svh" }}>
      <HeroSlideshow />
      <HeroText />
    </div>
  );
}
