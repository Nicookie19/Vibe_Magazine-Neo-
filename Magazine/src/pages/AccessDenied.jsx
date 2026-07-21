import React from "react";
import { useNavigate } from "react-router-dom";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0c10] via-[#1b0b28] to-[#071030] text-gray-200 flex items-center justify-center px-6">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-2xl w-full">
        <div className="bg-red-900/20 backdrop-blur-sm rounded-3xl border-2 border-red-500/50 shadow-2xl shadow-red-500/30 p-12 text-center">
          {/* Error Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center animate-pulse shadow-2xl shadow-red-500/50">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
          </div>

          {/* Error Code */}
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-4">
            403
          </h1>

          {/* Error Title */}
          <h2 className="text-4xl font-bold text-white mb-6">
            Access Denied
          </h2>

          {/* Error Message */}
          <p className="text-xl text-gray-300 mb-4 leading-relaxed">
            You don't have permission to access this page.
          </p>
          <p className="text-lg text-red-300 mb-10">
            This area is restricted to authorized administrators only.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/50 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              <span>Go to Homepage</span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-10 pt-8 border-t border-red-500/30">
            <p className="text-gray-400 text-sm">
              If you believe you should have access to this page, please contact the system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
