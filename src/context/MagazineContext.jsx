// src/context/MagazineContext.js
import React, { createContext, useState, useContext } from "react";

// Initial magazine data
const initialMagazines = [ /* paste your magazine data array here */ ];

const MagazineContext = createContext();

export const useMagazines = () => useContext(MagazineContext);

export const MagazineProvider = ({ children }) => {
  const [magazines, setMagazines] = useState(initialMagazines);

  const removeMagazine = (id) => {
    setMagazines((prev) => prev.filter((mag) => mag.id !== id));
  };

  return (
    <MagazineContext.Provider value={{ magazines, removeMagazine }}>
      {children}
    </MagazineContext.Provider>
  );
};
