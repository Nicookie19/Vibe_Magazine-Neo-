// src/components/Navbar.js
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { 
      name: "Home", 
      path: "/",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: "Archive", 
      path: "/archive",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      )
    },
    { 
      name: "About", 
      path: "/about",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      name: "Submit", 
      path: "/submit",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    { 
      name: "Contact", 
      path: "/contact",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: "Login",
      path: "/vibelogin",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11V7a3 3 0 00-6 0v4m-3 0h12a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8a1 1 0 011-1z" />
        </svg>
      )
    }
  ];

  return (
    <nav className="fixed top-0 w-full bg-[#0b1012] border-b border-brand-500/30 z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo and Title */}
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="w-14 h-12 flex shrink-0 items-center justify-center">
              <img 
                src="/brand/vibe-tv.png"
                alt="Vibe Magazine Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Vibe Magazine
              </h1>
              <p className="text-xs text-brand-300 font-medium">Campus Insights</p>
            </div>
          </Link>

          {/* Hamburger Menu Icon (Mobile Only) */}
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            className="lg:hidden text-brand-300 text-2xl cursor-pointer transition-transform duration-300 ease-in-out hover:text-brand-200"
            onClick={toggleMenu}
            aria-label="Toggle Menu"
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* Desktop Menu */}
          <div className="vibe-panel hidden lg:flex items-center space-x-1 bg-brand-900/30 rounded-xl p-1 border border-brand-500/20">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                aria-current={location.pathname === item.path ? "page" : undefined}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 whitespace-nowrap ${
                  location.pathname === item.path
                    ? "bg-brand-300 text-black shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-brand-700/50"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <div
        id="mobile-navigation"
        inert={!isOpen}
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-[#0b1012] border-t border-brand-500/20">
          <div className="flex flex-col space-y-1 px-6 py-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                aria-current={location.pathname === item.path ? "page" : undefined}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.path
                    ? "bg-brand-300 text-black shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-brand-700/50"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
