import { ReactLenis } from "lenis/dist/lenis-react";
import {
  motion,
  useAnimation,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "framer-motion";
import { FiMapPin } from "react-icons/fi";
import { useRef, useEffect } from "react";

export const SmoothScrollHero = () => {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      backgroundImage:
        "linear-gradient(180deg, #4C1D95 0%, #3B1360 45%, #000000 70%, #312E81 100%)",
      transition: { duration: 2 },
    });
  }, [controls]);

  return (
    <motion.div
      initial={{
        backgroundImage:
          "linear-gradient(90deg, #312E81 0%, rgba(59, 19, 96, 0.8) 50%, #4C1D95 100%)",
      }}
      animate={controls}
      className="min-h-screen"
    >
      <ReactLenis
        root
        options={{
          lerp: 0.05,
        }}
      >
        <Nav />
        <Hero />
        <Schedule />
      </ReactLenis>
    </motion.div>
  );
};

const Nav = () => {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-3 text-white">
      <button
        onClick={() => {
          document.getElementById("launch-schedule")?.scrollIntoView({
            behavior: "smooth",
          });
        }}
        className="flex items-center gap-1 text-xs text-zinc-400"
      >
        {/* Button content can go here */}
      </button>
    </nav>
  );
};

const SECTION_HEIGHT = 1500;

const Hero = () => {
  return (
    <div
      style={{ height: `calc(${SECTION_HEIGHT}px + 100vh)` }}
      className="relative w-full"
    >
      <CenterImage />

      <ParallaxImages />

      <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-b from-transparent to-indigo-900/80" />
    </div>
  );
};

const CenterImage = () => {
  const { scrollY } = useScroll();

  const clip1 = useTransform(scrollY, [0, 1500], [25, 0]);
  const clip2 = useTransform(scrollY, [0, 1500], [75, 100]);

  const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;

  const backgroundSize = useTransform(
    scrollY,
    [0, SECTION_HEIGHT + 500],
    ["170%", "100%"]
  );
  const opacity = useTransform(scrollY, [SECTION_HEIGHT, SECTION_HEIGHT + 500], [
    1,
    0,
  ]);

  return (
    <motion.div
      className="sticky top-0 h-screen w-full"
      style={{
        clipPath,
        backgroundSize,
        opacity,
        backgroundImage:
          "url(https://raw.githubusercontent.com/Lubanan/Pic/refs/heads/main/vibeclub.png)",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        filter: "blur(0.3px) brightness(0.9)",
      }}
    />
  );
};

const ParallaxImages = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-[200px]">
      <ParallaxImg
        src="https://raw.githubusercontent.com/Lubanan/Pic/refs/heads/main/2.png"
        alt="Sample image 1"
        start={-200}
        end={200}
        className="w-1/3"
      />
      <ParallaxImg
        src="https://raw.githubusercontent.com/Lubanan/Pic/refs/heads/main/3.png"
        alt="Sample image 2"
        start={200}
        end={-250}
        className="mx-auto w-2/3"
      />
      <ParallaxImg
        src="https://pbs.twimg.com/media/GHyhR09aUAAr6g1?format=jpg&name=4096x4096"
        alt="Sample image 3"
        start={-200}
        end={200}
        className="ml-auto w-1/3"
      />
      <ParallaxImg
        src="https://raw.githubusercontent.com/Lubanan/Pic/refs/heads/main/red-velvet-s-wendy-chill-kill-mv-shoot-wallpaper-2560x1600_7.jpg"
        alt="Sample image 4"
        start={0}
        end={-500}
        className="ml-24 w-5/12"
      />
    </div>
  );
};

const ParallaxImg = ({ className, alt, src, start, end }) => {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`${start}px end`, `end ${end * -1}px`],
  });

  const opacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0.75, 1], [1, 0.85]);

  const y = useTransform(scrollYProgress, [0, 1], [start, end]);
  const transform = useMotionTemplate`translateY(${y}px) scale(${scale})`;

  return (
    <motion.img
      src={src}
      alt={alt}
      className={className}
      ref={ref}
      style={{
        transform,
        opacity,
        filter: "drop-shadow(0 0 8px rgba(76, 29, 149, 0.4))",
      }}
    />
  );
};

const Schedule = () => {
  return (
    <section
      id="launch-schedule"
      className="mx-auto max-w-5xl px-4 py-48 text-zinc-100 font-sans"
    >
      <motion.h1
        initial={{ y: 48, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ ease: "easeInOut", duration: 0.75 }}
        className="mb-20 text-4xl font-black uppercase text-zinc-50"
      >
        Vibe Event
      </motion.h1>
      <ScheduleItem title="Party" date="Dec 9th" location="Father Celga" />
      <ScheduleItem title="Anniversary" date="Dec 20th" location="Boni" />
      <ScheduleItem title="Event" date="Jan 13th" location="Bajada" />
      <ScheduleItem title="Event" date="Feb 22nd" location="Bajada" />
      <ScheduleItem title="Event" date="Mar 1st" location="Bajada" />
      <ScheduleItem title="Event" date="Mar 8th" location="Father Celga" />
      <ScheduleItem title="ASTRA Event" date="Apr 8th" location="Bajada" />
    </section>
  );
};

const ScheduleItem = ({ title, date, location }) => {
  return (
    <motion.div
      initial={{ y: 48, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ ease: "easeInOut", duration: 0.75 }}
      className="mb-9 flex items-center justify-between border-b border-zinc-700 px-3 pb-9"
    >
      <div>
        <p className="mb-1.5 text-xl text-zinc-100">{title}</p>
        <p className="text-sm uppercase text-zinc-300">{date}</p>
      </div>
      <div className="flex items-center gap-1.5 text-end text-sm uppercase text-zinc-300">
        <p>{location}</p>
        <FiMapPin />
      </div>
    </motion.div>
  );
};
