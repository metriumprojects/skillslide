import React, { useEffect, useState } from "react";

/**
 * Sleek 3px top loading progress bar that renders within 16ms of route transitions,
 * eliminating the blank-freeze feeling during Suspense chunk resolution.
 */
export default function TopProgressBar() {
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const t1 = setTimeout(() => setProgress(45), 80);
    const t2 = setTimeout(() => setProgress(75), 200);
    const t3 = setTimeout(() => setProgress(90), 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-[3px] bg-transparent pointer-events-none overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}
