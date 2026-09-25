import React, { useEffect, useState } from "react";

/**
 * TopProgressBar + Instant Route Navigation Feedback
 * Gives users immediate visual feel when navigating between lazy routes
 * and blocks duplicate tapping while route chunks are resolving.
 */
export default function TopProgressBar() {
  const [progress, setProgress] = useState(25);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setProgress(55), 60);
    const t2 = setTimeout(() => setProgress(80), 180);
    const t3 = setTimeout(() => setProgress(95), 350);
    // If navigation takes more than 100ms, show elegant center feedback
    const tFeedback = setTimeout(() => setShowFeedback(true), 100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tFeedback);
    };
  }, []);

  return (
    <>
      {/* Top glowing progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[999999] h-[3.5px] bg-transparent pointer-events-none overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#FA4F2E] via-orange-400 to-[#1A2B49] transition-all duration-200 ease-out shadow-[0_0_12px_rgba(250,79,46,0.9)]"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      {/* Immediate center feedback overlay if resolving takes >100ms (prevents double tap and gives instant feel) */}
      {showFeedback && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-white/40 backdrop-blur-[1px] pointer-events-auto transition-opacity duration-150">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#1A2B49] text-white text-sm font-medium shadow-2xl">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Opening...</span>
          </div>
        </div>
      )}
    </>
  );
}
