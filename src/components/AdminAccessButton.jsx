import React from "react";
import { Link } from "react-router-dom";

const AdminAccessButton = () => {
  return (
    <Link
      to="/login"
      className="fixed bottom-4 right-4 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-purple-500/50 opacity-30 hover:opacity-100 transition-all duration-300 hover:scale-110 z-50 group"
      title="Admin Login"
    >
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
      </svg>
    </Link>
  );
};

export default AdminAccessButton;
