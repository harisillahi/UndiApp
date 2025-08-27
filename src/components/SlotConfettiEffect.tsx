"use client";

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface SlotConfettiEffectProps {
  trigger: boolean;
  targetElement?: HTMLElement | null;
  position?: { x: number; y: number };
  onComplete?: () => void;
  duration?: number;
}

export function SlotConfettiEffect({ 
  trigger, 
  targetElement, 
  position, 
  onComplete, 
  duration = 2000 
}: SlotConfettiEffectProps) {
  useEffect(() => {
    if (!trigger) return;

    try {
      let originX = 0.5;
      let originY = 0.5;

      // Calculate position based on target element
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        originX = centerX / window.innerWidth;
        originY = centerY / window.innerHeight;
      } else if (position) {
        originX = position.x;
        originY = position.y;
      }

      // Create confetti burst from the specific position
      const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
      
      // Main burst
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x: originX, y: originY },
        colors: colors,
        startVelocity: 25,
        gravity: 0.8,
        drift: 0,
        ticks: 200,
        scalar: 0.8
      });

      // Secondary smaller burst
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 40,
          origin: { x: originX, y: originY },
          colors: colors,
          startVelocity: 15,
          gravity: 0.6,
          ticks: 150,
          scalar: 0.6
        });
      }, 200);

      // Cleanup and callback
      const cleanup = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, duration);

      return () => {
        clearTimeout(cleanup);
      };
    } catch (error) {
      console.error('Error creating slot confetti effect:', error);
      if (onComplete) {
        onComplete();
      }
    }
  }, [trigger, targetElement, position, onComplete, duration]);

  return null;
}

// Utility function to create confetti at specific coordinates
export const createSlotConfetti = (x: number, y: number, colors?: string[]) => {
  try {
    const defaultColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { x: x / window.innerWidth, y: y / window.innerHeight },
      colors: colors || defaultColors,
      startVelocity: 20,
      gravity: 0.7,
      ticks: 180,
      scalar: 0.7
    });
  } catch (error) {
    console.error('Error creating slot confetti:', error);
  }
};

// Create confetti for a DOM element
export const createElementConfetti = (element: HTMLElement, colors?: string[]) => {
  try {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    createSlotConfetti(centerX, centerY, colors);
  } catch (error) {
    console.error('Error creating element confetti:', error);
  }
};
