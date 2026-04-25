"use client";

import React from "react";

const ABOUT_SLIDES = [
  {
    src: "https://i.pinimg.com/originals/eb/07/16/eb07167d0e3f1dcb1803d329f56350eb.gif",
    alt: "FiSAFi – About 2",
  },
];

// CSS animation au lieu de JS setInterval
const ANIMATION_CSS = `
  @keyframes bgFade {
    0%, 100% { opacity: 1; }
    45%, 55% { opacity: 0.8; }
  }
  .about-strip-animated {
    animation: bgFade 10s ease-in-out infinite;
    will-change: opacity;
    contain: layout style paint;
  }
`;

export default function AboutStripSlideshow() {
  return (
    <>
      <style>{ANIMATION_CSS}</style>
      <div
        className="about-strip-animated"
        style={{
          backgroundImage: `url('${ABOUT_SLIDES[0].src}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "300px",
          contain: "layout style paint",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            zIndex: 1,
          }}
        />
        <p
          className="about-quote"
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            color: "#fff",
          }}
        >
          « Pensez grand.<br />
          Pensez digital.<br />
          Pensez FISAFI. »
        </p>
      </div>
    </>
  );
}
