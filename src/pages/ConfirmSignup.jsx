// src/pages/ConfirmSignup.jsx
import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase, auth } from "../supabaseClient";

const ConfirmSignup = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    const confirmEmail = async () => {
      try {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = searchParams.get('access_token') || fragment.get('access_token');
        const refreshToken = searchParams.get('refresh_token') || fragment.get('refresh_token');
        const linkError = searchParams.get('error_description') || fragment.get('error_description');
        if (linkError) throw new Error(linkError);
        const result = accessToken && refreshToken
          ? await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          : await supabase.auth.getSession();
        if (result.error) throw result.error;
        const user = result.data?.session?.user;
        if (!user?.email_confirmed_at) {
          throw new Error("This confirmation link is incomplete or expired. Please request a new link.");
        }
        await auth.signOut();
        if (cancelled) return;
        window.history.replaceState({}, document.title, window.location.pathname);
        setSuccess(`Your email has been confirmed for ${user.email}. You can now log in.`);
        setIsValidToken(true);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Could not confirm your email. Please request a new link.");
        setIsValidToken(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    confirmEmail();
    return () => { cancelled = true; };
  }, [searchParams]);

  // Show loading state while processing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#090d0f] via-[#0e1b1e] to-[#0b1417] flex items-center justify-center px-6">
        <div className="relative z-10 w-full max-w-lg">
          <div className="vibe-panel bg-gradient-to-br from-[#14282c]/80 via-[#0e1b1e]/70 to-[#0b1619]/80 backdrop-blur-xl rounded-2xl border border-brand-500/30 shadow-2xl p-8 text-center">
            <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-brand-300">Confirming your email address...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if confirmation failed
  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#090d0f] via-[#0e1b1e] to-[#0b1417] flex items-center justify-center px-6">
        <div className="relative z-10 w-full max-w-lg">
          <div className="vibe-panel bg-gradient-to-br from-[#14282c]/80 via-[#0e1b1e]/70 to-[#0b1619]/80 backdrop-blur-xl rounded-2xl border border-brand-500/30 shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full border-2 border-red-400/50 flex items-center justify-center mx-auto mb-4 bg-red-500/10">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Confirmation Failed</h1>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
            
            <div className="text-center">
              <Link 
                to="/vibelogin"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-brand-700 text-white px-6 py-3 rounded-lg hover:from-brand-600 hover:to-brand-600 transition-all duration-300 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success confirmation
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090d0f] via-[#0e1b1e] to-[#0b1417] flex items-center justify-center px-6">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="vibe-panel bg-gradient-to-br from-[#14282c]/80 via-[#0e1b1e]/70 to-[#0b1619]/80 backdrop-blur-xl rounded-2xl border border-brand-500/30 shadow-2xl p-8">
          {/* Logo and Title Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full border-2 border-green-400/50 flex items-center justify-center shadow-lg overflow-hidden bg-white mx-auto mb-4">
              <img 
                src="/brand/vibe-tv.png"
                alt="Vibe Magazine Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent mb-2">
              Email Confirmed!
            </h1>
            <p className="text-green-300 text-sm font-medium">Your account is now active</p>
          </div>

          {/* Success Message */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Welcome to Vibe Magazine!</h3>
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link 
              to="/vibelogin"
              className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white py-3.5 rounded-lg hover:from-brand-600 hover:to-brand-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Login to Dashboard</span>
            </Link>

            <div className="text-center">
              <Link 
                to="/" 
                className="inline-flex items-center space-x-2 text-brand-300 hover:text-brand-200 transition-colors duration-200 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Home</span>
              </Link>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-brand-500/20">
            <div className="bg-brand-900/30 border border-brand-500/20 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What's Next?
              </h4>
              <ul className="text-brand-300 text-sm space-y-1">
                <li>• Log in with your email and password</li>
                <li>• Access the admin dashboard</li>
                <li>• Start managing Vibe Magazine content</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmSignup;
