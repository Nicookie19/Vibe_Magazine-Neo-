// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if this is a valid password reset session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          setError("Invalid or expired password reset link. Please request a new one.");
          setIsValidToken(false);
          return;
        }

        if (!session) {
          // Check if we have access_token and refresh_token in URL
          const accessToken = searchParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token');
          const type = searchParams.get('type');

          if (accessToken && refreshToken && type === 'recovery') {
            // Set the session using the tokens from URL
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (setSessionError) {
              console.error("Set session error:", setSessionError);
              setError("Invalid password reset link. Please request a new one.");
              setIsValidToken(false);
              return;
            }

            if (data?.session) {
              console.log("Valid password reset session established");
              setIsValidToken(true);
              return;
            }
          }

          setError("Invalid or expired password reset link. Please request a new one.");
          setIsValidToken(false);
          return;
        }

        // If we have a session, check if it's for password recovery
        console.log("Session found, checking validity for password reset");
        setIsValidToken(true);

      } catch (err) {
        console.error("Auth check error:", err);
        setError("Something went wrong. Please try again.");
        setIsValidToken(false);
      }
    };

    checkSession();
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting to update password...");

      // Update the password
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        console.log("Password updated successfully");
        
        // Sign out immediately to prevent auto-login
        try {
          console.log("Signing out user to prevent auto-login after password reset...");
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
          
          console.log("User successfully signed out after password reset");
        } catch (signOutError) {
          console.warn("Error during sign out:", signOutError);
          // Continue anyway, the user will see the success message
        }
        
        setSuccess("Password updated successfully! You will be redirected to login in 3 seconds.");
        
        // Redirect to login after success
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: "Password updated successfully. Please log in with your new password." 
            }
          });
        }, 3000);

        return;
      }

      throw new Error("Failed to update password. Please try again.");

    } catch (error) {
      console.error("Password reset error:", error);
      
      if (error.message.includes("session")) {
        setError("Your password reset link has expired. Please request a new one.");
      } else if (error.message.includes("same")) {
        setError("New password must be different from your current password.");
      } else {
        setError("Failed to update password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b0c10] via-[#1b0b28] to-[#071030] flex items-center justify-center px-6">
        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-gradient-to-br from-[#241536]/80 via-[#1b0b28]/70 to-[#0f0f23]/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl p-8 text-center">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-purple-300">Verifying password reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
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
              <h1 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h1>
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
            <div className="w-16 h-16 rounded-full border-2 border-purple-400/50 flex items-center justify-center shadow-lg overflow-hidden bg-white mx-auto mb-4">
              <img 
                src="https://raw.githubusercontent.com/JayDee15999/pic/refs/heads/main/1.png" 
                alt="Vibe Magazine Logo" 
                className="w-12 h-12 object-cover rounded-full"
              />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
              Reset Password
            </h1>
            <p className="text-purple-300 text-sm font-medium">Create a new secure password</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-300 text-sm font-medium">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password Field */}
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-200"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-purple-400 text-xs mt-1">Password must be at least 6 characters long</p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-200"
                    required
                    minLength={6}
                  />
                </div>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
                {newPassword && confirmPassword && newPassword === confirmPassword && (
                  <p className="text-green-400 text-xs mt-1">Passwords match ✓</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3.5 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Update Password</span>
                    </>
                  )}
                </div>
              </button>
            </form>
          )}

          {/* Back Link */}
          <div className="mt-8 pt-6 border-t border-purple-500/20">
            <div className="text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center space-x-2 text-purple-300 hover:text-purple-200 transition-colors duration-200 text-sm font-medium"
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
    </div>
  );
};

export default ResetPassword;
