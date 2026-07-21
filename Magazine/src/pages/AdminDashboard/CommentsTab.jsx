// src/pages/AdminDashboard/CommentsTab.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

const CommentsTab = () => {
    const [comments, setComments] = useState([]);
    const [magazines, setMagazines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMagazine, setSelectedMagazine] = useState(() => {
        const saved = localStorage.getItem('vibe-admin-selected-magazine');
        return saved || "all";
    });
    const [selectedComments, setSelectedComments] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    
    // Success toast state
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    // Read status tracking
    const [readComments, setReadComments] = useState(() => {
        const saved = localStorage.getItem('vibe-admin-read-comments');
        return saved ? JSON.parse(saved) : [];
    });


    useEffect(() => {
        fetchData();

        // Set up real-time subscription for comments
        const channel = supabase
            .channel("comments-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "magazine_comments" },
                () => {
                    console.log("Comments changed, refetching...");
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Save read comments to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('vibe-admin-read-comments', JSON.stringify(readComments));
    }, [readComments]);

    // Save selected magazine filter to localStorage
    useEffect(() => {
        localStorage.setItem('vibe-admin-selected-magazine', selectedMagazine);
    }, [selectedMagazine]);

    // Refresh data when magazine filter changes to get latest comments
    useEffect(() => {
        if (!loading) {
            console.log("Magazine filter changed, refreshing data...");
            fetchData();
        }
    }, [selectedMagazine]);

    // Mark comment as read
    const markAsRead = (commentId) => {
        if (!readComments.includes(commentId)) {
            setReadComments([...readComments, commentId]);
        }
    };

    // Mark comment as unread
    const markAsUnread = (commentId) => {
        setReadComments(readComments.filter(id => id !== commentId));
    };

    // Mark all visible comments as read
    const markAllAsRead = () => {
        const allIds = filteredComments.map(c => c.id);
        setReadComments([...new Set([...readComments, ...allIds])]);
    };

    const fetchData = async () => {
        try {
            console.log("CommentsTab: Fetching data...");

            // Fetch magazines for the filter dropdown
            const { data: magazinesData, error: magazinesError } = await supabase
                .from("magazines")
                .select("id, title")
                .order("created_at", { ascending: false });

            if (magazinesError) {
                console.error("Error fetching magazines:", magazinesError);
                alert("Failed to fetch magazines: " + magazinesError.message);
            }

            // Fetch comments separately and match with magazines manually
            // (avoiding join since foreign key relationship may not be set up)
            const { data: commentsData, error: commentsError } = await supabase
                .from("magazine_comments")
                .select("*")
                .order("created_at", { ascending: false });

            // Add magazine titles manually by matching IDs
            let enrichedCommentsData = commentsData;
            if (commentsData && magazinesData) {
                enrichedCommentsData = commentsData.map(comment => {
                    const magazine = magazinesData.find(mag => mag.id === comment.magazine_id);
                    return {
                        ...comment,
                        magazines: magazine ? { title: magazine.title } : { title: "Unknown Magazine" }
                    };
                });
            }

            if (commentsError) {
                console.error("Error fetching comments:", commentsError);
                alert("Failed to fetch comments: " + commentsError.message);
            }

            // Debug info
            console.log("DEBUG - CommentsTab:");
            console.log("- Magazines found:", magazinesData?.length || 0);
            console.log("- Comments found:", enrichedCommentsData?.length || 0);
            console.log("- Sample comment:", enrichedCommentsData?.[0]);

            setMagazines(magazinesData || []);
            setComments(enrichedCommentsData || []);
        } catch (error) {
            console.error("Error in fetchData:", error);
            alert("Unexpected error in fetchData: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Show delete confirmation modal
    const showDeleteConfirmation = (comment) => {
        setDeleteTarget(comment);
        setShowDeleteModal(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (deleteTarget) {
            try {
                console.log(`Admin deleting comment ID: ${deleteTarget.id}`);

                const { error } = await supabase
                    .from("magazine_comments")
                    .delete()
                    .eq("id", deleteTarget.id);

                if (error) {
                    console.error("Error deleting comment:", error);
                    alert("❌ Failed to delete comment: " + error.message + "\n\nCheck if you have proper permissions.");
                    return;
                }

                // Successfully deleted, update local state immediately
                setComments(prevComments => prevComments.filter(c => c.id !== deleteTarget.id));
                
                // Show success toast
                setSuccessMessage("Comment deleted successfully!");
                setShowSuccessToast(true);

                // Auto-hide toast after 3 seconds
                setTimeout(() => {
                    setShowSuccessToast(false);
                }, 3000);

                // Optional: Refresh data to ensure sync
                setTimeout(() => fetchData(), 500);

            } catch (error) {
                console.error("Error deleting comment:", error);
                alert("❌ Unexpected error occurred: " + error.message);
            }
        }
        setShowDeleteModal(false);
        setDeleteTarget(null);
    };

    // Handle delete cancel
    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setDeleteTarget(null);
    };

    // Handle bulk delete confirmation
    const handleBulkDeleteConfirm = async () => {
        try {
            const { error } = await supabase
                .from('magazine_comments')
                .delete()
                .in('id', selectedComments);

            if (error) {
                alert('❌ Failed to delete selected comments: ' + error.message);
            } else {
                setSelectedComments([]);
                
                // Show success toast
                setSuccessMessage(`${selectedComments.length} comment${selectedComments.length !== 1 ? 's' : ''} deleted successfully!`);
                setShowSuccessToast(true);

                // Auto-hide toast after 3 seconds
                setTimeout(() => {
                    setShowSuccessToast(false);
                }, 3000);
                
                fetchData();
            }
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
        setShowBulkDeleteModal(false);
    };

    // Handle bulk delete cancel
    const handleBulkDeleteCancel = () => {
        setShowBulkDeleteModal(false);
    };

    const filteredComments = selectedMagazine === "all"
        ? comments
        : comments.filter(c => String(c.magazine_id) === String(selectedMagazine));

    // Count unread comments
    const unreadCount = filteredComments.filter(c => !readComments.includes(c.id)).length;

    if (loading) {
        return (
            <div className="text-white text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="mt-4">Loading comments...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header Section */}
            <section className="space-y-4">
                <div className="border-b border-gray-700 pb-4">
                    <h2 className="text-3xl font-bold text-gray-100 tracking-tight">Comments Management</h2>
                    <p className="text-gray-400 mt-2">Moderate and manage user feedback across all magazines</p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-gray-300 text-sm font-medium">Filter by Magazine:</label>
                        <select
                            value={selectedMagazine}
                            onChange={(e) => {
                                e.preventDefault();
                                setSelectedMagazine(e.target.value);
                                console.log("Filter changed to:", e.target.value);
                            }}
                            className="bg-gray-800/50 border border-gray-600 text-gray-100 px-4 py-2 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors duration-200"
                        >
                            <option value="all">All Magazines</option>
                            {magazines.map(mag => (
                                <option key={mag.id} value={mag.id}>
                                    {mag.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-400">
                            Total: {filteredComments.length} comment{filteredComments.length !== 1 ? 's' : ''}
                            {unreadCount > 0 && (
                                <span className="ml-2 inline-flex items-center gap-1">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                    <span className="text-blue-400 font-semibold">{unreadCount} unread</span>
                                </span>
                            )}
                        </div>
                        
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors duration-200 font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Mark All as Read
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Comments List */}
            <section className="bg-gradient-to-br from-[#241231] to-[#1a0d28] border border-purple-500/20 rounded-xl shadow-lg overflow-hidden">
                {/* Header Bar */}
                {filteredComments.length > 0 && (
                    <div className="bg-gray-800/30 px-6 py-4 border-b border-purple-500/20">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <h3 className="text-gray-100 font-semibold text-lg">
                                    {filteredComments.length} Comment{filteredComments.length !== 1 ? 's' : ''}
                                </h3>
                                {selectedMagazine !== "all" && (
                                    <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                        {magazines.find(m => String(m.id) === String(selectedMagazine))?.title || 'Filtered'}
                                    </span>
                                )}
                            </div>

                            {/* Bulk Selection Controls */}
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer hover:text-white transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selectedComments.length === filteredComments.length && filteredComments.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedComments(filteredComments.map(c => c.id));
                                            } else {
                                                setSelectedComments([]);
                                            }
                                        }}
                                        className="w-4 h-4 text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500 focus:ring-2"
                                    />
                                    Select All
                                </label>

                                {selectedComments.length > 0 && (
                                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                        {selectedComments.length} selected
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-6">
                    {/* Bulk Action Bar - Shows when comments are selected */}
                    {selectedComments.length > 0 && (
                        <div className="mb-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30 rounded-xl p-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <div className="text-gray-100">
                                    <span className="font-semibold text-blue-300">{selectedComments.length}</span> comment{selectedComments.length !== 1 ? 's' : ''} selected
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelectedComments([])}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors duration-200"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Clear Selection
                                    </button>

                                    <button
                                        onClick={() => setShowBulkDeleteModal(true)}
                                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete Selected ({selectedComments.length})
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {filteredComments.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-700 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="text-gray-300 text-xl font-semibold mb-2">No comments found</h3>
                            <p className="text-gray-500 text-sm">Comments from magazine readers will appear here for moderation</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredComments.map((comment) => {
                                const isRead = readComments.includes(comment.id);
                                
                                return (
                                <div
                                    key={comment.id}
                                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${selectedComments.includes(comment.id)
                                        ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/10'
                                        : isRead
                                            ? 'border-gray-600/50 bg-gray-800/30 hover:border-purple-500/50 hover:bg-gray-800/50'
                                            : 'border-blue-400/50 bg-blue-900/10 hover:border-blue-500/70 hover:bg-blue-900/20 shadow-md shadow-blue-500/5'
                                        }`}
                                >
                                    {/* Header */}
                                    <div className="px-6 py-4 border-b border-gray-600/30 bg-gray-800/20">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-4">
                                                {/* Read/Unread Indicator */}
                                                <div className="relative mt-1 flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedComments.includes(comment.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedComments([...selectedComments, comment.id]);
                                                            } else {
                                                                setSelectedComments(selectedComments.filter(id => id !== comment.id));
                                                            }
                                                        }}
                                                        className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-500 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                                                    />
                                                    
                                                    {/* Read Status Badge */}
                                                    <button
                                                        onClick={() => isRead ? markAsUnread(comment.id) : markAsRead(comment.id)}
                                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                                                            isRead 
                                                                ? 'bg-gray-700/50 text-gray-400 border border-gray-600/50 hover:bg-gray-700 hover:text-gray-300' 
                                                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/50 hover:bg-blue-500/30 animate-pulse'
                                                        }`}
                                                        title={isRead ? "Mark as unread" : "Mark as read"}
                                                    >
                                                        {isRead ? (
                                                            <>
                                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                                                </svg>
                                                                Read
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                                                                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                                                                </svg>
                                                                New
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-xs text-gray-400 uppercase tracking-wide">User</label>
                                                            <p className="text-gray-100 font-medium">
                                                                {comment.user_name || "Anonymous User"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-400 uppercase tracking-wide">User ID</label>
                                                            <p className="text-gray-300 text-sm font-mono">
                                                                {comment.user_id || "Unknown"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-400 uppercase tracking-wide">Magazine</label>
                                                        <p className="text-gray-100 font-medium">
                                                            {comment.magazines?.title || "Unknown Magazine"}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                            </svg>
                                                            {comment.magazines?.title || "Unknown Magazine"}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => showDeleteConfirmation(comment)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:shadow-lg flex items-center gap-2 font-medium"
                                                title="Delete this comment permanently"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Message Content */}
                                    <div className="px-6 py-4">
                                        <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Message</label>
                                        <div className="bg-gray-800/50 border-l-4 border-purple-500 rounded-r-lg p-4">
                                            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                                                {comment.text || "No comment content"}
                                            </p>
                                        </div>

                                        {/* Additional Info */}
                                        <div className="mt-4 pt-4 border-t border-gray-600/30">
                                            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                                <span>ID: {comment.id}</span>
                                                {comment.user_id && <span>User ID: {comment.user_id}</span>}
                                                <span className="text-gray-400">
                                                    Submitted {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )})}
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
                                    <h3 className="text-2xl font-bold text-white mb-1">Delete Comment</h3>
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
                                        comment
                                    </span>
                                </p>
                                
                                <div className="bg-gradient-to-r from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm mb-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">From:</span>
                                            <span className="text-white font-semibold">{deleteTarget?.user_name || "Anonymous User"}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Magazine:</span>
                                            <span className="text-gray-300">{deleteTarget?.magazines?.title || "Unknown Magazine"}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Posted:</span>
                                            <span className="text-gray-300">{deleteTarget?.created_at ? new Date(deleteTarget.created_at).toLocaleDateString() : "Unknown date"}</span>
                                        </div>
                                        {deleteTarget?.text && (
                                            <div className="mt-2 pt-2 border-t border-gray-600/50">
                                                <span className="text-gray-400 text-xs mb-1 block">Comment:</span>
                                                <p className="text-gray-200 text-sm italic">
                                                    "{deleteTarget.text.substring(0, 100)}{deleteTarget.text.length > 100 ? '...' : ''}"
                                                </p>
                                            </div>
                                        )}
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

            {/* Bulk Delete Confirmation Modal */}
            {showBulkDeleteModal && (
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
                                    <h3 className="text-2xl font-bold text-white mb-1">Bulk Delete Comments</h3>
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
                                    You're about to permanently delete{" "}
                                    <span className="font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                                        {selectedComments.length} comment{selectedComments.length !== 1 ? 's' : ''}
                                    </span>
                                </p>
                                
                                <div className="bg-gradient-to-r from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm mb-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Selected:</span>
                                            <span className="text-white font-semibold">{selectedComments.length} comment{selectedComments.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Action:</span>
                                            <span className="text-red-300 font-medium">Bulk Delete</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Target:</span>
                                            <span className="text-gray-300">Multiple Comments</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/30">
                                    <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span className="font-medium">Once deleted, these cannot be recovered</span>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={handleBulkDeleteCancel}
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
                                    onClick={handleBulkDeleteConfirm}
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

export default CommentsTab;
