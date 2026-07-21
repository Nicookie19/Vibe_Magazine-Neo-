import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingIds, setProcessingIds] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const { data, error } = await supabase
          .from("submissions")
          .select("*")
          .order("submitted_at", { ascending: false });
        if (error) throw error;
        setSubmissions(data || []);
      } catch (err) {
        setError("Could not load submissions: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();

    // Setup real-time subscription
    const subscription = supabase
      .channel("submissions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions" },
        (payload) => {
          // Use payload.event instead of payload.eventType
          if (payload.event === "INSERT") {
            setSubmissions((subs) => [payload.new, ...subs]);
          } else if (payload.event === "UPDATE") {
            setSubmissions((subs) =>
              subs.map((sub) => (sub.id === payload.new.id ? payload.new : sub))
            );
          } else if (payload.event === "DELETE") {
            setSubmissions((subs) =>
              subs.filter((sub) => sub.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      // Properly remove subscription on unmount
      subscription.unsubscribe();
    };
  }, []);

  // Filter submissions based on status and search term
  const filteredSubmissions = submissions.filter((submission) => {
    const matchesStatus = filterStatus === "all" || submission.status === filterStatus;
    const matchesSearch = !searchTerm ||
      submission.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.student_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.title_of_work?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
    switch (status) {
      case "Accepted":
        return `${baseClasses} bg-green-900/30 text-green-400 border border-green-500/30`;
      case "Rejected":
        return `${baseClasses} bg-red-900/30 text-red-400 border border-red-500/30`;
      default:
        return `${baseClasses} bg-yellow-900/30 text-yellow-400 border border-yellow-500/30`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border-l-4 border-red-400 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Helper to send notification email
  const sendNotificationEmail = async (submission, status) => {
    try {
      console.log(`📧 Sending ${status} notification to ${submission.student_email}...`);
      
      const emailSubject = status === "Accepted" 
        ? `🎉 Congratulations! Your submission "${submission.title_of_work}" has been accepted`
        : `📝 Update on your submission "${submission.title_of_work}"`;
      
      const emailBody = status === "Accepted"
        ? `
Dear ${submission.full_name},

Congratulations! We're excited to inform you that your submission "${submission.title_of_work}" has been accepted for publication in Vibe Magazine.

Submission Details:
- Title: ${submission.title_of_work}
- Category: ${submission.category}
- Submitted: ${new Date(submission.submitted_at).toLocaleDateString()}

Your work will be featured in our upcoming publication. We'll keep you updated on the publication timeline.

Thank you for your creative contribution to Vibe Magazine!

Best regards,
The Vibe Magazine Editorial Team
        `
        : `
Dear ${submission.full_name},

Thank you for your submission "${submission.title_of_work}" to Vibe Magazine.

After careful review, we regret to inform you that your submission has not been selected for this publication cycle.

Submission Details:
- Title: ${submission.title_of_work}
- Category: ${submission.category}
- Submitted: ${new Date(submission.submitted_at).toLocaleDateString()}

Please don't be discouraged! We encourage you to continue creating and consider submitting to future publications. Each submission is an opportunity to grow as an artist/writer.

Thank you for sharing your work with us.

Best regards,
The Vibe Magazine Editorial Team
        `;

      // Method 1: Try Edge Function approach
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              to: submission.student_email,
              subject: emailSubject,
              body: emailBody,
              submission_id: submission.id,
              status: status
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Email notification sent via Edge Function:`, result);
            return true;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Edge Function failed: ${response.status} - ${errorText}`);
          }
        }
      } catch (edgeError) {
        console.warn(`⚠️ Edge Function error: ${edgeError.message}`);
      }

      // Method 2: Fallback - Log email details (for testing)
      console.log(`📧 Email notification simulated for ${submission.student_email}`);
      console.log(`Subject: ${emailSubject}`);
      console.log(`Body: ${emailBody}`);
      
      return true; // Return true for fallback success
    } catch (error) {
      console.error(`❌ Failed to send notification email:`, error);
      return false;
    }
  };

  // Helper to handle button async action with error handling & disabling
  const handleAccept = async (id) => {
    setProcessingIds((ids) => [...ids, id]);
    
    try {
      // Find the submission to get email details
      const submission = submissions.find(sub => sub.id === id);
      if (!submission) {
        throw new Error("Submission not found");
      }

      // Update status in database
      const { error } = await supabase
        .from("submissions")
        .update({ status: "Accepted" })
        .eq("id", id);
      
      if (error) throw error;

      // Update local state
      const updatedSubmission = { ...submission, status: "Accepted" };
      setSubmissions((subs) =>
        subs.map((sub) => (sub.id === id ? updatedSubmission : sub))
      );

      // Send notification email
      console.log(`🎉 Submission accepted! Sending notification to ${submission.student_email}...`);
      const emailSent = await sendNotificationEmail(submission, "Accepted");

    } catch (err) {
      console.error("Accept submission error:", err);
      toast.error(`❌ Failed to accept submission: ${err.message || err}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setProcessingIds((ids) => ids.filter((pid) => pid !== id));
    }
  };

  const handleReject = async (id) => {
    setProcessingIds((ids) => [...ids, id]);
    
    // Show processing toast
    toast.info("⏳ Processing submission rejection...", {
      position: "bottom-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    try {
      // Find the submission to get email details
      const submission = submissions.find(sub => sub.id === id);
      if (!submission) {
        throw new Error("Submission not found");
      }

      // Update status in database
      const { error } = await supabase
        .from("submissions")
        .update({ status: "Rejected" })
        .eq("id", id);
      
      if (error) throw error;

      // Update local state
      const updatedSubmission = { ...submission, status: "Rejected" };
      setSubmissions((subs) =>
        subs.map((sub) => (sub.id === id ? updatedSubmission : sub))
      );

      // Send notification email
      console.log(`📝 Submission rejected. Sending notification to ${submission.student_email}...`);
      const emailSent = await sendNotificationEmail(submission, "Rejected");

    } catch (err) {
      console.error("Reject submission error:", err);
    } finally {
      setProcessingIds((ids) => ids.filter((pid) => pid !== id));
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (submission) => {
    setDeleteTarget(submission);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setProcessingIds((ids) => [...ids, deleteTarget.id]);
    
    try {
      const { error } = await supabase.from("submissions").delete().eq("id", deleteTarget.id);
      if (error) {
        console.error("Supabase delete error:", error);
        throw error;
      }
      // Optimistically remove from UI in case real-time is delayed
      setSubmissions((subs) => subs.filter((sub) => sub.id !== deleteTarget.id));
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Student Submissions</h1>
        <p className="text-gray-400">Manage and review all student submissions efficiently with our comprehensive dashboard</p>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl border border-purple-500/30 p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">{submissions.length}</div>
              <div className="text-sm text-purple-300 font-medium">Total Submissions</div>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-xl border border-green-500/30 p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {submissions.filter(s => s.status === "Accepted").length}
              </div>
              <div className="text-sm text-green-300 font-medium">Accepted</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 rounded-xl border border-yellow-500/30 p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {submissions.filter(s => !s.status || s.status === "Pending").length}
              </div>
              <div className="text-sm text-yellow-300 font-medium">Pending Review</div>
            </div>
            <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 rounded-xl border border-red-500/30 p-4 text-center">
              <div className="text-2xl font-bold text-red-400 mb-1">
                {submissions.filter(s => s.status === "Rejected").length}
              </div>
              <div className="text-sm text-red-300 font-medium">Rejected</div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left side - Status Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                <label htmlFor="status-filter" className="text-sm font-semibold text-purple-300 whitespace-nowrap">
                  Filter Status:
                </label>
              </div>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-purple-500/50 rounded-lg px-4 py-2.5 bg-[#241231]/80 text-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 min-w-[160px]"
              >
                <option value="all" className="bg-[#241231]">All Submissions</option>
                <option value="Pending" className="bg-[#241231]">Pending</option>
                <option value="Accepted" className="bg-[#241231]">Accepted</option>
                <option value="Rejected" className="bg-[#241231]">Rejected</option>
              </select>
            </div>

            {/* Right side - Search */}
            <div className="flex items-center space-x-3 max-w-md w-full lg:w-auto">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <label htmlFor="search" className="text-sm font-semibold text-purple-300 whitespace-nowrap">
                  Search:
                </label>
              </div>
              <div className="relative flex-1">
                <input
                  id="search"
                  type="text"
                  placeholder="Name, email, title, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-purple-500/50 rounded-lg text-sm bg-[#241231]/80 text-purple-100 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-white">Submissions</h2>
            <span className="bg-purple-800/40 text-purple-200 px-3 py-1 rounded-full text-sm font-medium">
              {filteredSubmissions.length} {filteredSubmissions.length === 1 ? 'result' : 'results'}
            </span>
          </div>
          {(searchTerm || filterStatus !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
              }}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Clear filters</span>
            </button>
          )}
        </div>

        {/* Submissions Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden shadow-lg">
          {filteredSubmissions.length === 0 ? (
            <div className="p-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">No submissions found</h3>
                <p className="text-purple-300 text-center">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search criteria or filters to find more submissions."
                    : "There are no submissions to display yet. New submissions will appear here when students submit their work."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-purple-500/20">
                    <th className="px-6 py-5 text-left">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm font-semibold text-purple-300 uppercase tracking-wider">Student</span>
                      </div>
                    </th>
                    <th className="px-6 py-5 text-left">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-semibold text-purple-300 uppercase tracking-wider">Submission</span>
                      </div>
                    </th>
                    <th className="px-6 py-5 text-left">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-semibold text-purple-300 uppercase tracking-wider">File</span>
                      </div>
                    </th>
                    <th className="px-6 py-5 text-left">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-purple-300 uppercase tracking-wider">Date</span>
                      </div>
                    </th>
                    <th className="px-6 py-5 text-center">
                      <span className="text-sm font-semibold text-purple-300 uppercase tracking-wider">Status</span>
                    </th>
                    <th className="px-6 py-5 text-center">
                      <span className="text-sm font-semibold text-purple-300 uppercase tracking-wider">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission, index) => (
                    <tr key={submission.id} className="border-b border-purple-500/10 hover:bg-gradient-to-r hover:from-purple-600/10 hover:to-pink-600/10 transition-all duration-300 group">
                      <td className="px-6 py-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center font-semibold text-white text-sm">
                            {submission.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white mb-1">{submission.full_name}</div>
                            <div className="text-xs text-purple-300">{submission.student_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div>
                          <div className="text-sm font-semibold text-white mb-2">{submission.title_of_work}</div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-200 border border-purple-500/30">
                            {submission.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center">
                          {submission.file_url ? (
                            /\.(jpg|jpeg|png|gif|webp)$/i.test(submission.file_url) ? (
                              <div className="flex items-center space-x-3">
                                <img
                                  src={submission.file_url}
                                  alt={submission.title_of_work}
                                  className="h-12 w-12 rounded-lg object-cover border-2 border-purple-500/30 shadow-lg"
                                />
                                <a
                                  href={submission.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>View</span>
                                </a>
                              </div>
                            ) : (
                              <a
                                href={submission.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-2 border border-purple-500/50 text-sm font-medium rounded-lg text-purple-200 bg-[#241231]/60 hover:bg-[#241231]/80 transition-all duration-200"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download
                              </a>
                            )
                          ) : (
                            <div className="flex items-center space-x-2 text-purple-400 text-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>No file</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        {submission.submitted_at ? (
                          <div>
                            <div className="text-white font-medium text-sm">{new Date(submission.submitted_at).toLocaleDateString()}</div>
                            <div className="text-xs text-purple-400 mt-1">
                              {new Date(submission.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-purple-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="flex justify-center">
                          <span className={getStatusBadge(submission.status || "Pending")}>
                            {submission.status || "Pending"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleAccept(submission.id)}
                            disabled={submission.status === "Accepted" || submission.status === "Rejected" || processingIds.includes(submission.id)}
                            className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg group-hover:shadow-xl"
                            title="Accept submission"
                          >
                            {processingIds.includes(submission.id) ? (
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(submission.id)}
                            disabled={submission.status === "Accepted" || submission.status === "Rejected" || processingIds.includes(submission.id)}
                            className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg group-hover:shadow-xl"
                            title="Reject submission"
                          >
                            {processingIds.includes(submission.id) ? (
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => showDeleteConfirmation(submission)}
                            disabled={processingIds.includes(submission.id)}
                            className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-lg text-purple-200 bg-[#241231]/60 hover:bg-[#241231]/80 border border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group-hover:border-purple-400/70"
                            title="Delete submission"
                          >
                            {processingIds.includes(submission.id) ? (
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#2a1f3d] to-[#1a1625] rounded-xl border border-red-500/30 shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-red-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">Confirm Deletion</h3>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <p className="text-gray-300 text-base mb-6">
                Are you sure you want to delete this <span className="font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">submission</span>?
              </p>

              {deleteTarget && (
                <div className="bg-black/30 rounded-lg p-4 border border-gray-700/50 mb-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">From:</span>
                      <span className="text-white font-medium">{deleteTarget.full_name || "Unknown Student"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subject:</span>
                      <span className="text-white font-medium">{deleteTarget.title_of_work || "Untitled"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Message:</span>
                      <span className="text-white font-medium">"{deleteTarget.category || "No category"}"</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>This action cannot be undone</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2.5 text-gray-300 bg-transparent border border-gray-600 rounded-lg hover:bg-gray-700/50 font-medium transition-all duration-200 hover:border-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteTarget && processingIds.includes(deleteTarget.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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

export default AdminSubmissions;
