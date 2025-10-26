import React, { useRef, useEffect, FC, useState } from 'react';

interface ParticleBackgroundProps {
  className?: string;
  theme?: 'dark' | 'light' | 'quantum';
  intensity?: 'low' | 'medium' | 'high';
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: { x: number; y: number };
  opacity: number;
  pulse: number;
  trail: { x: number; y: number; opacity: number }[];
}

const ParticleBackground: FC<ParticleBackgroundProps> = ({ 
  className = '', 
  theme = 'dark',
  intensity = 'medium'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);

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

    // Theme-based configurations
    const themeConfig = {
      dark: {
        background: 'rgba(5, 11, 20, 0.03)',
        colors: ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b'],
        connectionOpacity: 0.15
      },
      light: {
        background: 'rgba(248, 250, 252, 0.05)',
        colors: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
        connectionOpacity: 0.1
      },
      quantum: {
        background: 'rgba(15, 5, 30, 0.02)',
        colors: ['#8b5cf6', '#d946ef', '#06b6d4', '#10b981', '#f59e0b'],
        connectionOpacity: 0.2
      }
    };

    const intensityConfig = {
      low: { count: 50, speed: 0.1, connections: 80 },
      medium: { count: 100, speed: 0.2, connections: 120 },
      high: { count: 150, speed: 0.3, connections: 150 }
    };

    const config = themeConfig[theme];
    const intConfig = intensityConfig[intensity];
    const particles: Particle[] = [];

    // Initialize particles
    for (let i = 0; i < intConfig.count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 0.5,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        velocity: {
          x: (Math.random() - 0.5) * intConfig.speed,
          y: (Math.random() - 0.5) * intConfig.speed,
        },
        opacity: Math.random() * 0.6 + 0.2,
        pulse: Math.random() * Math.PI * 2,
        trail: []
      });
    }

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    let time = 0;
    const animate = () => {
      if (!isVisible) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      time += 0.01;
      
      // Clear canvas with fade effect
      ctx.fillStyle = config.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        // Update particle position
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;

        // Mouse attraction
        const mouseDistance = Math.sqrt(
          Math.pow(particle.x - mouseRef.current.x, 2) + 
          Math.pow(particle.y - mouseRef.current.y, 2)
        );
        
        if (mouseDistance < 150) {
          const force = (150 - mouseDistance) / 150;
          const angle = Math.atan2(
            mouseRef.current.y - particle.y,
            mouseRef.current.x - particle.x
          );
          particle.velocity.x += Math.cos(angle) * force * 0.01;
          particle.velocity.y += Math.sin(angle) * force * 0.01;
        }

        // Boundary wrapping
        if (particle.x < -10) particle.x = canvas.width + 10;
        if (particle.x > canvas.width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = canvas.height + 10;
        if (particle.y > canvas.height + 10) particle.y = -10;

        // Update pulse
        particle.pulse += 0.02;
        const pulseScale = 1 + Math.sin(particle.pulse) * 0.3;

        // Update trail
        particle.trail.unshift({ x: particle.x, y: particle.y, opacity: particle.opacity });
        if (particle.trail.length > 10) particle.trail.pop();

        // Draw trail
        particle.trail.forEach((point, trailIndex) => {
          const trailOpacity = point.opacity * (1 - trailIndex / particle.trail.length) * 0.3;
          ctx.beginPath();
          ctx.arc(point.x, point.y, particle.radius * (1 - trailIndex / particle.trail.length), 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.globalAlpha = trailOpacity;
          ctx.fill();
        });

        // Draw particle with glow effect
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.radius * pulseScale * 3
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(0.5, particle.color + '40');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * pulseScale * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.globalAlpha = particle.opacity * 0.3;
        ctx.fill();

        // Draw core particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * pulseScale, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();

        // Draw connections
        particles.slice(index + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < intConfig.connections) {
            const connectionOpacity = config.connectionOpacity * (1 - distance / intConfig.connections);
            
            // Animated connection
            const gradient = ctx.createLinearGradient(
              particle.x, particle.y,
              otherParticle.x, otherParticle.y
            );
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, otherParticle.color);

            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1 + Math.sin(time + distance * 0.01) * 0.5;
            ctx.globalAlpha = connectionOpacity;
            ctx.stroke();

            // Energy pulse along connection
            if (Math.random() < 0.01) {
              const pulseX = particle.x + (otherParticle.x - particle.x) * (Math.sin(time * 2) + 1) / 2;
              const pulseY = particle.y + (otherParticle.y - particle.y) * (Math.sin(time * 2) + 1) / 2;
              
              ctx.beginPath();
              ctx.arc(pulseX, pulseY, 2, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.globalAlpha = 0.8;
              ctx.fill();
            }
          }
        });
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Visibility API for performance
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme, intensity, isVisible]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full -z-10 pointer-events-none ${className}`}
      style={{ 
        mixBlendMode: theme === 'light' ? 'multiply' : 'screen',
        filter: `blur(${intensity === 'high' ? '0.5px' : '0px'})`
      }}
    />
  );
};

export default ParticleBackground;
