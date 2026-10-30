// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import AdminNavbar from "../components/AdminNavbar";
import UploadTab from "./AdminDashboard/UploadTab";
import AnalyticsTab from "./AdminDashboard/AnalyticsTab";
import FeedbackTab from "./AdminDashboard/FeedbackTab";
import CommentsTab from "./AdminDashboard/CommentsTab";
import LibraryTab from "./AdminDashboard/LibraryTab";
import AdminSubmissions from "./AdminDashboard/AdminSubmissions";
import UserManagementTab from "./AdminDashboard/UserManagementTab";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

const AdminDashboard = () => {
  // Use location to get query parameters
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  
  // Initialize activeTab from URL parameter or localStorage, fallback to "upload"
  const [activeTab, setActiveTab] = useState(() => {
    // First check URL parameter
    if (tabParam) {
      return tabParam;
    }
    
    // Then check localStorage
    const savedTab = localStorage.getItem('vibeAdminActiveTab');
    return savedTab || "upload";
  });
  
  const [magazines, setMagazines] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    cover: "",
    template: "default",
    pages: [],
    pdfurl: "",
    published: false,
  });

  const [editor, setEditor] = useState({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    hue: 0,
    accentColor: "#60c5ce",
    titleColor: "#ffffff",
  });

  const pagesDropRef = useRef(null);
  const isAdmin = localStorage.getItem("vibeAdmin") === "true";
  const isSuperAdmin = localStorage.getItem("vibeSuperAdmin") === "true";

  // Fetch magazines from Supabase
  const fetchMagazines = async () => {
    const { data, error } = await supabase
      .from("magazines")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setMagazines(data || []);
  };

  // Fetch submissions from Supabase
  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setSubmissions(data || []);
  };

  // Effect for persisting active tab to localStorage and URL + Auto refresh on tab change
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('vibeAdminActiveTab', activeTab);
    
    // Update URL with query parameter
    const url = new URL(window.location);
    url.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', url);
    
    // Auto refresh data when tab changes for real-time updates
    if (isAdmin) {
      fetchMagazines();
      fetchSubmissions();
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      window.location.href = "/vibelogin";
      return;
    }
    fetchMagazines();
    fetchSubmissions();
    // Realtime updates
    const channel = supabase
      .channel("magazines-changes-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "magazines" },
        () => fetchMagazines()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions" },
        () => fetchSubmissions()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const handleEditorChange = (e) => {
    const { name, value } = e.target;
    setEditor((prev) => ({ ...prev, [name]: value }));
  };

  // Remove magazine from Supabase
  const removeMagazine = async (id) => {
    // Remove the browser confirmation dialog - LibraryTab.jsx handles confirmation
    const { error } = await supabase.from("magazines").delete().eq("id", id);
    if (!error) {
      setMagazines((prev) => prev.filter((m) => m.id !== id));
    } else {
      console.error("Error deleting magazine:", error);
      throw new Error(error.message);
    }
  };

  // If not admin, show loading or redirect message
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#090d0f] via-[#0e1b1e] to-[#0b1417] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090d0f] via-[#0e1b1e] to-[#0b1417] flex flex-col">
      <AdminNavbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Admin Role Badge - Positioned below navbar */}
      <div className="relative z-10 px-3 sm:px-4 md:px-6 pt-6 pb-2">
        <div className="max-w-7xl mx-auto flex justify-start">
          <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border ${
            isSuperAdmin 
              ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-yellow-500/50 text-yellow-200 shadow-lg shadow-yellow-500/20' 
              : 'bg-gradient-to-r from-brand-500/30 to-blue-500/30 border-brand-500/50 text-brand-200 shadow-lg shadow-brand-500/20'
          } backdrop-blur-md`}>
            <svg 
              className="w-5 h-5" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span className="font-bold text-sm tracking-wide">
              {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <main className="relative flex-1">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
          {/* Tab Content */}
          <div className="vibe-panel bg-black/20 rounded-xl sm:rounded-2xl border border-brand-500/20 shadow-2xl overflow-hidden">
            {activeTab === "upload" && (
              <div className="p-4 sm:p-6 md:p-8">
                <UploadTab
                  formData={formData}
                  setFormData={setFormData}
                  editor={editor}
                  setEditor={setEditor}
                  handleEditorChange={handleEditorChange}
                  magazines={magazines}
                  setMagazines={setMagazines}
                  pagesDropRef={pagesDropRef}
                  setActiveTab={setActiveTab}
                />
              </div>
            )}
            
            {activeTab === "analytics" && (
              <div className="p-4 sm:p-6 md:p-8">
                <AnalyticsTab
                  magazines={magazines}
                  submissions={submissions}
                />
              </div>
            )}
            
            {activeTab === "feedback" && (
              <div className="p-4 sm:p-6 md:p-8">
                <FeedbackTab />
              </div>
            )}
            
            {activeTab === "comments" && (
              <div className="p-4 sm:p-6 md:p-8">
                <CommentsTab />
              </div>
            )}
            
            {activeTab === "library" && (
              <div className="p-4 sm:p-6 md:p-8">
                <LibraryTab magazines={magazines} removeMagazine={removeMagazine} fetchMagazines={fetchMagazines} />
              </div>
            )}

            {activeTab === "submissions" && (
              <AdminSubmissions />
            )}
            
            {activeTab === "users" && isSuperAdmin && (
              <div className="p-4 sm:p-6 md:p-8">
                <UserManagementTab />
              </div>
            )}
            
            {/* Fallback for unknown tabs */}
            {!["upload", "analytics", "feedback", "comments", "library", "submissions", "users"].includes(activeTab) && (
              <div className="p-4 sm:p-6 md:p-8 text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Unknown Tab</h2>
                <p className="text-gray-400 mb-4">The tab "{activeTab}" is not recognized.</p>
                <button
                  onClick={() => setActiveTab("upload")}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                >
                  Go to Upload Tab
                </button>
              </div>
            )}
          </div>

        </div>
      </main>

    </div>
  );
};

export default AdminDashboard;
