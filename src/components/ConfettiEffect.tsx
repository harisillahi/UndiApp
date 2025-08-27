"use client";

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function ConfettiEffect({ trigger, onComplete }: ConfettiEffectProps) {
  useEffect(() => {
    if (!trigger) return;

    try {
      // Create a more spectacular confetti effect
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          if (onComplete) {
            onComplete();
          }
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        // Launch confetti from different positions
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Additional burst from center
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      return () => {
        clearInterval(interval);
      };
    } catch (error) {
      console.error('Error creating confetti effect:', error);
      if (onComplete) {
        onComplete();
      }
    }
  }, [trigger, onComplete]);

  return null; // This component doesn't render anything visible
}

// Alternative confetti patterns
export const confettiPatterns = {
  celebration: () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      console.error('Error with celebration confetti:', error);
    }
  },

  fireworks: () => {
    try {
      const duration = 15 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);
    } catch (error) {
      console.error('Error with fireworks confetti:', error);
    }
  },

  burst: () => {
    try {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 }
      });
    } catch (error) {
      console.error('Error with burst confetti:', error);
    }
  }
};
