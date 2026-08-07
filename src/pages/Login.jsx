// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase, auth, ADMIN_UUID, SUPER_ADMIN_UUID } from "../supabaseClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we have a return URL from a redirect
  const returnUrl = location.state?.returnUrl || sessionStorage.getItem("vibeOAuthReturnUrl") || "/";
  
  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the message from state to prevent it from showing on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Check if user is already logged in
  useEffect(() => { 
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Check if this is from password reset or email confirmation - if so, don't auto-login
        const urlParams = new URLSearchParams(window.location.search);
        const isFromReset = urlParams.get('type') === 'recovery';
        const isFromConfirmation = urlParams.get('type') === 'signup';
        
        if ((isFromReset || isFromConfirmation) && session?.user) {
          // Sign out immediately to prevent auto-login from reset/confirmation
          await supabase.auth.signOut();
          return;
        }
        
        if (session?.user) {
          // User is already logged in, get their role
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('role, is_active')
            .eq('id', session.user.id)
            .single();

          // OAuth can create an Auth user before it has an application profile.
          // Never grant dashboard access unless an administrator has assigned one.
          if (profileError || !profileData || !profileData.is_active) {
            await auth.signOut();
            setError(
              !profileData || profileError
                ? "This Google account is not authorized for the dashboard. Please contact an administrator."
                : "Your account has been deactivated. Please contact an administrator."
            );
            return;
          }

          if (profileData) {
            const role = profileData.role;
            
            // Store role information
            localStorage.setItem("vibeUser", session.user.email);
            localStorage.setItem("vibeRole", role);
            
            // Set admin access for admin roles
            if (role === 'admin' || role === 'superadmin') {
              localStorage.setItem("vibeAdmin", "true");
              
              // Handle superadmin role
              if (role === 'superadmin') {
                localStorage.setItem("vibeSuperAdmin", "true");
                
                // Check if this is our predefined super admin
                if (session.user.id === SUPER_ADMIN_UUID) {
                  localStorage.setItem("vibePrimarySuperAdmin", "true");
                } else {
                  localStorage.removeItem("vibePrimarySuperAdmin");
                }
              } else {
                localStorage.removeItem("vibeSuperAdmin");
                localStorage.removeItem("vibePrimarySuperAdmin");
                
                // Check if this is our predefined admin
                if (session.user.id === ADMIN_UUID) {
                  localStorage.setItem("vibePrimaryAdmin", "true");
                } else {
                  localStorage.removeItem("vibePrimaryAdmin");
                }
              }
              
              // Navigate to admin dashboard or return URL if coming from a redirect
              sessionStorage.removeItem("vibeOAuthReturnUrl");
              navigate(returnUrl.startsWith('/admin') ? returnUrl : "/admin");
            } else {
              // For regular users
              localStorage.removeItem("vibeAdmin");
              localStorage.removeItem("vibeSuperAdmin");
              localStorage.removeItem("vibePrimarySuperAdmin");
              localStorage.removeItem("vibePrimaryAdmin");
              sessionStorage.removeItem("vibeOAuthReturnUrl");
              navigate('/');
            }
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
      }
    };
    
    checkAuth();
  }, [navigate, returnUrl]);

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setGoogleLoading(true);

    try {
      // React Router state is lost during the external OAuth redirect, so retain
      // a safe in-app destination until the authenticated user returns.
      sessionStorage.setItem("vibeOAuthReturnUrl", returnUrl);
      const { error } = await auth.signInWithGoogle(`${window.location.origin}/vibelogin`);
      if (error) throw error;
    } catch (error) {
      console.error("Google sign-in error:", error);
      sessionStorage.removeItem("vibeOAuthReturnUrl");
      setError(error.message || "Google sign-in could not be started. Please try again.");
      setGoogleLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setError("");
    setResetSuccess("");

    if (!resetEmail) {
      setError("Please enter your email address");
      setResetLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      setResetSuccess("Password reset email sent! Check your inbox for the reset link.");
      setResetEmail("");
      
      // Close modal after success
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSuccess("");
      }, 3000);

    } catch (error) {
      console.error("Password reset error:", error);
      setError("Failed to send reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  // Credentials are now handled by Supabase authentication

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      console.log(`Attempting to login with email: ${email}`);
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        console.log("Login successful, user data:", data.user);
        
        // Get user role from user_profiles
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, is_active, username, display_name')
          .eq('id', data.user.id)
          .single();
        
        // Handle missing profile by creating one if necessary
        if (profileError || !profileData) {
          console.warn("User profile not found, creating one...", profileError);
          
          // Get user metadata from auth to help create profile
          const metadata = data.user.user_metadata || {};
          const username = metadata.username || email.split('@')[0];
          const displayName = metadata.display_name || metadata.full_name || username;
          const role = metadata.role || "admin"; // Default to admin if not specified
          
          // Create profile for the user
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              email: email,
              username: username,
              display_name: displayName,
              role: role,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error("Failed to create user profile:", insertError);
            throw new Error("Login successful, but we couldn't set up your profile. Please contact an administrator.");
          }
          
          // Use the values we just created
          localStorage.setItem("vibeUser", email);
          localStorage.setItem("vibeRole", role);
          
          // Set admin access for both admin and superadmin roles
          if (role === "admin" || role === "superadmin") {
            localStorage.setItem("vibeAdmin", "true");
            
            // Handle superadmin role
            if (role === "superadmin") {
              localStorage.setItem("vibeSuperAdmin", "true");
              
              // Check if this is our predefined super admin
              if (data.user.id === SUPER_ADMIN_UUID) {
                localStorage.setItem("vibePrimarySuperAdmin", "true");
              } else {
                localStorage.removeItem("vibePrimarySuperAdmin");
              }
            } else {
              localStorage.removeItem("vibeSuperAdmin");
              localStorage.removeItem("vibePrimarySuperAdmin");
              
              // Check if this is our predefined admin
              if (data.user.id === ADMIN_UUID) {
                localStorage.setItem("vibePrimaryAdmin", "true");
              } else {
                localStorage.removeItem("vibePrimaryAdmin");
              }
            }
            
            // Navigate to admin dashboard
            navigate(returnUrl.startsWith('/admin') ? returnUrl : "/admin");
          } else {
            // For non-admin users (faculty, student)
            localStorage.removeItem("vibeAdmin");
            localStorage.removeItem("vibeSuperAdmin");
            localStorage.removeItem("vibePrimarySuperAdmin");
            localStorage.removeItem("vibePrimaryAdmin");
            navigate("/"); // Redirect to home page
          }
          return;
        }
        
        console.log("Found user profile:", profileData);
        
        // Check if user is active
        if (!profileData.is_active) {
          throw new Error('Your account has been deactivated. Please contact an administrator.');
        }
        
        const role = profileData.role;
        
        // Store role information
        localStorage.setItem("vibeUser", email);
        localStorage.setItem("vibeRole", role);
        
        // Set admin access for both admin and superadmin roles
        if (role === "admin" || role === "superadmin") {
          localStorage.setItem("vibeAdmin", "true");
          
          // Handle superadmin role
          if (role === "superadmin") {
            localStorage.setItem("vibeSuperAdmin", "true");
            
            // Check if this is our predefined super admin
            if (data.user.id === SUPER_ADMIN_UUID) {
              localStorage.setItem("vibePrimarySuperAdmin", "true");
            } else {
              localStorage.removeItem("vibePrimarySuperAdmin");
            }
          } else {
            localStorage.removeItem("vibeSuperAdmin");
            localStorage.removeItem("vibePrimarySuperAdmin");
            
            // Check if this is our predefined admin
            if (data.user.id === ADMIN_UUID) {
              localStorage.setItem("vibePrimaryAdmin", "true");
            } else {
              localStorage.removeItem("vibePrimaryAdmin");
            }
          }
          
          // Navigate to admin dashboard or return URL if coming from a redirect
          navigate(returnUrl.startsWith('/admin') ? returnUrl : "/admin");
        } else {
          // For non-admin users (faculty, student)
          localStorage.removeItem("vibeAdmin");
          localStorage.removeItem("vibeSuperAdmin");
          localStorage.removeItem("vibePrimarySuperAdmin");
          localStorage.removeItem("vibePrimaryAdmin");
          navigate("/"); // Redirect to home page
        }
        return;
      }
      
      // If we reach here, something unexpected happened
      throw new Error('Login failed. Please try again.');
      
    } catch (error) {
      console.error("Login error:", error);
      
      // Provide more specific error messages
      if (error.message.includes('email')) {
        setError("Invalid email address. Please check and try again.");
      } else if (error.message.includes('password')) {
        setError("Incorrect password. Please try again.");
      } else if (error.message.includes('account has been deactivated')) {
        setError("Your account has been deactivated. Please contact an administrator.");
      } else if (error.message.includes('Email not confirmed')) {
        setError("Please confirm your email address before logging in. Check your inbox for a confirmation link.");
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

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
              Vibe Magazine
            </h1>
            <p className="text-purple-300 text-sm font-medium">Admin Dashboard Access</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-purple-300">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors duration-200"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3.5 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transform hover:scale-[1.02] disabled:opacity-70"
            >
              <div className="flex items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </div> 
            </button>
          </form>

          <div className="flex items-center gap-3 my-6" aria-hidden="true">
            <div className="h-px flex-1 bg-purple-500/20" />
            <span className="text-xs uppercase tracking-wider text-purple-300/70">or</span>
            <div className="h-px flex-1 bg-purple-500/20" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-purple-400/40 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition-all duration-200 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {googleLoading ? (
              <>
                <div className="h-5 w-5 rounded-full border-2 border-gray-600 border-t-transparent animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.52h3.15c1.84-1.69 2.9-4.18 2.9-7.29Z" />
                  <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.37L15.3 16.9c-.87.58-1.98.92-3.3.92-2.54 0-4.69-1.71-5.46-4.01H3.29v2.6A9.75 9.75 0 0 0 12 21.75Z" />
                  <path fill="#FBBC05" d="M6.54 13.81a5.87 5.87 0 0 1 0-3.62v-2.6H3.29a9.75 9.75 0 0 0 0 8.82l3.25-2.6Z" />
                  <path fill="#EA4335" d="M12 6.18c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.29 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.71 5.34l3.25 2.6C7.31 7.89 9.46 6.18 12 6.18Z" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Back Link */}
          <div className="mt-8 pt-6 border-t border-purple-500/20">
            <div className="text-center">
              <Link 
                to="/" 
                className="inline-flex items-center space-x-2 text-purple-300 hover:text-purple-200 transition-colors duration-200 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Vibe Club</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#241536]/90 via-[#1b0b28]/90 to-[#0f0f23]/90 backdrop-blur-sm rounded-xl border border-purple-500/40 p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center text-purple-400 mb-4">
                <div className="bg-purple-500/20 p-2 rounded-full">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white ml-3">Reset Password</h3>
              </div>
              
              <p className="text-white mb-6">Enter your email address and we'll send you a link to reset your password.</p>

              {/* Success Message */}
              {resetSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-green-300 text-sm font-medium">{resetSuccess}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-300 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-200"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError("");
                      setResetSuccess("");
                      setResetEmail("");
                    }}
                    className="flex-1 px-4 py-2 bg-transparent border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-500/10 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-200 font-medium disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending...
                      </div>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
