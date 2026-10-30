import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase, ADMIN_UUID, SUPER_ADMIN_UUID } from "../supabaseClient";

const accessKeys = ["vibeAdmin", "vibeSuperAdmin", "vibePrimaryAdmin", "vibePrimarySuperAdmin", "vibeRole", "vibeUser"];

const ProtectedRoute = ({ children }) => {
  const [access, setAccess] = useState("loading");

  useEffect(() => {
    let mounted = true;
    let request = 0;
    let refreshTimer;
    const checkAccess = async () => {
      const current = ++request;
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        let profile = null;
        if (session?.user) {
          const result = await supabase.from("user_profiles")
            .select("role, is_active").eq("id", session.user.id).single();
          if (result.error) throw result.error;
          profile = result.data;
        }
        if (!mounted || current !== request) return;
        accessKeys.forEach(key => localStorage.removeItem(key));
        if (!profile?.is_active || !["admin", "superadmin"].includes(profile.role)) {
          setAccess("denied");
          return;
        }
        localStorage.setItem("vibeAdmin", "true");
        localStorage.setItem("vibeRole", profile.role);
        localStorage.setItem("vibeUser", session.user.email || "");
        if (profile.role === "superadmin") localStorage.setItem("vibeSuperAdmin", "true");
        if (profile.role === "superadmin" && session.user.id === SUPER_ADMIN_UUID) localStorage.setItem("vibePrimarySuperAdmin", "true");
        if (profile.role === "admin" && session.user.id === ADMIN_UUID) localStorage.setItem("vibePrimaryAdmin", "true");
        setAccess("allowed");
      } catch {
        if (mounted && current === request) {
          accessKeys.forEach(key => localStorage.removeItem(key));
          setAccess("denied");
        }
      }
    };
    checkAccess();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Leave the auth callback before asking Supabase for the latest session.
      clearTimeout(refreshTimer);
      request++;
      setAccess("loading");
      refreshTimer = setTimeout(checkAccess, 0);
    });
    return () => {
      mounted = false;
      clearTimeout(refreshTimer);
      subscription.unsubscribe();
    };
  }, []);

  if (access === "loading") {
    return (
      <div className="min-h-screen bg-[#090d0f] flex items-center justify-center">
        <div className="text-center" role="status">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Verifying access...</p>
        </div>
      </div>
    );
  }
  return access === "allowed" ? children : <Navigate to="/access-denied" replace />;
};

export default ProtectedRoute;
