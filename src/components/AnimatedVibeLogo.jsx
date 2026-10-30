import { useState } from "react";

export default function AnimatedVibeLogo() {
  const [paused, setPaused] = useState(false);

  return (
    <div className={`vibe-logo-stage${paused ? " is-paused" : ""}`}>
      <div className="vibe-logo-float">
        <img
          src="/brand/vibe-tv.png"
          alt="VIBE! Colorful lettering inside a retro turquoise television"
          width="525"
          height="472"
          fetchPriority="high"
          className="vibe-hero-logo"
        />
      </div>
      <button
        type="button"
        className="vibe-motion-toggle"
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
      >
        {paused ? "Play logo animation" : "Pause logo animation"}
      </button>
    </div>
  );
}
