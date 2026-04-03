'use client';

import { useEffect, useRef } from 'react';

interface ApplePayRingsProps {
  eventName: string;
}

export function ApplePayRings({ eventName }: ApplePayRingsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;
    const ringCount = 9;
    const ringSpacing = maxRadius / ringCount;

    let rotation = 0;
    const rotationSpeed = (2 * Math.PI) / (35 * 60); // 35 seconds per revolution at 60fps

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw rings
      for (let i = 0; i < ringCount; i++) {
        const radius = (i + 1) * ringSpacing;
        const isBlack = i % 2 === 0;

        ctx.strokeStyle = isBlack ? '#000000' : '#808080';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, rotation + (i * Math.PI / ringCount), rotation + (i * Math.PI / ringCount) + Math.PI);
        ctx.stroke();
      }

      // Draw center circle
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringSpacing / 2, 0, 2 * Math.PI);
      ctx.fill();

      // Draw text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(eventName, centerX, centerY);

      rotation += rotationSpeed;

      requestAnimationFrame(animate);
    };

    animate();
  }, [eventName]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      className="mx-auto"
    />
  );
}