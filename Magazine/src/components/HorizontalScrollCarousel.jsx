import { motion, useTransform, useScroll } from "framer-motion";
import { useRef } from "react";

const Example = () => {
  return (
    <div>
      <HorizontalScrollCarousel />
    </div>
  );
};

const HorizontalScrollCarousel = () => {
  const targetRef = useRef(null);

  // Scroll progress on the target section
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"], // full section scroll
  });

  // Horizontal translate of cards container
  const x = useTransform(scrollYProgress, [0, 1], ["1%", "-95%"]);

  // Background color transition on scroll
  const background = useTransform(
    scrollYProgress,
    [0, 1],
    [
      "linear-gradient(to bottom, #27272a, #52525b)", // neutral-800 to neutral-600
      "linear-gradient(to bottom, #4C1D95, #3B1360, #000000, #312E81)", // your purple-indigo base gradient
    ]
  );

  return (
    <motion.section
      ref={targetRef}
      style={{ background }}
      className="relative h-[300vh]"
    >
      {/* Optional: Fade top edge into previous section */}
      <div className="absolute -top-10 left-20 right-0 h-10bg-gradient-to-b from-transparent to-neutral-900 z-0 pointer-events-none" />

      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-6 px-10">
          {cards.map((card) => (
            <Card card={card} key={card.id} />
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

const Card = ({ card }) => {
  return (
    <div
      className="group relative h-[450px] w-[450px] overflow-hidden rounded-xl bg-neutral-200 shadow-2xl"
    >
      <div
        style={{
          backgroundImage: `url(${card.url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="absolute inset-0 z-0 transition-transform duration-300 group-hover:scale-110"
      />
      <div className="absolute inset-0 z-10 grid place-content-center">
        <p className="bg-gradient-to-br from-white/20 to-white/0 p-8 text-4xl md:text-6xl font-black uppercase text-white backdrop-blur-lg">
          {card.title}
        </p>
      </div>
    </div>
  );
};

export default Example;

const cards = [
  { url: "https://www.ppa.com/assets/images/ppmag_articles/header-72020jaimayhew9.jpg", title: "Title 1", id: 1 },
  { url: "https://cdn.pixabay.com/photo/2021/07/14/19/18/woman-6466907_1280.jpg", title: "Title 2", id: 2 },
  { url: "https://c0.wallpaperflare.com/preview/865/340/836/women-fashion-portraits-emotion.jpg", title: "Title 3", id: 3 },
  { url: "https://cdn.pixabay.com/photo/2021/06/22/16/04/beauty-6356536_640.jpg", title: "Title 4", id: 4 },
  { url: "https://cdn.pixabay.com/photo/2021/09/15/01/03/woman-6625371_1280.jpg", title: "Title 5", id: 5 },
  { url: "https://cdn.pixabay.com/photo/2020/11/26/02/17/man-5777656_1280.jpg", title: "Title 6", id: 6 },
  { url: "https://media.istockphoto.com/id/1183573826/photo/beautiful-afro-woman.jpg?s=612x612&w=0&k=20&c=Y_0_J-ag3VBNtlZ8W0-r2ZBPuFVExYZLrrG3-Vty_lw=", title: "Title 7", id: 7 },
  { url: "https://cdn.pixabay.com/photo/2020/11/04/16/18/woman-5712892_1280.jpg", title: "Title 8", id: 8 },
];
