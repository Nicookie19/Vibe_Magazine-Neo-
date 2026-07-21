// src/pages/AdminDashboard/FeedbackTab.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const FeedbackTab = () => {
  const [comments, setComments] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState([]);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const { data, error } = await supabase
          .from("feedback")
          .select("*")
          .order("submitted_at", { ascending: false });
        
        if (error) throw error;
        
        setComments(data || []);
      } catch (err) {
        console.error("Failed to load feedback:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeedback();

    // Setup real-time subscription for feedback
    const subscription = supabase
      .channel("feedback-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedback" },
        (payload) => {
          if (payload.event === "INSERT") {
            setComments((prevComments) => [payload.new, ...prevComments]);
          } else if (payload.event === "DELETE") {
            setComments((prevComments) =>
              prevComments.filter((comment) => comment.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show delete confirmation modal
  const showDeleteConfirmation = (feedback) => {
    setDeleteTarget(feedback);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setProcessingIds((ids) => [...ids, deleteTarget.id]);
    
    try {
      const { error } = await supabase.from("feedback").delete().eq("id", deleteTarget.id);
      if (error) {
        console.error("Supabase delete error:", error);
        throw error;
      }
      
      // Optimistically remove from UI in case real-time is delayed
      setComments((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } catch (err) {
      console.error("Delete exception:", err);
    } finally {
      setProcessingIds((ids) => ids.filter((pid) => pid !== deleteTarget.id));
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <section className="space-y-4">
        <div className="border-b border-gray-700 pb-4">
          <h2 className="text-3xl font-bold text-gray-100 tracking-tight">Student Feedback</h2>
          <p className="text-gray-400 mt-2">View and manage feedback submissions from students</p>
        </div>
        
        <div className="text-sm text-gray-400">
          Total: {comments.length} feedback submission{comments.length !== 1 ? 's' : ''}
        </div>
      </section>

      {/* Feedback List */}
      <section className="bg-gradient-to-br from-[#241231] to-[#1a0d28] border border-purple-500/20 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          {comments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-gray-300 text-xl font-semibold mb-2">No feedback received</h3>
              <p className="text-gray-500 text-sm">Student feedback and suggestions will appear here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-gray-600/50 bg-gray-800/30 hover:border-purple-500/50 hover:bg-gray-800/50 transition-all duration-200 overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-600/30 bg-gray-800/20">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wide">Name</label>
                            <p className="text-gray-100 font-medium">
                              {c.name || "Anonymous Student"}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wide">Email</label>
                            <p className="text-gray-300 text-sm">
                              {c.email || "Not provided"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wide">Subject</label>
                          <p className="text-gray-100 font-medium">
                            {c.subject || "General Feedback"}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {c.submitted_at ? new Date(c.submitted_at).toLocaleDateString() : 'Unknown date'} at {c.submitted_at ? new Date(c.submitted_at).toLocaleTimeString() : ''}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => showDeleteConfirmation(c)}
                        disabled={processingIds.includes(c.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:shadow-lg flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete this feedback permanently"
                      >
                        {processingIds.includes(c.id) ? (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                        {processingIds.includes(c.id) ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Message Content */}
                  <div className="px-6 py-4">
                    <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Message</label>
                    <div className="bg-gray-800/50 border-l-4 border-purple-500 rounded-r-lg p-4">
                      <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {c.message || "No message content"}
                      </p>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-gray-600/30">
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>ID: {c.id}</span>
                        <span className="text-gray-400">
                          Submitted {c.submitted_at ? new Date(c.submitted_at).toLocaleDateString() : 'Unknown date'} at {c.submitted_at ? new Date(c.submitted_at).toLocaleTimeString() : ''}
                        </span>
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#241231] via-[#1b0b28] to-[#0f0f23] rounded-2xl border border-purple-500/30 shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-100">Confirm Deletion</h3>
              </div>
            </div>
            
            {/* Content */}
            <div className="px-6 py-6">
              <div className="mb-6">
                <p className="text-gray-300 mb-3">
                  Are you sure you want to delete this{" "}
                  <span className="font-semibold text-purple-300">feedback</span>?
                </p>
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">From:</span>
                    <span className="text-gray-100 font-medium">{deleteTarget?.name || "Anonymous Student"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Subject:</span>
                    <span className="text-gray-100">{deleteTarget?.subject || "General Feedback"}</span>
                  </div>
                  {deleteTarget?.message && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      <span className="text-gray-400 text-xs">Message:</span>
                      <p className="text-gray-200 text-sm mt-1 line-clamp-3">
                        "{deleteTarget.message.substring(0, 100)}{deleteTarget.message.length > 100 ? '...' : ''}"
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  This action cannot be undone
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-3 text-gray-300 bg-gray-800/50 border border-gray-600 rounded-lg hover:bg-gray-700/50 font-medium transition-all duration-200 hover:border-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteTarget && processingIds.includes(deleteTarget.id)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteTarget && processingIds.includes(deleteTarget.id) ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackTab;