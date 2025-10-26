import { motion, Variants, useAnimation, useInView } from 'framer-motion';
import { useSpring, animated, config } from '@react-spring/web';
import { useRef, useEffect } from 'react';

// Advanced animation variants
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 60,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const slideInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -100,
    rotateY: -15
  },
  visible: { 
    opacity: 1, 
    x: 0,
    rotateY: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const slideInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 100,
    rotateY: 15
  },
  visible: { 
    opacity: 1, 
    x: 0,
    rotateY: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    rotateZ: -10
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    rotateZ: 0,
    transition: {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1]
    }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const staggerItem: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const floatingAnimation: Variants = {
  animate: {
    y: [-10, 10, -10],
    rotateZ: [-2, 2, -2],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const pulseGlow: Variants = {
  animate: {
    boxShadow: [
      "0 0 20px rgba(79, 70, 229, 0.3)",
      "0 0 40px rgba(79, 70, 229, 0.6)",
      "0 0 20px rgba(79, 70, 229, 0.3)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const morphingShape: Variants = {
  animate: {
    borderRadius: ["20px", "50px", "20px"],
    rotate: [0, 180, 360],
    scale: [1, 1.1, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Advanced hover effects
export const hoverLift: Variants = {
  hover: {
    y: -8,
    scale: 1.02,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const hoverGlow: Variants = {
  hover: {
    boxShadow: [
      "0 0 20px rgba(79, 70, 229, 0.4)",
      "0 0 40px rgba(79, 70, 229, 0.7)",
      "0 0 20px rgba(79, 70, 229, 0.4)"
    ],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const hoverRotate: Variants = {
  hover: {
    rotateZ: 5,
    scale: 1.05,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Page transition variants
export const pageTransition: Variants = {
  initial: { 
    opacity: 0, 
    x: 100,
    scale: 0.95
  },
  in: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  out: { 
    opacity: 0, 
    x: -100,
    scale: 1.05,
    transition: {
      duration: 0.4,
      ease: [0.55, 0.085, 0.68, 0.53]
    }
  }
};

// Custom hooks for advanced animations
export const useScrollAnimation = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return { ref, controls };
};

export const useParallaxEffect = (offset: number = 0.5) => {
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      api.start({ y: scrolled * offset });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [api, offset]);

  return { y };
};

export const useMouseParallax = (strength: number = 0.1) => {
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      const xPct = (clientX - innerWidth / 2) / innerWidth;
      const yPct = (clientY - innerHeight / 2) / innerHeight;
      
      api.start({
        x: xPct * strength * 100,
        y: yPct * strength * 100,
        config: config.gentle
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [api, strength]);

  return { x, y };
};

// Animated components
export const AnimatedCard = motion.div;
export const AnimatedButton = motion.button;
export const AnimatedText = motion.h1;
export const AnimatedContainer = motion.div;

// Spring animated components
export const SpringCard = animated.div;
export const SpringButton = animated.button;
export const SpringText = animated.h1;

// Advanced particle system for backgrounds
export const useParticleSystem = (count: number = 50) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    speed: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.5 + 0.2
  }));

  return particles;
};

// Morphing blob animation
export const useMorphingBlob = () => {
  const [{ morph }, api] = useSpring(() => ({
    morph: 0,
    config: { duration: 3000 }
  }));

  useEffect(() => {
    const animate = () => {
      api.start({
        morph: Math.random(),
        onRest: animate
      });
    };
    animate();
  }, [api]);

  return morph;
};

// Liquid animation effect
export const liquidAnimation: Variants = {
  animate: {
    d: [
      "M20,20 C20,20 50,10 80,20 C110,30 140,10 160,20 L160,80 C140,90 110,70 80,80 C50,90 20,70 20,80 Z",
      "M20,30 C20,30 50,20 80,10 C110,0 140,20 160,30 L160,70 C140,60 110,80 80,70 C50,60 20,80 20,70 Z",
      "M20,20 C20,20 50,10 80,20 C110,30 140,10 160,20 L160,80 C140,90 110,70 80,80 C50,90 20,70 20,80 Z"
    ],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default {
  fadeInUp,
  slideInLeft,
  slideInRight,
  scaleIn,
  staggerContainer,
  staggerItem,
  floatingAnimation,
  pulseGlow,
  morphingShape,
  hoverLift,
  hoverGlow,
  hoverRotate,
  pageTransition,
  liquidAnimation,
  useScrollAnimation,
  useParallaxEffect,
  useMouseParallax,
  useParticleSystem,
  useMorphingBlob,
  AnimatedCard,
  AnimatedButton,
  AnimatedText,
  AnimatedContainer,
  SpringCard,
  SpringButton,
  SpringText
};
