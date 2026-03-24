"use client";

import React, { useCallback, useEffect, useRef } from "react";

interface SignatureCanvasProps {
  signatureData: string;
  onSignatureChange: (data: string) => void;
}

export default function SignatureCanvas({
  signatureData,
  onSignatureChange,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function initCanvas(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111111";
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    initCanvas(ctx, canvas.width, canvas.height);

    if (signatureData) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = signatureData;
    }
  }, [signatureData]);

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
          img.onload = () =>
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          img.src = signatureData;
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getCanvasPos(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDrawing(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isDrawing.current = true;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) {
    if (!isDrawing.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  const stopDrawing = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    const canvas = canvasRef.current;
    if (canvas) {
      onSignatureChange(canvas.toDataURL("image/png"));
    }
  }, [onSignatureChange]);

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    initCanvas(ctx, canvas.width, canvas.height);
    onSignatureChange("");
  }

  return (
    <div className="rounded-xl bg-surface p-4 shadow-md sm:p-5">
      <h2 className="mb-3 text-lg font-bold">Podpis zákazníka</h2>

      <div ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={560}
          height={180}
          className="w-full cursor-crosshair rounded-lg border-2 border-dashed border-border bg-white touch-none"
          aria-label="Oblasť pre kreslenie podpisu zákazníka"
          tabIndex={0}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      <button
        type="button"
        onClick={clearSignature}
        className="mt-3 min-h-[44px] w-full rounded-lg border border-border bg-surface-alt px-3.5 py-3 font-bold transition-colors hover:bg-border/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
      >
        Vymazať podpis
      </button>
    </div>
  );
}
