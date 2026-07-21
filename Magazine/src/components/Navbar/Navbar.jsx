import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Feedback', path: '/feedback' },
    { name: 'About', path: '/about' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-pink-200 via-purple-200 via-blue-200 to-green-200 shadow-md px-6 py-4 flex justify-between items-center">
      <div className="text-[1.8rem] font-bold bg-gradient-to-r from-gray-700 via-purple-700 to-green-700 bg-clip-text text-transparent font-poppins">
        Vibe
      </div>

      {/* Desktop Nav Links */}
      <div className={`hidden md:flex gap-8 items-center`}>
        {navLinks.map(({ name, path }) => (
          <Link
            key={path}
            to={path}
            className={`relative text-gray-800 font-medium transition duration-300
              ${location.pathname === path ? 'text-purple-500 after:w-full' : 'hover:after:w-full'}
              after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:bg-gray-800 after:w-0 after:transition-all`}
          >
            {name}
          </Link>
        ))}
      </div>

      {/* Mobile Toggle Button */}
      <div className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex flex-col gap-1 cursor-pointer">
          <span
            className={`h-[3px] w-6 bg-gray-800 rounded transition-transform duration-300 ${
              isOpen ? 'rotate-45 translate-y-[7px]' : ''
            }`}
          ></span>
          <span
            className={`h-[3px] w-6 bg-gray-800 rounded transition-opacity duration-300 ${
              isOpen ? 'opacity-0' : ''
            }`}
          ></span>
          <span
            className={`h-[3px] w-6 bg-gray-800 rounded transition-transform duration-300 ${
              isOpen ? '-rotate-45 -translate-y-[7px]' : ''
            }`}
          ></span>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {isOpen && (
        <div className="absolute top-[70px] right-6 bg-gradient-to-br from-pink-100 via-purple-200 to-green-100 flex flex-col gap-4 px-6 py-4 rounded-xl shadow-lg md:hidden">
          {navLinks.map(({ name, path }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setIsOpen(false)}
              className={`relative text-gray-800 font-medium transition duration-300
                ${location.pathname === path ? 'text-purple-500 after:w-full' : 'hover:after:w-full'}
                after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:bg-gray-800 after:w-0 after:transition-all`}
            >
              {name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
