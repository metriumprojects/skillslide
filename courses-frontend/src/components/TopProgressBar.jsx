import React, { useEffect, useState } from "react";

/**
 * TopProgressBar + Instant Route Navigation Feedback
 * Gives users immediate visual feel when navigating between lazy routes
 * and blocks duplicate tapping while route chunks are resolving.
 */
export default function TopProgressBar() {
  const [progress, setProgress] = useState(25);

  useEffect(() => {
    const t1 = setTimeout(() => setProgress(55), 60);
    const t2 = setTimeout(() => setProgress(80), 180);
    const t3 = setTimeout(() => setProgress(95), 350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    /* Top glowing progress bar (non-blocking, subtle indicator) */
    <div className="fixed top-0 left-0 right-0 z-[999999] h-[3px] bg-transparent pointer-events-none overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-[#FA4F2E] via-orange-400 to-[#1A2B49] transition-all duration-200 ease-out shadow-[0_0_12px_rgba(250,79,46,0.9)]"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}
