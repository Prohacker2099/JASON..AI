import { useCallback } from 'react';

type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

interface HapticFeedbackOptions {
  duration?: number; // in ms
}

const useHapticFeedback = () => {
  const triggerHapticFeedback = useCallback((type: HapticFeedbackType, options?: HapticFeedbackOptions) => {
    if (window.navigator && 'vibrate' in window.navigator) {
      const vibratePattern: { [key in HapticFeedbackType]: number | number[] } = {
        light: 50,
        medium: 100,
        heavy: 200,
        success: [50, 50, 50],
        warning: [100, 50, 100],
        error: [200, 50, 200],
      };

      const pattern = options?.duration || vibratePattern[type];
      window.navigator.vibrate(pattern);
    } else {
      console.warn('Haptic feedback not supported on this device.');
    }
  }, []);

  return { triggerHapticFeedback };
};

export default useHapticFeedback;