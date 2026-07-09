// src/components/AdminNavbar.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase, auth } from "../supabaseClient";

const AdminNavbar = ({ activeTab, setActiveTab }) => {
  const isSuperAdmin = localStorage.getItem("vibeSuperAdmin") === "true";
  
  // Custom tab click handler to update both state and URL
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    
    // Update URL with query parameter
    const url = new URL(window.location);
    url.searchParams.set('tab', tabId);
    window.history.replaceState({}, '', url);
  };
  
  const tabs = [
    { 
      id: "upload", 
      label: "Upload & Edit",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      )
    },
    { 
      id: "analytics", 
      label: "Analytics",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      id: "submissions", 
      label: "Submissions",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )
    },
    { 
      id: "feedback", 
      label: "Feedback",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      )
    },
    { 
      id: "comments", 
      label: "Comments",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    { 
      id: "library", 
      label: "Library",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      )
    },
    ...(isSuperAdmin ? [{ 
      id: "users", 
      label: "User Management",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }] : []),
  ];

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      
      console.log("Starting logout process...");
      
      // Sign out using the auth helper from supabaseClient.js
      const { error } = await auth.signOut();
      
      if (error) {
        console.error("Error signing out:", error);
      }
      
      // Always clear localStorage regardless of error
      localStorage.removeItem("vibeAdmin");
      localStorage.removeItem("vibeSuperAdmin");
      localStorage.removeItem("vibePrimarySuperAdmin");
      localStorage.removeItem("vibePrimaryAdmin");
      localStorage.removeItem("vibeUser");
      localStorage.removeItem("vibeRole");
      localStorage.removeItem("vibeAdminActiveTab");
      
      console.log("Logout complete, redirecting to login...");
      
      // Force a small delay to ensure cleanup completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirect to login page
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
      
      // Force cleanup even on error
      localStorage.removeItem("vibeAdmin");
      localStorage.removeItem("vibeSuperAdmin");
      localStorage.removeItem("vibePrimarySuperAdmin");
      localStorage.removeItem("vibePrimaryAdmin");
      localStorage.removeItem("vibeUser");
      localStorage.removeItem("vibeRole");
      localStorage.removeItem("vibeAdminActiveTab");
      
      // Force redirect even if there's an error
      window.location.href = "/login";
    } finally {
      setLoggingOut(false);
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-[#241536] via-[#1b0b28] to-[#0f0f23] border-b border-purple-500/30 sticky top-0 z-20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        {/* Desktop Layout - Hidden on mobile/tablet */}
        <div className="hidden lg:flex items-center justify-between">
          {/* Left Side - Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full border-2 border-purple-400/50 flex items-center justify-center shadow-lg overflow-hidden bg-white">
              <img 
                src="https://raw.githubusercontent.com/JayDee15999/pic/refs/heads/main/1.png" 
                alt="Vibe Magazine Logo" 
                className="w-8 h-8 object-cover rounded-full"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                Vibe Magazine
              </h1>
              <p className="text-xs text-purple-300 font-medium">Admin Dashboard</p>
            </div>
          </div>

          {/* Center - Horizontal Tab Navigation */}
          <div className="flex items-center space-x-1 bg-purple-900/30 rounded-xl p-1 border border-purple-500/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-purple-700/50"
                }`}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                {tab.icon}
                <span className="hidden xl:inline">{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Right Side - Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loggingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs xl:text-sm">Signing out...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-xs xl:text-sm">Logout</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-full border-2 border-purple-400/50 flex items-center justify-center shadow-lg overflow-hidden bg-white">
                <img 
                  src="https://raw.githubusercontent.com/JayDee15999/pic/refs/heads/main/1.png" 
                  alt="Vibe Magazine Logo" 
                  className="w-7 h-7 object-cover rounded-full"
                />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                  Vibe Magazine
                </h1>
                <p className="text-xs text-purple-300 font-medium hidden sm:block">Admin Dashboard</p>
              </div>
            </div>

            {/* Mobile Menu Toggle & Logout */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center space-x-1 px-2 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-xs hidden sm:inline">Logout</span>
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center justify-center w-9 h-9 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Tab Navigation */}
          {isMobileMenuOpen && (
            <div className="mt-3 pt-3 border-t border-purple-500/20">
              <div className="grid grid-cols-2 gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      handleTabClick(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                        : "text-gray-300 hover:text-white bg-purple-900/20 hover:bg-purple-700/50"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;