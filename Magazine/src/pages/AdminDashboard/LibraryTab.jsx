// src/pages/AdminDashboard/LibraryTab.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

const LibraryTab = ({ magazines, removeMagazine, fetchMagazines }) => {
  const navigate = useNavigate();
  // Event manager state
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: "", date: "", venue: "", image: "" });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState(""); // Error message state
  
  // Modal state for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState(""); // "magazine" or "event"
  
  // Success toast state
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Magazine reader modal state
  const [showMagazineModal, setShowMagazineModal] = useState(false);
  const [selectedMagazine, setSelectedMagazine] = useState(null);

  // Handle magazine click - navigate to archive with magazine selected
  const handleMagazineClick = (magazine) => {
    navigate(`/archive?magazineId=${magazine.id}`);
  };

  // Close magazine modal
  const closeMagazineModal = () => {
    setShowMagazineModal(false);
    setSelectedMagazine(null);
  };

  // Fetch events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date, venue, image")
        .order("date", { ascending: true });
      if (!error && data) setEvents(data);
    };
    fetchEvents();
  }, []);

  // Upload image to Supabase Storage
  const uploadImage = async (file) => {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("event-images")
      .upload(fileName, file);
    if (error) return null;
    const url = supabase.storage
      .from("event-images")
      .getPublicUrl(fileName).data.publicUrl;
    return url;
  };

  // Add new event
  const addEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    let imageUrl = form.image;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) {
        setErrorMsg("Image upload failed. Please try again.");
        setLoading(false);
        return;
      }
    }
    const { data, error } = await supabase
      .from("events")
      .insert([{ ...form, image: imageUrl }])
      .select(); // Ensure the inserted row is returned
    if (error) {
      setErrorMsg(error.message || "Event upload failed. Please try again.");
      setSuccessMsg("");
    } else if (data && data[0]) {
      setEvents((prev) => [...prev, { ...form, image: imageUrl, id: data[0].id }]);
      setForm({ title: "", date: "", venue: "", image: "" });
      setImageFile(null);
      setSuccessMsg("Event uploaded successfully!");
      setErrorMsg("");
    } else {
      setErrorMsg("Event upload failed. No data returned.");
      setSuccessMsg("");
    }
    setLoading(false);
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (item, type) => {
    setDeleteTarget(item);
    setDeleteType(type);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      try {
        if (deleteType === "magazine") {
          console.log(`Admin deleting magazine ID: ${deleteTarget.id}`);
          // Call removeMagazine without any browser confirmation
          try {
            removeMagazine(deleteTarget.id);
            setSuccessMessage("Magazine deleted successfully!");
            setShowSuccessToast(true);
          } catch (error) {
            console.error("Error removing magazine:", error);
            alert("❌ Failed to delete magazine: " + error.message);
            return;
          }
        } else if (deleteType === "event") {
          console.log(`Admin deleting event ID: ${deleteTarget.id}`);
          
          const { error } = await supabase.from("events").delete().eq("id", deleteTarget.id);
          
          if (error) {
            console.error("Error deleting event:", error);
            alert("❌ Failed to delete event: " + error.message + "\n\nCheck if you have proper permissions.");
            return;
          }
          
          // Successfully deleted, update local state immediately
          setEvents((prev) => prev.filter((ev) => ev.id !== deleteTarget.id));
          setSuccessMessage("Event deleted successfully!");
          setShowSuccessToast(true);
        }
        
        // Auto-hide toast after 3 seconds
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 3000);
        
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("❌ Unexpected error occurred: " + error.message);
      }
    }
    
    setShowDeleteModal(false);
    setDeleteTarget(null);
    setDeleteType("");
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
    setDeleteType("");
  };

  // Publish a draft magazine
  const publishDraft = async (magazineId) => {
    try {
      const { error } = await supabase
        .from("magazines")
        .update({ published: true })
        .eq("id", magazineId);

      if (error) {
        console.error("Error publishing magazine:", error);
        alert("❌ Failed to publish magazine: " + error.message);
        return;
      }

      // Refresh the magazines list to reflect the change
      if (fetchMagazines) {
        await fetchMagazines();
      }

      setSuccessMessage("Magazine published successfully!");
      setShowSuccessToast(true);

      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);

    } catch (error) {
      console.error("Error publishing magazine:", error);
      alert("❌ Unexpected error occurred: " + error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-8 sm:space-y-12">
      {/* Magazine Library Section */}
      <section className="space-y-4 sm:space-y-6">
        <div className="border-b border-gray-700 pb-3 sm:pb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight">Magazine Library</h2>
          <p className="text-sm sm:text-base text-gray-400 mt-1 sm:mt-2">Manage all your magazines (published and drafts)</p>
        </div>
        
        {magazines.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <p className="text-gray-500 text-base sm:text-lg">No issues published yet</p>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">Your published magazines will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {magazines.map((m) => (
              <div key={m.id} className="bg-gradient-to-br from-[#241231] to-[#1a0d28] border border-purple-500/20 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                <div 
                  className="p-4 sm:p-6 cursor-pointer"
                  onClick={() => handleMagazineClick(m)}
                >
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={m.cover} 
                        alt={m.title} 
                        className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg shadow-md border border-purple-500/30 transition-transform duration-300 hover:scale-105" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base sm:text-lg text-gray-100 mb-1 sm:mb-2 truncate hover:text-purple-300 transition-colors duration-200">{m.title}</h3>
                      <p className="text-gray-300 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{m.subtitle}</p>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full">
                            {new Date(m.created_at).toLocaleDateString()}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            m.published 
                              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          }`}>
                            {m.published ? "Published" : "Draft"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          {!m.published && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                publishDraft(m.id);
                              }}
                              className="text-green-400 hover:text-green-300 text-xs font-medium hover:bg-green-500/10 px-2 py-1 rounded transition-colors duration-200 border border-green-400/30 hover:border-green-300"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showDeleteConfirmation(m, "magazine");
                            }}
                            className="text-red-400 hover:text-red-300 text-xs font-medium hover:bg-red-500/10 px-2 py-1 rounded transition-colors duration-200 border border-red-400/30 hover:border-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Event Manager Section */}
      <section className="space-y-4 sm:space-y-6">
        <div className="border-b border-gray-700 pb-3 sm:pb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight">Event Manager</h2>
          <p className="text-sm sm:text-base text-gray-400 mt-1 sm:mt-2">Create and manage upcoming events</p>
        </div>

        {/* Add Event Form */}
        <div className="bg-gradient-to-br from-[#241231] to-[#1a0d28] border border-purple-500/20 rounded-xl p-4 sm:p-6 md:p-8 shadow-lg">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-100 mb-4 sm:mb-6">Add New Event</h3>
          <form onSubmit={addEvent} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-300">Event Title</label>
                <input
                  type="text"
                  placeholder="Enter event title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2 sm:p-3 rounded-lg bg-gray-800/50 border border-gray-600 text-sm sm:text-base text-gray-100 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors duration-200"
                  required
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-300">Date & Time</label>
                <input
                  type="text"
                  placeholder="e.g. Fri, Apr 12 • 7:00 PM"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full p-2 sm:p-3 rounded-lg bg-gray-800/50 border border-gray-600 text-sm sm:text-base text-gray-100 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors duration-200"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-300">Venue</label>
              <input
                type="text"
                placeholder="Enter venue location"
                value={form.venue}
                onChange={e => setForm({ ...form, venue: e.target.value })}
                className="w-full p-2 sm:p-3 rounded-lg bg-gray-800/50 border border-gray-600 text-sm sm:text-base text-gray-100 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors duration-200"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-300">Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  onChange={e => setForm({ ...form, image: e.target.value })}
                  className="w-full p-2 sm:p-3 rounded-lg bg-gray-800/50 border border-gray-600 text-sm sm:text-base text-gray-100 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors duration-200"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-300">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImageFile(e.target.files[0])}
                  className="w-full p-2 sm:p-3 rounded-lg bg-gray-800/50 border border-gray-600 text-sm sm:text-base text-gray-100 file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer"
                />
              </div>
            </div>
            
            <div className="pt-2 sm:pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Event...
                  </span>
                ) : (
                  "Add Event"
                )}
              </button>
            </div>
            
            {successMsg && (
              <div className="p-3 sm:p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-400 font-medium text-xs sm:text-sm">{successMsg}</span>
                </div>
              </div>
            )}
            {errorMsg && (
              <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-400 font-medium text-xs sm:text-sm">{errorMsg}</span>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Events List */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-100">Upcoming Events</h3>
          {events.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-base sm:text-lg">No events scheduled</p>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">Create your first event using the form above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {events.map(ev => (
                <div key={ev.id} className="bg-gradient-to-br from-[#241231] to-[#1a0d28] border border-purple-500/20 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                  <div className="p-4 sm:p-6">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex-shrink-0">
                        <img 
                          src={ev.image} 
                          alt={ev.title} 
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg shadow-md border border-purple-500/30" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base sm:text-lg text-gray-100 mb-1 sm:mb-2 truncate">{ev.title}</h4>
                        <div className="space-y-1 mb-2 sm:mb-3">
                          <div className="flex items-center gap-2 text-cyan-300 text-xs sm:text-sm">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="truncate">{ev.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{ev.venue}</span>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => showDeleteConfirmation(ev, "event")}
                            className="text-red-400 hover:text-red-300 text-xs sm:text-sm font-medium hover:bg-red-500/10 px-2 sm:px-3 py-1 rounded-md transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-[#2a1b3d] via-[#1e1332] to-[#0f0f23] rounded-3xl border border-purple-500/40 shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 animate-in zoom-in-95">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
            </div>
            
            {/* Header */}
            <div className="relative px-6 py-6 border-b border-purple-500/30">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500/30 to-red-600/20 rounded-full flex items-center justify-center border border-red-500/40 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-transparent rounded-full animate-ping"></div>
                    <svg className="w-7 h-7 text-red-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Delete {deleteType === "magazine" ? "Magazine" : "Event"}</h3>
                  <p className="text-gray-400 text-sm">This action is permanent</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="relative px-6 py-6">
              <div className="mb-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 text-yellow-400 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/30 mb-4">
                    <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="font-medium text-sm">Warning: Irreversible Action</span>
                  </div>
                </div>
                
                <p className="text-gray-300 text-center mb-4 leading-relaxed">
                  You're about to permanently delete this{" "}
                  <span className="font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                    {deleteType === "magazine" ? "magazine" : "event"}
                  </span>
                </p>
                
                <div className="bg-gradient-to-r from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm mb-4">
                  <div className="flex items-center gap-3">
                    {deleteType === "magazine" && deleteTarget?.cover && (
                      <img 
                        src={deleteTarget.cover} 
                        alt={deleteTarget.title}
                        className="w-12 h-16 object-cover rounded-lg border border-purple-500/30 shadow-md"
                      />
                    )}
                    {deleteType === "event" && deleteTarget?.image && (
                      <img 
                        src={deleteTarget.image} 
                        alt={deleteTarget.title}
                        className="w-12 h-12 object-cover rounded-lg border border-purple-500/30 shadow-md"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-white font-semibold text-lg truncate">"{deleteTarget?.title}"</p>
                      {deleteType === "magazine" && deleteTarget?.subtitle && (
                        <p className="text-gray-400 text-sm truncate">{deleteTarget.subtitle}</p>
                      )}
                      {deleteType === "event" && deleteTarget?.venue && (
                        <p className="text-gray-400 text-sm truncate">{deleteTarget.venue}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/30">
                  <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="font-medium">Once deleted, this cannot be recovered</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-6 py-3 text-gray-300 bg-gray-800/60 border border-gray-600/50 rounded-xl hover:bg-gray-700/60 font-semibold transition-all duration-300 hover:border-gray-500 hover:shadow-lg transform hover:scale-105 backdrop-blur-sm"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </span>
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white rounded-xl hover:from-red-700 hover:via-red-600 hover:to-red-800 font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:shadow-red-500/25"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Forever
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-6 rounded-xl shadow-2xl border border-green-500/30 min-w-[350px] max-w-md transform transition-all duration-500 ease-out bounce-in">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-7 h-7 text-green-200 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 animate-in slide-in-from-left-2 duration-700">
                <p className="font-semibold text-green-50 text-lg animate-in slide-in-from-bottom-1 duration-500">Success!</p>
                <p className="text-green-100 mt-1 animate-in slide-in-from-bottom-2 duration-700">{successMessage}</p>
              </div>
              <button
                onClick={() => setShowSuccessToast(false)}
                className="flex-shrink-0 text-green-200 hover:text-white transition-all duration-300 ml-2 hover:scale-110 hover:rotate-90 animate-in fade-in"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress bar animation */}
            <div className="mt-4 w-full bg-green-800/30 rounded-full h-1 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-300 rounded-full animate-pulse"
                style={{
                  animation: 'progress 3s linear forwards'
                }}>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0.3) rotate(-15deg); opacity: 0; }
          50% { transform: scale(1.05) rotate(5deg); }
          70% { transform: scale(0.9) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        .bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
};

export default LibraryTab;