import confetti from 'canvas-confetti';

export const triggerCelebration = () => {
  try {
    // 1. Center burst with very high z-index for mobile screens
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.65 },
      zIndex: 99999,
      disableForReducedMotion: false,
    });

    // 2. Dual cannon blast from sides for extra visual pop on mobile & desktop
    setTimeout(() => {
      try {
        confetti({
          particleCount: 35,
          angle: 60,
          spread: 55,
          origin: { x: 0.05, y: 0.7 },
          zIndex: 99999,
          disableForReducedMotion: false,
        });
        confetti({
          particleCount: 35,
          angle: 120,
          spread: 55,
          origin: { x: 0.95, y: 0.7 },
          zIndex: 99999,
          disableForReducedMotion: false,
        });
      } catch {}
    }, 180);
  } catch (err) {
    console.warn('Confetti trigger failed:', err);
  }
};
