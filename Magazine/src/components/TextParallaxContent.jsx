import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FiArrowUpRight } from "react-icons/fi";

export const TextParallaxContentExample = () => {
  return (
    <div className="bg-white">
      <TextParallaxContent
        imgUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        heading="Welcome to Vibe"
      >
        <ExampleContent />
      </TextParallaxContent>
    </div>
  );
};

const IMG_PADDING = 16;

const TextParallaxContent = ({ imgUrl, subheading, heading, children }) => {
  return (
    <div style={{ paddingLeft: IMG_PADDING, paddingRight: IMG_PADDING }}>
      <div className="relative h-[160vh]">
        <StickyImage imgUrl={imgUrl} />
        <OverlayCopy heading={heading} subheading={subheading} />
      </div>
      {children}
    </div>
  );
};

const StickyImage = ({ imgUrl }) => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["end end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.88]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <motion.div
      style={{
        backgroundImage: `url(${imgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: `calc(100vh - ${IMG_PADDING * 2}px)`,
        top: IMG_PADDING,
        scale,
      }}
      ref={targetRef}
      className="sticky z-0 overflow-hidden rounded-3xl shadow-xl"
    >
      {/* Dark grey gradient fade overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-neutral-900/80 via-neutral-900/50 to-transparent backdrop-blur-sm"
        style={{ opacity }}
      />
    </motion.div>
  );
};

const OverlayCopy = ({ subheading, heading }) => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const opacity = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0, 1, 0]);

  return (
    <motion.div
      style={{ y, opacity }}
      ref={targetRef}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-white px-6"
    >
      <motion.p className="mb-3 text-lg tracking-wider text-neutral-200 md:text-2xl">
        {subheading}
      </motion.p>
      <motion.h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-7xl lg:text-8xl">
        {heading}
      </motion.h1>
    </motion.div>
  );
};

const ExampleContent = () => (
  <div className="mx-auto max-w-6xl grid grid-cols-1 gap-10 px-6 pb-24 pt-16 md:grid-cols-12">
    <h2 className="col-span-1 text-3xl font-semibold md:col-span-4 md:text-4xl text-neutral-900">
      What Vibe is
    </h2>
    <div className="col-span-1 md:col-span-8">
      <p className="mb-6 text-lg md:text-xl text-neutral-600">
        Empower your organization with intuitive tools and responsive interfaces
        designed for maximum clarity and performance. We believe collaboration
        should be effortless.
      </p>
      <p className="mb-10 text-lg md:text-xl text-neutral-600">
        With a modular system and built-in integrations, you'll move faster and
        stay aligned. It's not just about productivity — it's about flow.
      </p>
      <button className="group inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 text-lg text-white shadow-md transition hover:shadow-xl hover:bg-neutral-800">
        Learn more <FiArrowUpRight className="transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  </div>
);
