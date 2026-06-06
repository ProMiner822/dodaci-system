"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { btn } from "@/lib/styles";

interface SignatureCanvasProps {
  signatureData: string;
  onSignatureChange: (data: string) => void;
  // Increment to request the signing surface open (fullscreen on mobile).
  openCounter?: number;
  // Shown above the pad in fullscreen so the signer sees what they're signing.
  signContext?: string;
}

// Export only the drawn ink, tightly cropped to its bounding box. The drawing
// area is a wide strip that's mostly blank, so embedding the whole canvas made
// the signature look tiny in the PDF. Returns "" when nothing was drawn.
function exportTrimmedSignature(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const { width, height } = canvas;
  if (width === 0 || height === 0) return "";
  const { data } = ctx.getImageData(0, 0, width, height);

  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      // Ink = any non-white pixel (background is filled white).
      if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return ""; // blank canvas

  const pad = 8;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;

  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  const octx = out.getContext("2d");
  if (!octx) return "";
  octx.fillStyle = "#ffffff";
  octx.fillRect(0, 0, cw, ch);
  octx.drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
  return out.toDataURL("image/png");
}

// Draw a (now tightly-cropped) signature back into a canvas without stretching,
// preserving its aspect ratio and centering it.
function drawSignatureContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cw: number,
  ch: number,
) {
  const scale = Math.min(cw / img.width, ch / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
}

export default function SignatureCanvas({
  signatureData,
  onSignatureChange,
  openCounter = 0,
  signContext,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<ImageData[]>([]);
  const serializeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastOpenCounter = useRef(openCounter);

  // Logical (CSS-pixel) sizes; the backing store is this × devicePixelRatio so
  // ink stays crisp on retina screens and in the exported PDF.
  const inlineDims = useRef({ w: 0, h: 0 });
  const fsDims = useRef({ w: 0, h: 0 });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Size a canvas for hi-DPI: CSS box = cssW×cssH, backing = ×dpr, drawing
  // coordinates remain in CSS pixels (ctx scaled). Returns a primed context.
  function sizeCanvas(
    canvas: HTMLCanvasElement,
    cssW: number,
    cssH: number,
  ): CanvasRenderingContext2D | null {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    primeContext(ctx, dpr, cssW, cssH);
    return ctx;
  }

  function primeContext(
    ctx: CanvasRenderingContext2D,
    dpr: number,
    cssW: number,
    cssH: number,
  ) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111111";
  }

  // --- Debounced serialization ---
  function scheduleSerialize(canvas: HTMLCanvasElement) {
    if (serializeTimerRef.current) clearTimeout(serializeTimerRef.current);
    serializeTimerRef.current = setTimeout(() => {
      onSignatureChange(exportTrimmedSignature(canvas));
    }, 300);
  }

  // --- Undo history helpers ---
  function pushHistory(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(snapshot);
    if (historyRef.current.length > 10) {
      historyRef.current.shift();
    }
  }

  function popHistory(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (historyRef.current.length === 0) return;
    const snapshot = historyRef.current.pop()!;
    ctx.putImageData(snapshot, 0, 0);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111111";
  }

  // --- Pointer Events: unified drawing for any canvas ---
  function getPointerPos(e: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
    // CSS-pixel coordinates: the context is dpr-scaled and the element is
    // displayed at its CSS box size, so rect maps 1:1 to drawing space.
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function handlePointerDown(
    e: React.PointerEvent<HTMLCanvasElement>,
    canvasRefObj: React.RefObject<HTMLCanvasElement | null>,
  ) {
    const canvas = canvasRefObj.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Capture pointer for reliable tracking outside canvas
    canvas.setPointerCapture(e.pointerId);
    pushHistory(canvas);
    isDrawing.current = true;

    const pos = getPointerPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function handlePointerMove(
    e: React.PointerEvent<HTMLCanvasElement>,
    canvasRefObj: React.RefObject<HTMLCanvasElement | null>,
  ) {
    if (!isDrawing.current) return;
    const canvas = canvasRefObj.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPointerPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function handlePointerUp(canvasRefObj: React.RefObject<HTMLCanvasElement | null>, serialize: boolean) {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (serialize) {
      const canvas = canvasRefObj.current;
      if (canvas) scheduleSerialize(canvas);
    }
  }

  // --- Inline canvas: redraw the stored signature when it changes ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = inlineDims.current;
    if (w === 0) return; // resize observer hasn't sized it yet; it will draw
    const ctx = sizeCanvas(canvas, w, h);
    if (ctx && signatureData) {
      const img = new Image();
      img.onload = () => drawSignatureContain(ctx, img, w, h);
      img.src = signatureData;
    }
  }, [signatureData]);

  // --- Inline canvas: resize observer (sizes for hi-DPI) ---
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width <= 0) return;
      const cssW = Math.round(width);
      const cssH = Math.round(width / 3);
      inlineDims.current = { w: cssW, h: cssH };
      const ctx = sizeCanvas(canvas, cssW, cssH);
      if (ctx && signatureData) {
        const img = new Image();
        img.onload = () => drawSignatureContain(ctx, img, cssW, cssH);
        img.src = signatureData;
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Fullscreen canvas: init on open ---
  useEffect(() => {
    if (!isFullscreen) return;
    const canvas = fullscreenCanvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const cssW = Math.floor(rect.width);
    const cssH = Math.floor(rect.height);
    fsDims.current = { w: cssW, h: cssH };

    const ctx = sizeCanvas(canvas, cssW, cssH);
    if (!ctx) return;
    historyRef.current = [];

    if (signatureData) {
      const img = new Image();
      img.onload = () => drawSignatureContain(ctx, img, cssW, cssH);
      img.src = signatureData;
    }
  }, [isFullscreen, signatureData]);

  // --- Lock body scroll when fullscreen is open ---
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isFullscreen]);

  // --- Detect desktop (lg: breakpoint = 1024px) ---
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // --- React to external "open signing surface" requests ---
  useEffect(() => {
    if (openCounter === lastOpenCounter.current) return;
    lastOpenCounter.current = openCounter;
    if (isDesktop) {
      const canvas = canvasRef.current;
      canvas?.scrollIntoView({ behavior: "smooth", block: "center" });
      canvas?.focus();
    } else {
      setIsFullscreen(true);
    }
  }, [openCounter, isDesktop]);

  // --- Inline actions ---
  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = inlineDims.current;
    if (w === 0) return;
    sizeCanvas(canvas, w, h);
    historyRef.current = [];
    onSignatureChange("");
  }

  function inlineUndo() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    popHistory(canvas);
    scheduleSerialize(canvas);
  }

  // --- Fullscreen actions ---
  const stopDrawing = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) scheduleSerialize(canvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSignatureChange]);

  function fsClearSignature() {
    const canvas = fullscreenCanvasRef.current;
    if (!canvas) return;
    const { w, h } = fsDims.current;
    if (w === 0) return;
    sizeCanvas(canvas, w, h);
    historyRef.current = [];
  }

  function fsUndo() {
    const canvas = fullscreenCanvasRef.current;
    if (!canvas) return;
    popHistory(canvas);
  }

  function fsDone() {
    const canvas = fullscreenCanvasRef.current;
    if (!canvas) return;
    onSignatureChange(exportTrimmedSignature(canvas));
    setIsFullscreen(false);
    historyRef.current = [];
  }

  function openFullscreen() {
    setIsFullscreen(true);
  }

  return (
    <div className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
          Podpis zákazníka
        </h2>
        {signatureData ? (
          <span key="signed" className="swap-in inline-flex items-center gap-1.5 text-xs font-bold text-success">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Podpísané
          </span>
        ) : (
          <span className="text-xs font-semibold text-muted">Povinné</span>
        )}
      </div>

      {/* Desktop: inline canvas with Pointer Events */}
      {isDesktop && (
        <>
          <div ref={containerRef}>
            <canvas
              ref={canvasRef}
              width={560}
              height={180}
              className="w-full cursor-crosshair touch-none rounded border-2 border-dashed border-border-strong bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-label="Oblasť pre kreslenie podpisu zákazníka"
              tabIndex={0}
              onPointerDown={(e) => handlePointerDown(e, canvasRef)}
              onPointerMove={(e) => handlePointerMove(e, canvasRef)}
              onPointerUp={() => handlePointerUp(canvasRef, true)}
              onPointerLeave={() => handlePointerUp(canvasRef, true)}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={inlineUndo}
              className={`${btn.secondary} min-h-[44px] flex-1 px-3.5 py-3`}
            >
              Späť
            </button>
            <button
              type="button"
              onClick={clearSignature}
              className={`${btn.secondary} min-h-[44px] flex-1 px-3.5 py-3`}
            >
              Vymazať podpis
            </button>
          </div>
        </>
      )}

      {/* Mobile: preview + button */}
      {!isDesktop && (
        <div className="flex flex-col gap-3">
          {signatureData && (
            <div className="relative">
              <img
                src={signatureData}
                alt="Podpis"
                className="w-full rounded border border-border bg-white object-contain p-2"
                style={{ maxHeight: 120 }}
              />
              <button
                type="button"
                onClick={clearSignature}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded bg-white/80 text-muted hover:bg-border/30 hover:text-danger"
                aria-label="Vymazať podpis"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={openFullscreen}
            className={`${btn.primary} min-h-[48px] w-full px-4 py-3`}
          >
            {signatureData ? "Podpísať znova" : "Podpísať"}
          </button>
        </div>
      )}

      {/* Hidden canvas for mobile (resize observer + data loading) */}
      {!isDesktop && (
        <div ref={containerRef} className="hidden">
          <canvas ref={canvasRef} width={560} height={180} />
        </div>
      )}

      {/* Fullscreen signature overlay with Pointer Events */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/80"
          role="dialog"
          aria-modal="true"
          aria-label="Podpis na celú obrazovku"
        >
          <div className="flex flex-col items-center px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2 text-center">
            <h3 className="text-lg font-bold text-white">Podpis zákazníka</h3>
            {signContext && (
              <p className="mt-1 font-mono text-sm text-white/70 tabular-nums">{signContext}</p>
            )}
          </div>

          <div className="flex-1 px-4 pb-2">
            <div className="relative h-full w-full overflow-hidden rounded-lg bg-white">
              <canvas
                ref={fullscreenCanvasRef}
                className="h-full w-full cursor-crosshair touch-none"
                aria-label="Oblasť pre kreslenie podpisu zákazníka na celú obrazovku"
                tabIndex={0}
                onPointerDown={(e) => handlePointerDown(e, fullscreenCanvasRef)}
                onPointerMove={(e) => handlePointerMove(e, fullscreenCanvasRef)}
                onPointerUp={() => handlePointerUp(fullscreenCanvasRef, false)}
                onPointerLeave={() => handlePointerUp(fullscreenCanvasRef, false)}
              />
            </div>
          </div>

          <div className="flex gap-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
            <button
              type="button"
              onClick={fsUndo}
              className="min-h-[48px] flex-1 rounded-lg border border-white/25 bg-white/10 px-3.5 py-3 font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
            >
              Späť
            </button>
            <button
              type="button"
              onClick={fsClearSignature}
              className="min-h-[48px] flex-1 rounded-lg border border-white/25 bg-transparent px-3.5 py-3 font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
            >
              Vymazať
            </button>
            <button
              type="button"
              onClick={fsDone}
              className="min-h-[48px] flex-[1.4] rounded-lg bg-accent px-3.5 py-3 font-bold text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
            >
              Hotovo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
