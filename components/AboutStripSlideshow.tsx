"use client";

import React, { useEffect, useState, useRef } from "react";

const ABOUT_SLIDES = [
  {
    src: "https://i.pinimg.com/originals/7d/07/a2/7d07a255678962d30d8717dcf5dbd266.gif",
    alt: "FiSAFi – About 1",
  },
  {
    src: "https://i.pinimg.com/originals/2f/ab/f3/2fabf3ceb5a35b51a70e27137d56e4d2.gif",
    alt: "FiSAFi – About 2",
  },
  {
    src: "https://i.pinimg.com/1200x/4b/f0/2f/4bf02f4e0170f29860fa626708e7be42.jpg",
    alt: "FiSAFi – About 3",
  },
];

const INTERVAL = 5000;
const FADE_DURATION = 1000;

export default function AboutStripSlideshow() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startTimer = () => {
      timerRef.current = setInterval(() => {
        setFading(true);
        setTimeout(() => {
          setCurrent((prev) => (prev + 1) % ABOUT_SLIDES.length);
          setFading(false);
        }, FADE_DURATION / 2);
      }, INTERVAL);
    };

    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        backgroundImage: `url('${ABOUT_SLIDES[current].src}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "300px",
        transition: `background-image ${FADE_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
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
  );
}
