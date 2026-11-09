import React, { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/videos/uic-building.mp4";
const POSTER_SRC = "/videos/uic-building-poster.jpg";

const SiteBackgroundVideo = () => {
  const videoRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReducedMotion(media.matches);

    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const video = videoRef.current;
    if (!video) return;

    const handleVisibility = () => {
      if (document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [reducedMotion]);

  return (
    <div className="site-background" aria-hidden="true">
      {reducedMotion ? (
        <img className="site-background-video" src={POSTER_SRC} alt="" />
      ) : (
        <video
          ref={videoRef}
          className="site-background-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={POSTER_SRC}
          tabIndex={-1}
          disablePictureInPicture
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      )}
      <div className="site-background-overlay" />
      <div className="site-background-grid" />
    </div>
  );
};

export default SiteBackgroundVideo;
