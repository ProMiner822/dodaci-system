"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface SignatureCanvasProps {
  signatureData: string;
  onSignatureChange: (data: string) => void;
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
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<ImageData[]>([]);
  const serializeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  function initCanvas(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
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
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111111";
  }

  // --- Pointer Events: unified drawing for any canvas ---
  function getPointerPos(e: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
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

  // --- Inline canvas: init & load signature data ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    initCanvas(ctx, canvas.width, canvas.height);

    if (signatureData) {
      const img = new Image();
      img.onload = () => drawSignatureContain(ctx, img, canvas.width, canvas.height);
      img.src = signatureData;
    }
  }, [signatureData]);

  // --- Inline canvas: resize observer ---
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) {
        canvas.width = width;
        canvas.height = Math.round(width / 3);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        initCanvas(ctx, canvas.width, canvas.height);
        if (signatureData) {
          const img = new Image();
          img.onload = () => drawSignatureContain(ctx, img, canvas.width, canvas.height);
          img.src = signatureData;
        }
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
    if (parent) {
      const rect = parent.getBoundingClientRect();
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    initCanvas(ctx, canvas.width, canvas.height);
    historyRef.current = [];

    if (signatureData) {
      const img = new Image();
      img.onload = () => drawSignatureContain(ctx, img, canvas.width, canvas.height);
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

  // --- Inline actions ---
  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    historyRef.current = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    initCanvas(ctx, canvas.width, canvas.height);
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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    historyRef.current = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    initCanvas(ctx, canvas.width, canvas.height);
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
    <div className="rounded-xl bg-surface p-4 shadow-md sm:p-5">
      <h2 className="mb-3 text-lg font-bold">Podpis zákazníka</h2>

      {/* Desktop: inline canvas with Pointer Events */}
      {isDesktop && (
        <>
          <div ref={containerRef}>
            <canvas
              ref={canvasRef}
              width={560}
              height={180}
              className="w-full cursor-crosshair touch-none rounded-lg border-2 border-dashed border-border bg-white"
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
              className="min-h-[44px] flex-1 rounded-lg border border-border bg-surface-alt px-3.5 py-3 font-bold transition-colors hover:bg-border/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
            >
              Späť
            </button>
            <button
              type="button"
              onClick={clearSignature}
              className="min-h-[44px] flex-1 rounded-lg border border-border bg-surface-alt px-3.5 py-3 font-bold transition-colors hover:bg-border/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
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
                className="w-full rounded-xl border border-border bg-white object-contain p-2"
                style={{ maxHeight: 120 }}
              />
              <button
                type="button"
                onClick={clearSignature}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-muted hover:bg-border/30 hover:text-danger"
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
            className="min-h-[48px] w-full rounded-xl bg-accent px-4 py-3 font-bold text-white transition-colors hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
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
          <div className="flex items-center justify-center px-4 pt-4 pb-2">
            <h3 className="text-lg font-bold text-white">Podpis zákazníka</h3>
          </div>

          <div className="flex-1 px-4 pb-2">
            <div className="h-full w-full overflow-hidden rounded-xl bg-white">
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

          <div className="flex gap-3 px-4 pb-6 pt-2">
            <button
              type="button"
              onClick={fsUndo}
              className="min-h-[44px] flex-1 rounded-lg border border-white/20 bg-white/10 px-3.5 py-3 font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
            >
              Späť
            </button>
            <button
              type="button"
              onClick={fsClearSignature}
              className="min-h-[44px] flex-1 rounded-lg bg-red-600 px-3.5 py-3 font-bold text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 active:scale-[0.98]"
            >
              Vymazať
            </button>
            <button
              type="button"
              onClick={fsDone}
              className="min-h-[44px] flex-1 rounded-lg bg-accent px-3.5 py-3 font-bold text-white transition-colors hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
            >
              Hotovo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
