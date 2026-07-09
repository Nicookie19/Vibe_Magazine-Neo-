// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Get these from your Supabase project settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Admin UUIDs - keeping these constants in sync across files
export const ADMIN_UUID = "cf6f292d-9800-49d6-b7ff-bc733067ca99";
export const SUPER_ADMIN_UUID = "5314c060-f221-4bf8-a63e-4b80cd8fa648";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Also make the client available globally for diagnostic tools
if (typeof window !== 'undefined') {
  window.supabaseClient = supabase;
}

// Authentication helpers
export const auth = {
  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },
  
  // Sign out
  signOut: async () => {
    try {
      // Sign out from Supabase auth first
      const { error } = await supabase.auth.signOut();
      
      // Clear ALL local storage items related to auth
      localStorage.removeItem("vibeUser");
      localStorage.removeItem("vibeRole");
      localStorage.removeItem("vibeAdmin");
      localStorage.removeItem("vibeSuperAdmin");
      localStorage.removeItem("vibePrimarySuperAdmin");
      localStorage.removeItem("vibePrimaryAdmin");
      localStorage.removeItem("vibeAdminActiveTab");
      
      return { error };
    } catch (err) {
      console.error("Error during sign out:", err);
      
      // Even if there's an error, clear local storage
      localStorage.removeItem("vibeUser");
      localStorage.removeItem("vibeRole");
      localStorage.removeItem("vibeAdmin");
      localStorage.removeItem("vibeSuperAdmin");
      localStorage.removeItem("vibePrimarySuperAdmin");
      localStorage.removeItem("vibePrimaryAdmin");
      localStorage.removeItem("vibeAdminActiveTab");
      
      return { error: err };
    }
  },
  
  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },
  
  // Get user role from user_profiles table
  getUserRole: async (userId) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", userId)
      .single();
      
    return { role: data?.role, error };
  },
  
  // Create a new user (Super Admin only)
  createUser: async (email, username, role) => {
    // This is a placeholder. In actual implementation, you would:
    // 1. Generate a random password
    // 2. Create the user in Supabase Auth
    // 3. Create the user profile
    // 4. Send an invitation email with password reset link
    
    // This would be handled through a secure server-side function
    const { data, error } = await supabase.functions.invoke("create-user", {
      body: { email, username, role },
    });
    
    return { data, error };
  },
  
  // Create a new super admin (Super Admin only)
  createSuperAdmin: async (email, username, displayName, password) => {
    // This calls the special edge function for creating superadmins
    const { data, error } = await supabase.functions.invoke("create-superadmin", {
      body: { 
        email, 
        username, 
        display_name: displayName, 
        password 
      },
    });
    
    return { data, error };
  },
  
  // Get all superadmins (Super Admin only)
  getAllSuperAdmins: async () => {
    const { data, error } = await supabase.rpc('get_all_superadmins');
    return { data, error };
  },
};
