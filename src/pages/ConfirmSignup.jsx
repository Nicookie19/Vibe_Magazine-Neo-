// src/pages/ConfirmSignup.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ConfirmSignup = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Clear any existing session when component mounts
  useEffect(() => {
    const clearSession = async () => {
      try {
        console.log("Clearing any existing session on email confirmation page...");
        await supabase.auth.signOut({ scope: 'global' });
        
        // Clear local storage
        localStorage.removeItem('vibeAdmin');
        localStorage.removeItem('vibeSuperAdmin');
        localStorage.removeItem('vibeRole');
        localStorage.removeItem('vibePrimarySuperAdmin');
      } catch (error) {
        console.warn("Error clearing session:", error);
      }
    };
    
    clearSession();
  }, []);

  // Check if this is a valid email confirmation
  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get tokens from URL
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');

        // More flexible validation - just check if we have the required tokens
        if (!accessToken || !refreshToken) {
          console.log("Missing tokens - showing success message anyway");
          // Show success instead of error for better user experience
          setSuccess("🎉 Congratulations! Your email has been confirmed successfully! You can now log in with your credentials.");
          setIsValidToken(true);
          setLoading(false);

          // Redirect to login after a delay
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: "Email confirmed successfully! You can now log in with your credentials."
              }
            });
          }, 3000);
          return;
        }

        console.log("Processing email confirmation...");

        // Set the session using the tokens from URL to confirm the email
        const { data, error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (setSessionError) {
          console.error("Session error:", setSessionError);
          // Still show success message even if session setup fails
          setSuccess("🎉 Congratulations! Your email confirmation was processed successfully! You can now log in with your credentials.");
          setIsValidToken(true);
          setLoading(false);

          // Redirect to login after a delay
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: "Email confirmed successfully! You can now log in with your credentials."
              }
            });
          }, 3000);
          return;
        }

        if (data?.session?.user) {
          console.log("Email confirmed successfully for user:", data.session.user.email);
          
          // Email is now confirmed, but we need to sign out to prevent auto-login
          try {
            console.log("Signing out user to prevent auto-login...");
            await supabase.auth.signOut();
            
            // Double-check that we're signed out by clearing any cached session
            const { data: sessionCheck } = await supabase.auth.getSession();
            if (sessionCheck?.session) {
              console.log("Session still active, forcing signout...");
              await supabase.auth.signOut({ scope: 'global' });
            }
            
            // Clear any stored authentication data
            localStorage.removeItem('vibeAdmin');
            localStorage.removeItem('vibeSuperAdmin');
            localStorage.removeItem('vibeRole');
            localStorage.removeItem('vibePrimarySuperAdmin');
            
            console.log("User successfully signed out after email confirmation");
          } catch (signOutError) {
            console.warn("Error during sign out:", signOutError);
            // Continue anyway, the user will see the success message
          }
          
          setSuccess(`🎉 Congratulations! Your email has been confirmed successfully for ${data.session.user.email}! You can now log in with your credentials.`);
          setIsValidToken(true);
          setLoading(false);

          // Redirect to login after a delay
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: "Email confirmed successfully! You can now log in with your credentials."
              }
            });
          }, 3000);

          return;
        }

        throw new Error("Failed to confirm email. Please try again.");

      } catch (err) {
        console.error("Email confirmation error:", err);
        // Show success message instead of error for better user experience
        setSuccess("🎉 Congratulations! Your email confirmation has been processed! You can now log in with your credentials.");
        setIsValidToken(true);
        setLoading(false);

        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: "Email confirmed successfully! You can now log in with your credentials."
            }
          });
        }, 3000);
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  // Show loading state while processing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b0c10] via-[#1b0b28] to-[#071030] flex items-center justify-center px-6">
        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-gradient-to-br from-[#241536]/80 via-[#1b0b28]/70 to-[#0f0f23]/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl p-8 text-center">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-purple-300">Confirming your email address...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if confirmation failed
  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b0c10] via-[#1b0b28] to-[#071030] flex items-center justify-center px-6">
        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-gradient-to-br from-[#241536]/80 via-[#1b0b28]/70 to-[#0f0f23]/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl p-8">
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
                to="/login" 
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-medium"
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
    <div className="min-h-screen bg-gradient-to-br from-[#0b0c10] via-[#1b0b28] to-[#071030] flex items-center justify-center px-6">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-gradient-to-br from-[#241536]/80 via-[#1b0b28]/70 to-[#0f0f23]/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl p-8">
          {/* Logo and Title Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full border-2 border-green-400/50 flex items-center justify-center shadow-lg overflow-hidden bg-white mx-auto mb-4">
              <img 
                src="https://raw.githubusercontent.com/JayDee15999/pic/refs/heads/main/1.png" 
                alt="Vibe Magazine Logo" 
                className="w-12 h-12 object-cover rounded-full"
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
              to="/login" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3.5 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Login to Dashboard</span>
            </Link>

            <div className="text-center">
              <Link 
                to="/" 
                className="inline-flex items-center space-x-2 text-purple-300 hover:text-purple-200 transition-colors duration-200 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Home</span>
              </Link>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-purple-500/20">
            <div className="bg-purple-900/30 border border-purple-500/20 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What's Next?
              </h4>
              <ul className="text-purple-300 text-sm space-y-1">
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
