/**
 * notificationService.ts
 * Centralized service for handling audible and haptic alerts.
 */

export const playPing = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1); // Slide down to A4

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
  } catch (e) {
    console.warn("Audio alert failed:", e);
  }
};

export const playVibration = () => {
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate([100, 50, 100]);
    } catch (e) {
      console.warn("Vibration failed:", e);
    }
  }
};
