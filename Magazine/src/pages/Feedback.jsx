import React from "react";
import "./feedback.css";
import HTMLFlipBook from "react-pageflip";


const Feedback = () => {
  const cards = Array.from({ length: 7 });

  const pages = [
    {
      content: "Click Here",
      image: "https://images.pexels.com/photos/30483242/pexels-photo-30483242.jpeg",
      alt: "Magazine Cover",
    },
    {
      title: "Culture",
      content: "Smoking",
      image: "https://images.pexels.com/photos/29339966/pexels-photo-29339966.jpeg",
      alt: "Cultural Art",
    },
    {
      title: "Design",
      content: "Design trends that define 2025.",
      image: "https://images.pexels.com/photos/30085985/pexels-photo-30085985.jpeg",
      alt: "Design Concepts",
    },
    {
      title: "Music",
      content: "Underground artists you should know.",
      image: "https://images.pexels.com/photos/26746378/pexels-photo-26746378.jpeg",
      alt: "Music Scene",
    },
    {
      content: "Go Back",
      image: "https://images.pexels.com/photos/20410467/pexels-photo-20410467.jpeg",
      alt: "Back Cover Design",
    },
  ];

  return (
    <>
      {/* Section 1 - Landscape Cards */}
      <section className="card__container">
        {cards.map((_, index) => (
          <div className="card mobile" tabIndex="0" key={`section1-${index}`}></div>
        ))}
      </section>

      {/* Section 2 - Landscape Cards */}
      <section className="card__container">
        {cards.map((_, index) => (
          <div className="card mobile" tabIndex="0" key={`section2-${index}`}></div>
        ))}
      </section>

      {/* Section 3 - Flipbook */}
      <section className="flipbook-section">
        <HTMLFlipBook
          width={300}
          height={450}
          size="stretch"
          minWidth={300}
          maxWidth={600}
          minHeight={450}
          maxHeight={900}
          maxShadowOpacity={0.3}
          showCover={true}
          className="magazine-flipbook"
        >
          {pages.map((page, index) => (
            <div
              key={index}
              className={`page ${index === 0 || index === pages.length - 1 ? "cover-page" : ""}`}
            >
              <div className="image-container">
                <img src={page.image} alt={page.alt} className="page-image" />
                <div className="image-overlay" /> 
                {index === 0 || index === pages.length - 1 ? (
                  <div className="cover-text-right">
                    <p>{page.content}</p>
                  </div>
                ) : (
                  <div className="page-content">
                    {page.title && <h2>{page.title}</h2>}
                    {page.content && <p>{page.content}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </HTMLFlipBook>
      </section>
    </>
  );
};

export default Feedback;
