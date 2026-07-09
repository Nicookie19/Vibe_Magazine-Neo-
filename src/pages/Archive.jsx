// src/pages/Archive.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageFlip from "react-pageflip";
import { supabase } from "../supabaseClient";
import "../styles/magazineFlipbook.css";
import "../styles/magazineFlipbook-desktop.css";
import "../styles/magazineFlipbook-mobile.css";
import "../styles/magazineFlipbook-mobile-fullscreen.css";

const Archive = () => {
  const [magazines, setMagazines] = useState([]);
  const [selectedMag, setSelectedMag] = useState(null);
  const [magazineRatings, setMagazineRatings] = useState({});
  const navigate = useNavigate();

  // Fetch magazines from Supabase (only published ones)
  const fetchMagazines = async () => {
    const { data, error } = await supabase
      .from("magazines")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching magazines:", error);
    } else {
      setMagazines(data || []);
      // Fetch ratings for all magazines
      fetchMagazineRatings(data || []);
    }
  };

  // Fetch average ratings for all magazines
  const fetchMagazineRatings = async (mags) => {
    const ratings = {};
    
    for (const mag of mags) {
      const { data, error } = await supabase
        .from("magazine_ratings")
        .select("rating")
        .eq("magazine_id", mag.id);

      if (!error && data && data.length > 0) {
        const total = data.reduce((sum, item) => sum + item.rating, 0);
        const average = total / data.length;
        ratings[mag.id] = {
          average: average,
          count: data.length
        };
      } else {
        ratings[mag.id] = {
          average: 0,
          count: 0
        };
      }
    }
    
    setMagazineRatings(ratings);
  };

  useEffect(() => {
    fetchMagazines();

    // Realtime updates for magazines
    const magazinesChannel = supabase
      .channel("magazines-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "magazines" },
        () => fetchMagazines()
      )
      .subscribe();

    // Realtime updates for ratings
    const ratingsChannel = supabase
      .channel("ratings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "magazine_ratings" },
        () => fetchMagazines() // Refetch everything to update ratings
      )
      .subscribe();

    return () => {
      supabase.removeChannel(magazinesChannel);
      supabase.removeChannel(ratingsChannel);
    };
  }, []); // Empty dependency array - only run on mount

  // Check for magazineId in URL and auto-open that magazine
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const magazineId = params.get('magazineId');
    
    if (magazineId && magazines.length > 0) {
      const magazine = magazines.find(m => m.id === magazineId);
      if (magazine) {
        setSelectedMag(magazine);
        // Clean up URL parameter
        window.history.replaceState({}, '', '/archive');
      }
    }
  }, [magazines]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0c10] via-[#1b0b28] to-[#071030] text-gray-200 pt-20">
      {/* Header */}
      <header className="py-16 text-center px-6">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-gray-100">
          Magazine Archive
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto font-light mb-6">
          Explore student research, projects, and innovation from across campus.
        </p>
        <Link to="/" className="text-purple-300 hover:text-yellow-300 font-medium">
          ← Back to Home
        </Link>
      </header>

      {/* Magazine Grid */}
      <section className="px-6 pb-20">
        <h2 className="text-2xl font-bold text-gray-100 mb-8 text-center">
          All Issues
        </h2>

        {magazines.length === 0 ? (
          <p className="text-center text-gray-400">
            No magazines uploaded yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {magazines.map((mag, index) => {
              const isLatest = index === 0;
              return (
                <article
                  key={mag.id}
                  onClick={() => setSelectedMag(mag)}
                  className="group overflow-hidden rounded-lg shadow-lg transform transition duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer bg-black/20 border border-purple-500/20 relative"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-[#241231]">
                    <img
                      src={mag.cover}
                      alt={mag.title}
                      className="w-full h-full object-cover transform transition duration-700 group-hover:scale-110"
                    />
                    {isLatest && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 via-yellow-500 to-pink-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg animate-pulse z-10 transform -rotate-12">
                        🔥 Latest!
                      </div>
                    )}
                  </div>
                  <div className="p-5 bg-[#241231] bg-opacity-90 border-t border-purple-500/30">
                    <h2 className="text-xl font-bold mb-1 text-gray-100">
                      {mag.title}
                      <p className="text-gray-400 text-sm">By {mag.author}</p>
                    </h2>
                    {mag.subtitle && (
                      <p className="text-gray-300 text-sm mb-2 italic">
                        {mag.subtitle}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">{mag.course}</p>
                    
                    {/* Rating Stars */}
                    {magazineRatings[mag.id] && (
                      <div className="flex items-center gap-2 mt-2 mb-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg 
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.round(magazineRatings[mag.id].average)
                                  ? "text-yellow-400"
                                  : "text-gray-600"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">
                          {magazineRatings[mag.id].average.toFixed(1)} ({magazineRatings[mag.id].count} {magazineRatings[mag.id].count === 1 ? 'rating' : 'ratings'})
                        </span>
                      </div>
                    )}
                    
                    <p className="text-gray-500 text-sm mt-2">
                      {new Date(mag.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal */}
      {selectedMag && (
        <MagazineModal 
          mag={selectedMag} 
          onClose={() => setSelectedMag(null)}
          navigate={navigate}
        />
      )}
    </div>
  );
};

// === MODAL WITH FLIPBOOK, REACTIONS, COMMENTS ===
const MagazineModal = ({ mag, onClose, navigate }) => {
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [loadingImages, setLoadingImages] = useState({});
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pageFlipRef = React.useRef(null);
  const [userId] = useState(() => {
    // Generate or get user ID from localStorage
    let id = localStorage.getItem('magazine_user_id');
    if (!id) {
      id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('magazine_user_id', id);
    }
    return id;
  });

  // Track if user has spent enough time to warrant a rating request
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Enhanced close handler that shows rating popup when appropriate
  const handleModalClose = () => {
    console.log(`User spent ${timeSpent} seconds, hasInteracted: ${hasInteracted}, hasRated: ${hasRated}`);
    
    // Show rating popup if:
    // 1. User hasn't rated this magazine yet
    // 2. User spent at least 3 seconds in the modal
    // 3. User interacted with the magazine OR spent some time reading
    if (!hasRated && (timeSpent >= 3 || hasInteracted)) {
      console.log('Showing rating popup on exit...');
      setShowRatingPopup(true);
    } else {
      console.log('Conditions not met for rating popup, closing immediately...');
      // Close immediately if conditions not met
      onClose();
    }
  };

  // Handle clicking outside the magazine to exit fullscreen mode
  useEffect(() => {
    const handleFullscreenClick = (e) => {
      const flipBook = document.querySelector('.book-fullscreen-mode');
      if (flipBook) {
        // Check if click is outside the magazine flipbook area
        const magazineFlipbook = document.querySelector('.book-fullscreen-mode .magazine-flipbook');
        if (magazineFlipbook && !magazineFlipbook.contains(e.target)) {
          // Exit fullscreen mode and return to normal modal view
          flipBook.classList.remove('book-fullscreen-mode');
          
          console.log('Exited fullscreen - returning to normal modal view');
          
          // Update the flipbook after a short delay to allow CSS transition
          setTimeout(() => {
            if (pageFlipRef.current) {
              try {
                const pageFlip = pageFlipRef.current.pageFlip();
                if (pageFlip && pageFlip.update) {
                  pageFlip.update();
                }
              } catch (error) {
                console.log('PageFlip update error:', error);
              }
            }
          }, 350);
        }
      }
    };

    // Handle ESC key to exit fullscreen
    const handleEscKey = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        const flipBook = document.querySelector('.book-fullscreen-mode');
        if (flipBook) {
          flipBook.classList.remove('book-fullscreen-mode');
          console.log('Exited fullscreen via ESC key');
          setTimeout(() => {
            if (pageFlipRef.current) {
              try {
                const pageFlip = pageFlipRef.current.pageFlip();
                if (pageFlip && pageFlip.update) {
                  pageFlip.update();
                }
              } catch (error) {
                console.log('PageFlip update error:', error);
              }
            }
          }, 350);
        }
      }
    };

    document.addEventListener('click', handleFullscreenClick);
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('click', handleFullscreenClick);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  // Load user's likes, saves, and comments when modal opens
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoadingComments(true);
      
      // Record visit event
      await supabase.from("magazine_analytics").insert([
        { magazine_id: mag.id, event_type: "visit" }
      ]);

      // Check if user has liked this magazine
      const { data: likeData } = await supabase
        .from("magazine_likes")
        .select("*")
        .eq("magazine_id", mag.id)
        .eq("user_id", userId)
        .single();

      if (likeData) {
        setHasLiked(true);
      }

      // Check if user has saved this magazine
      const { data: saveData } = await supabase
        .from("magazine_saves")
        .select("*")
        .eq("magazine_id", mag.id)
        .eq("user_id", userId)
        .single();

      if (saveData) {
        setHasSaved(true);
      }

      // Check if user has already rated this magazine
      const { data: ratingData } = await supabase
        .from("magazine_ratings")
        .select("*")
        .eq("magazine_id", mag.id)
        .eq("user_id", userId)
        .single();

      if (ratingData) {
        setHasRated(true);
        setUserRating(ratingData.rating);
      }

      // Load total likes count
      const { data: likesCount } = await supabase
        .from("magazine_likes")
        .select("*", { count: "exact" })
        .eq("magazine_id", mag.id);

      setLikes(likesCount?.length || 0);

      // Load comments
      const { data: commentsData } = await supabase
        .from("magazine_comments")
        .select("*")
        .eq("magazine_id", mag.id)
        .order("created_at", { ascending: false });

      if (commentsData) {
        setComments(commentsData);
      }
      
      // Comments data loaded
      setIsLoadingComments(false);
    };

    loadUserData();
  }, [mag.id, userId]);

  const handleLike = async () => {
    if (hasLiked) {
      // Unlike: remove from database
      await supabase
        .from("magazine_likes")
        .delete()
        .eq("magazine_id", mag.id)
        .eq("user_id", userId);

      setLikes(likes - 1);
      setHasLiked(false);
    } else {
      // Like: add to database
      await supabase.from("magazine_likes").insert([
        { magazine_id: mag.id, user_id: userId }
      ]);

      // Record like event for analytics
      await supabase.from("magazine_analytics").insert([
        { magazine_id: mag.id, event_type: "like" }
      ]);

      setLikes(likes + 1);
      setHasLiked(true);
    }
  };

  const handleSave = async () => {
    if (hasSaved) {
      // Unsave: remove from database
      await supabase
        .from("magazine_saves")
        .delete()
        .eq("magazine_id", mag.id)
        .eq("user_id", userId);

      setHasSaved(false);
    } else {
      // Save: add to database
      await supabase.from("magazine_saves").insert([
        { magazine_id: mag.id, user_id: userId }
      ]);

      // Record save event for analytics
      await supabase.from("magazine_analytics").insert([
        { magazine_id: mag.id, event_type: "save" }
      ]);

      setHasSaved(true);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newCommentData = {
      magazine_id: mag.id,
      user_id: userId,
      user_name: "Anonymous User", // You can later add user profiles
      text: newComment.trim()
    };

    // Save comment to database
    const { data, error } = await supabase
      .from("magazine_comments")
      .insert([newCommentData])
      .select()
      .single();

    if (!error && data) {
      // Add to local state
      setComments([data, ...comments]);
      setNewComment("");

      // Record comment analytics event
      await supabase.from("magazine_analytics").insert([
        { magazine_id: mag.id, event_type: "comment" }
      ]);
    }
  };

  const handleRating = async (rating) => {
    setUserRating(rating);
    
    // Save rating to database
    const { error } = await supabase
      .from("magazine_ratings")
      .upsert([
        { 
          magazine_id: mag.id, 
          user_id: userId, 
          rating: rating 
        }
      ]);

    if (!error) {
      setHasRated(true);
      setShowRatingPopup(false);
      
      // Record rating analytics event
      await supabase.from("magazine_analytics").insert([
        { magazine_id: mag.id, event_type: "rating", metadata: { rating } }
      ]);

      // Close the modal after rating
      setTimeout(() => {
        onClose();
      }, 1000); // Small delay to show confirmation
    }
  };

  // Handle rating popup dismissal
  const handleRatingDismiss = () => {
    setShowRatingPopup(false);
    onClose(); // Close the modal
  };

  // Track user interaction and time spent
  useEffect(() => {
    const startTime = Date.now();

    // Track any interaction with the modal
    const handleInteraction = () => {
      console.log('User interaction detected!');
      setHasInteracted(true);
    };

    // Add listeners for various interactions
    const magazineElement = document.querySelector('.magazine-flipbook');
    const modalContent = document.querySelector('.bg-\\[\\#241231\\]');
    
    // Track magazine interactions
    if (magazineElement) {
      magazineElement.addEventListener('click', handleInteraction);
      magazineElement.addEventListener('touchstart', handleInteraction);
      magazineElement.addEventListener('mousedown', handleInteraction);
    }

    // Track any clicks in the modal content area
    if (modalContent) {
      modalContent.addEventListener('click', handleInteraction);
    }

    // Also track button clicks (like, save, comment)
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('click', handleInteraction);
    });

    // Set interaction to true after 2 seconds as fallback
    const fallbackTimer = setTimeout(() => {
      console.log('Fallback interaction timer triggered');
      setHasInteracted(true);
    }, 2000);

    // Update time spent every second
    const timeTracker = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeSpent(elapsed);
    }, 1000);

    return () => {
      clearInterval(timeTracker);
      clearTimeout(fallbackTimer);
      if (magazineElement) {
        magazineElement.removeEventListener('click', handleInteraction);
        magazineElement.removeEventListener('touchstart', handleInteraction);
        magazineElement.removeEventListener('mousedown', handleInteraction);
      }
      if (modalContent) {
        modalContent.removeEventListener('click', handleInteraction);
      }
    };
  }, []);

  // Auto-detect when user finishes reading using multiple methods
  useEffect(() => {
    if (hasRated) return; // Don't show popup if already rated

    let lastPageTimer = null;
    let hasReachedEnd = false;

    // Method 1: PageFlip events
    const setupPageFlipDetection = () => {
      const pageFlip = pageFlipRef.current?.pageFlip();
      if (!pageFlip) {
        setTimeout(setupPageFlipDetection, 500);
        return;
      }

      const handlePageFlip = (e) => {
        const totalPages = 1 + (mag.pages?.length || 0);
        const currentPageIndex = e.data;
        setCurrentPage(currentPageIndex);
        
        console.log(`Page flipped to: ${currentPageIndex}, Total pages: ${totalPages}`);
        
        // Clear any existing timer
        if (lastPageTimer) {
          clearTimeout(lastPageTimer);
        }

        // If user reaches the last page
        if (currentPageIndex >= totalPages - 1) {
          console.log('User reached last page, starting timer...');
          hasReachedEnd = true;
          // Show popup after 3 seconds on last page
          lastPageTimer = setTimeout(() => {
            if (!hasRated) {
              console.log('Showing rating popup after timer...');
              setShowRatingPopup(true);
            }
          }, 3000);
        }
      };

      try {
        pageFlip.on('flip', handlePageFlip);
        
        // Also check current page on init
        setTimeout(() => {
          const currentPage = pageFlip.getCurrentPageIndex ? pageFlip.getCurrentPageIndex() : 0;
          const totalPages = 1 + (mag.pages?.length || 0);
          if (currentPage >= totalPages - 1) {
            hasReachedEnd = true;
            lastPageTimer = setTimeout(() => {
              if (!hasRated) {
                setShowRatingPopup(true);
              }
            }, 3000);
          }
        }, 1000);
        
      } catch (error) {
        console.log('PageFlip event listener setup failed:', error);
      }

      return () => {
        try {
          if (pageFlip.off) {
            pageFlip.off('flip', handlePageFlip);
          }
        } catch (error) {
          console.log('PageFlip cleanup failed:', error);
        }
      };
    };

    // Method 2: Click detection on magazine pages
    const handleMagazineClick = () => {
      const totalPages = 1 + (mag.pages?.length || 0);
      
      // If there are few pages or user has been reading for a while
      if (totalPages <= 3) {
        setTimeout(() => {
          if (!hasRated) {
            console.log('Short magazine: showing rating popup after interaction');
            setShowRatingPopup(true);
          }
        }, 5000);
      }
    };

    // Set up page flip detection
    const cleanup = setupPageFlipDetection();
    
    // Add click listener to magazine
    const magazineElement = document.querySelector('.magazine-flipbook');
    if (magazineElement) {
      magazineElement.addEventListener('click', handleMagazineClick);
    }

    return () => {
      if (lastPageTimer) {
        clearTimeout(lastPageTimer);
      }
      if (magazineElement) {
        magazineElement.removeEventListener('click', handleMagazineClick);
      }
      if (cleanup) {
        cleanup();
      }
    };
  }, [mag.pages?.length, hasRated]);

  // Fix first page flip issue - ensure PageFlip is properly initialized
  useEffect(() => {
    if (!isLoadingImages && pageFlipRef.current) {
      const timer = setTimeout(() => {
        try {
          const pageFlip = pageFlipRef.current.pageFlip();
          if (pageFlip) {
            // Update flipbook dimensions without causing a full re-render
            if (pageFlip.update) {
              pageFlip.update();
            }
          }
        } catch (error) {
          console.log('PageFlip init error:', error);
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isLoadingImages]);

  // Handle window resize with debouncing to prevent excessive re-renders
  useEffect(() => {
    let resizeTimer;
    
    const handleResize = () => {
      // Clear any existing timer
      clearTimeout(resizeTimer);
      
      // Debounce the resize event to prevent excessive updates
      resizeTimer = setTimeout(() => {
        if (pageFlipRef.current) {
          try {
            const pageFlip = pageFlipRef.current.pageFlip();
            if (pageFlip && pageFlip.update) {
              // Update the flipbook dimensions without re-rendering
              pageFlip.update();
            }
          } catch (error) {
            console.log('PageFlip update error:', error);
          }
        }
      }, 250); // Wait 250ms after resize stops
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Preload images
  useEffect(() => {
    const totalImages = 1 + (mag.pages?.length || 0); // cover + pages
    let loadedCount = 0;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setIsLoadingImages(false); // Images are ready
      }
    };

    // Preload cover with priority
    const coverImg = new Image();
    coverImg.onload = () => {
      setLoadingImages(prev => ({ ...prev, cover: true }));
      checkAllLoaded();
    };
    coverImg.onerror = () => checkAllLoaded(); // Continue even if image fails
    // Set loading to eager for faster loading
    coverImg.loading = 'eager';
    coverImg.src = mag.cover;

    // Preload pages in parallel for faster loading
    if (mag.pages && mag.pages.length > 0) {
      mag.pages.forEach((page, index) => {
        const img = new Image();
        img.onload = () => {
          setLoadingImages(prev => ({ ...prev, [`page-${index}`]: true }));
          checkAllLoaded();
        };
        img.onerror = () => checkAllLoaded(); // Continue even if image fails
        img.loading = 'eager';
        img.src = page;
      });
    }
  }, [mag.cover, mag.pages]);

  return (
    <div
      className="fixed inset-0 bg-[#0b0c10] bg-opacity-95 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Only trigger when clicking the backdrop (not the modal content)
        if (e.target === e.currentTarget) {
          handleModalClose();
        }
      }}
    >
      {isLoadingComments ? (
        <div className="flex flex-col items-center justify-center gap-6">
          {/* Animated spinner with dual rings and glow effect */}
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-purple-500 shadow-lg shadow-purple-500/50"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-pink-500 opacity-50 shadow-lg shadow-pink-500/50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          
          {/* Loading text with animated dots */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-gray-100 text-xl font-bold animate-pulse">Loading Magazine</p>
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce shadow-sm shadow-purple-500/50" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce shadow-sm shadow-purple-500/50" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce shadow-sm shadow-purple-500/50" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
          
          {/* Loading message */}
          <p className="text-gray-400 text-sm text-center max-w-xs">
            preparing your reading experience...
          </p>
        </div>
      ) : (
        <div
          className="max-h-full overflow-auto rounded-lg shadow-2xl max-w-6xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="bg-[#241231] bg-opacity-95 text-gray-200 flex flex-col md:flex-row gap-8 p-6 rounded-lg shadow-2xl border border-purple-500/30">
          {/* Flip Book */}
          <div className="w-full md:w-auto md:flex-shrink-0 flex flex-col items-center justify-center p-2 md:p-4 relative group">
            <button
              onClick={() => {
                // Navigate to dedicated reader page for both mobile and desktop
                navigate('/magazine-reader', { 
                  state: { magazine: mag }
                });
              }}
              className="absolute top-2 right-2 z-10 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg pointer-events-auto"
              title="Book Reading Mode"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C20.832 18.477 19.247 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>

            {/* Fullscreen Close Button - only visible in fullscreen mode */}
            <button
              onClick={() => {
                const flipBook = document.querySelector('.book-fullscreen-mode');
                if (flipBook) {
                  // Exit fullscreen mode and return to normal modal view
                  flipBook.classList.remove('book-fullscreen-mode');
                  
                  console.log('Exited fullscreen via X button - returning to normal modal view');
                  
                  // Update the flipbook after a short delay to allow CSS transition
                  setTimeout(() => {
                    if (pageFlipRef.current) {
                      try {
                        const pageFlip = pageFlipRef.current.pageFlip();
                        if (pageFlip && pageFlip.update) {
                          pageFlip.update();
                        }
                      } catch (error) {
                        console.log('PageFlip update error:', error);
                      }
                    }
                  }, 350);
                }
              }}
              className="fullscreen-close-btn absolute top-4 right-4 z-[60] bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg opacity-0 transition-all duration-300"
              title="Exit Fullscreen"
              style={{ display: 'none' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Fullscreen Instructions - only visible in fullscreen mode */}
            <div className="fullscreen-instructions absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[60] opacity-0 transition-all duration-300 bg-black/70 backdrop-blur-sm px-6 py-3 rounded-full border border-purple-500/30" style={{ display: 'none' }}>
              <p className="text-gray-300 text-sm text-center">
                📖 Click corners to flip pages • Press ESC or click X to exit
              </p>
            </div>
            
            <div className="w-full max-w-[300px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-[480px] perspective-1000 relative magazine-container pointer-events-none" style={{ aspectRatio: '480/700' }}>
              <PageFlip
                ref={pageFlipRef}
                width={window.innerWidth < 640 ? 300 : window.innerWidth < 768 ? 350 : window.innerWidth < 1024 ? 400 : 480}
                height={window.innerWidth < 640 ? 437 : window.innerWidth < 768 ? 510 : window.innerWidth < 1024 ? 583 : 700}
                uncutPages={false}
                showCover={true}
                className="magazine-flipbook pointer-events-auto"
                flippingTime={800}
                useMouseEvents={true}
                maxShadowOpacity={0.7}
                showSwipeHint={true}
                autoSize={true}
                clickEventForward={true}
                usePortrait={true}
                startPage={0}
                showPageCorners={true}
                size="stretch"
                renderOnlyPageLengths={false}
                minWidth={300}
                maxWidth={1800}
                minHeight={400}
                maxHeight={1200}
                style={{ margin: 'auto' }}
                swipeDistance={50}
                disableFlipByClick={false}
                drawShadow={true}
                mobileScrollSupport={false}
              >
                {/* Cover */}
                <div className="page-wrapper relative shadow-2xl" style={{ boxShadow: '0 0 20px rgba(200,200,200,0.3), inset 0 0 10px rgba(255,255,255,0.2)' }}>
                  {!loadingImages.cover && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#2c1052]">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  )}
                  <img
                    src={mag.cover}
                    alt={`Cover of ${mag.title}`}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${loadingImages.cover ? 'opacity-100' : 'opacity-0'}`}
                    style={{ background: '#2c1052' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                </div>

                {/* Magazine Pages */}
                {mag.pages?.map((page, index) => (
                  <div key={index} className="page-wrapper relative shadow-2xl" style={{ boxShadow: '0 0 20px rgba(200,200,200,0.3), inset 0 0 10px rgba(255,255,255,0.2)' }}>
                    {!loadingImages[`page-${index}`] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#2c1052]">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                      </div>
                    )}
                    <img
                      src={page}
                      alt={`Page ${index + 2} of ${mag.title}`}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${loadingImages[`page-${index}`] ? 'opacity-100' : 'opacity-0'}`}
                      style={{ background: '#2c1052' }}
                    />
                    {/* Optional page number overlay */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {index + 2}
                    </div>
                  </div>
                ))}
              </PageFlip>

            </div>
            <div className="flex flex-col items-center gap-2 mt-4">
              <p className="text-gray-400 text-sm">Click corners to flip pages • Click book mode for side-by-side reading</p>
              {hasRated && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="text-sm font-medium">You rated this {userRating} star{userRating !== 1 ? 's' : ''}!</span>
                </div>
              )}
            </div>
          </div>

          {/* Details & Interaction */}
          <div className="md:flex-1 flex flex-col max-h-[80vh]">
            <div className="overflow-y-auto pr-4 mb-4">
              <h2 className="text-3xl font-bold mb-2 text-gray-100">
                {mag.title}
              </h2>
              <p className="text-gray-400 text-lg mb-1">By {mag.author}</p>
              {mag.subtitle && (
                <p className="text-gray-300 text-xl mb-3 italic font-light">
                  {mag.subtitle}
                </p>
              )}
              <p className="text-gray-500 text-sm mb-1">{mag.course}</p>
              <p className="text-gray-400 text-lg mb-4">
                {new Date(mag.created_at).toLocaleDateString()}
              </p>
              <p className="text-gray-300 mb-6 leading-relaxed">
                {mag.description}
              </p>

              {/* Reactions */}
              <div className="flex items-center gap-3 mb-6 flex-wrap ml-4">
                <button
                  onClick={handleLike}
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    hasLiked 
                      ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30" 
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-red-400 border border-white/10"
                  }`}
                >
                  <svg 
                    className={`w-5 h-5 transition-transform duration-300 ${hasLiked ? "scale-110" : "group-hover:scale-110"}`}
                    fill={hasLiked ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-sm font-semibold">Like</span>
                  <span className="text-sm font-semibold">({likes})</span>
                </button>

                <button 
                  onClick={() => document.querySelector('input[placeholder="Join the discussion..."]')?.focus()}
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-blue-400 border border-white/10"
                >
                  <svg 
                    className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm font-semibold">Comment</span>
                  <span className="text-sm font-semibold">({comments.length})</span>
                </button>

                <button
                  onClick={handleSave}
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    hasSaved 
                      ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/30" 
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-yellow-400 border border-white/10"
                  }`}
                >
                  <svg 
                    className={`w-5 h-5 transition-transform duration-300 ${hasSaved ? "scale-110" : "group-hover:scale-110"}`}
                    fill={hasSaved ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span className="text-sm font-semibold">{hasSaved ? "Saved" : "Save"}</span>
                </button>
              </div>
            </div>

            {/* Comment Section */}
            <div className="border-t border-purple-500/20 pt-4 flex flex-col max-h-[40vh]">
              <h3 className="text-lg font-semibold mb-3 text-gray-100">
                Comments
              </h3>

              <ul className="space-y-3 overflow-y-auto flex-grow pr-2">
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    No comments yet. Be the first!
                  </p>
                ) : (
                  comments.map((c) => (
                    <li
                      key={c.id}
                      className="bg-black/20 p-3 rounded-lg border border-purple-500/20"
                    >
                      <div className="flex justify-between">
                        <div>
                          <strong className="text-gray-100">{c.user_name || "Anonymous User"}</strong>
                          <span className="text-xs text-gray-400 ml-2">
                            Student
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{c.text}</p>
                    </li>
                  ))
                )}
              </ul>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="flex gap-2 mt-4 w-full">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Join the discussion..."
                  className="flex-grow bg-black/20 border border-purple-500/20 rounded-full px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-full text-sm transition"
                >
                  Post
                </button>
              </form>
            </div>

            {/* Close Button */}
            <div className="mt-4 text-right">
              <button
                onClick={handleModalClose}
                className="bg-gray-600 hover:bg-gray-500 text-white px-5 py-2 rounded-full text-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Rating Popup */}
        {showRatingPopup && !hasRated && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#2c1052] to-[#1b0b28] border border-purple-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-purple-500/20 animate-bounce-in">
              <div className="text-center">
                {/* Celebration Icon */}
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30 animate-pulse">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                  How was your experience? ✨
                </h3>
                <p className="text-gray-300 mb-6">
                  Rate "{mag.title}" magazine and help others discover great content!
                </p>

                {/* Star Rating */}
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setUserRating(star)}
                      onMouseLeave={() => !hasRated && setUserRating(0)}
                      className="group transform transition-all duration-200 hover:scale-125 focus:outline-none"
                    >
                      <svg 
                        className={`w-10 h-10 transition-all duration-200 ${
                          star <= userRating 
                            ? "text-yellow-400 drop-shadow-lg" 
                            : "text-gray-500 group-hover:text-yellow-300"
                        }`}
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleRatingDismiss}
                    className="px-6 py-2.5 bg-gray-600/50 hover:bg-gray-600 text-white rounded-full transition-all duration-200 text-sm font-medium border border-gray-500/30"
                  >
                    Maybe Later
                  </button>
                  {userRating > 0 && (
                    <button
                      onClick={() => handleRating(userRating)}
                      className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full transition-all duration-200 text-sm font-bold shadow-lg shadow-purple-500/30 transform hover:scale-105"
                    >
                      Submit Rating
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default Archive;
