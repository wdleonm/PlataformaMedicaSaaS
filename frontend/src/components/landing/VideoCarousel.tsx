"use client";

import { useState, useEffect, useCallback } from "react";

const slides = [
  {
    src: "/images/landing/foto1.png",
    caption: "Precisión en cada procedimiento",
    sub: "Control total de tu práctica clínica",
  },
  {
    src: "/images/landing/foto2.png",
    caption: "Tecnología al servicio de tu clínica",
    sub: "Radiografías digitales y diagnóstico inteligente",
  },
  {
    src: "/images/landing/foto3.png",
    caption: "Instrumental organizado, consulta eficiente",
    sub: "Gestión de inventario en tiempo real",
  },
  {
    src: "/images/landing/foto4.png",
    caption: "La sonrisa de tus pacientes, tu mejor indicador",
    sub: "Historias clínicas completas y accesibles",
  },
];

export default function VideoCarousel() {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[80vh] overflow-hidden bg-[#020617]">
      {/* Overlay gradientes */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          background: "linear-gradient(to right, #020617, transparent, transparent)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          background: "linear-gradient(to top, rgba(2,6,23,0.7), transparent, transparent)",
          pointerEvents: "none",
        }}
      />

      {/* ALL 4 images rendered and stacked — CSS controls visibility */}
      {slides.map((slide, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            inset: 0,
            opacity: idx === current ? 1 : 0,
            transition: "opacity 1.2s ease-in-out, transform 8s ease-in-out",
            transform: idx === current ? "scale(1.12)" : "scale(1.0)",
            zIndex: idx === current ? 2 : 1,
          }}
        >
          <img
            src={slide.src}
            alt={slide.caption}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      ))}

      {/* Caption overlay */}
      <div
        style={{
          position: "absolute",
          bottom: "64px",
          left: "48px",
          right: "48px",
          zIndex: 20,
          opacity: 1,
          transition: "opacity 0.7s ease",
        }}
      >
        <h3
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "white",
            marginBottom: "8px",
            textShadow: "0 2px 8px rgba(0,0,0,0.7)",
          }}
        >
          {slides[current].caption}
        </h3>
        <p
          style={{
            color: "#cbd5e1",
            fontSize: "0.875rem",
            textShadow: "0 1px 4px rgba(0,0,0,0.5)",
          }}
        >
          {slides[current].sub}
        </p>
      </div>

      {/* Dot indicators */}
      <div
        style={{
          position: "absolute",
          bottom: "24px",
          left: "48px",
          zIndex: 20,
          display: "flex",
          gap: "8px",
        }}
      >
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            style={{
              width: "32px",
              height: "6px",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.5s ease",
              backgroundColor: idx === current ? "hsl(var(--primary))" : "rgba(255,255,255,0.3)",
              transform: idx === current ? "scaleY(1.3)" : "scaleY(1)",
            }}
          />
        ))}
      </div>

      {/* Scan line effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
          opacity: 0.03,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)",
        }}
      />
    </div>
  );
}
