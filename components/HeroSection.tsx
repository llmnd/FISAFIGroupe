"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { HeroSlideContext } from "./heroSlideshow";

const HeroSlideshow = dynamic(() => import("./heroSlideshow"), { ssr: false });
const HeroText = dynamic(() => import("./HeroText"), { ssr: false });

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  return (
    <HeroSlideContext.Provider value={currentSlide}>
      <div style={{ position: "relative", minHeight: "100svh" }}>
        <HeroSlideshow onSlideChange={setCurrentSlide} />
        <HeroText />
      </div>
    </HeroSlideContext.Provider>
  );
}
