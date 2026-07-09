// src/components/Footer.js
import React from "react";

const Footer = () => {
  const socialLinks = [
    {
      name: "Facebook",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    },
  ];

  return (
    <footer className="bg-gradient-to-r from-[#241536] via-[#1b0b28] to-[#0f0f23] border-t border-purple-500/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">

          {/* University Information */}
          <div className="flex items-center space-x-4">
            {/* UIC Logo */}
            <div className="w-16 h-16 flex-shrink-0 rounded-full border-2 border-purple-400/50 overflow-hidden bg-white/10 shadow-lg">
              <img
                src="https://raw.githubusercontent.com/NotJayDee119/pic/refs/heads/main/uic-logo2-(1).png"
                alt="University of the Immaculate Conception Logo"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Text Information */}
            <div className="text-center md:text-left">
              <h3 className="text-white font-semibold text-sm mb-1">
                University of the Immaculate Conception
              </h3>
              <p className="text-gray-400 text-sm mb-2">
                Department of Digital Innovation
              </p>
              <p className="text-gray-500 text-xs">
                © {new Date().getFullYear()} All Rights Reserved
              </p>
            </div>
          </div>

          {/* Social Media */}
          <div className="flex flex-col items-center md:items-end">
            <p className="text-gray-400 text-sm mb-3 font-medium">Connect With Us</p>
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.name === "Facebook" ? "https://www.facebook.com/uicvibe" : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-purple-900/30 hover:bg-purple-700/50 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-purple-500/25"
                  aria-label={`Follow us on ${social.name}`}
                  title={social.name}
                >
                  <div className="w-5 h-5">
                    {social.icon}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;