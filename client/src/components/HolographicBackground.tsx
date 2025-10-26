import React, { useRef, useEffect, FC } from 'react';

interface HolographicBackgroundProps {
  className?: string;
}

const HolographicBackground: FC<HolographicBackgroundProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;
    const gridSize = 30;
    const speed = 0.0005;

    const animate = () => {
      time += speed;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < canvas.width; x += 5) {
          const wave = Math.sin(x * 0.01 + time) * 2;
          ctx.lineTo(x, y + wave);
        }
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.1 - (y / canvas.height) * 0.05})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        for (let y = 0; y < canvas.height; y += 5) {
          const wave = Math.sin(y * 0.01 + time) * 2;
          ctx.lineTo(x + wave, y);
        }
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.1 - (x / canvas.width) * 0.05})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
    />
  );
};

export default HolographicBackground;
