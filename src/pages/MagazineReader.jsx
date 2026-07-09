// src/pages/MagazineReader.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageFlip from "react-pageflip";
import { supabase } from "../supabaseClient";
import "../styles/magazineReader.css";

const MagazineReader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { magazine } = location.state || {};

    const [loadingImages, setLoadingImages] = useState({});
    const [isLoadingImages, setIsLoadingImages] = useState(true);
    const [dimensions, setDimensions] = useState({ width: 480, height: 700 });
    const [isLandscape, setIsLandscape] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasRated, setHasRated] = useState(false);
    const pageFlipRef = React.useRef(null);
    const containerRef = React.useRef(null);
    const [showGestureGuide, setShowGestureGuide] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [hasSeenGuide, setHasSeenGuide] = useState(() => {
        // Check localStorage to see if user has already seen the guide
        return localStorage.getItem('magazine_gesture_guide_seen') === 'true';
    });

    // Generate or get user ID from localStorage
    const [userId] = useState(() => {
        let id = localStorage.getItem('magazine_user_id');
        if (!id) {
            id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('magazine_user_id', id);
        }
        return id;
    });

    // Calculate responsive dimensions based on screen size
    const calculateDimensions = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const aspectRatio = 480 / 700; // Original aspect ratio (0.686)
        const isLandscape = viewportWidth > viewportHeight;

        // Reserve space for header and footer
        const headerHeight = 80;
        const footerHeight = 60;
        const availableHeight = viewportHeight - headerHeight - footerHeight;
        const availableWidth = viewportWidth;

        let width, height;

        if (viewportWidth <= 768) {
            // Mobile devices - fully responsive, use percentage of screen
            let widthPercentage, heightPercentage;

            if (isLandscape) {
                // Landscape mode - maximize horizontal space
                widthPercentage = 0.99; // Use 99% of screen width in landscape (increased)
                heightPercentage = 0.96; // Use 96% of available height (increased)
            } else {
                // Portrait mode - standard sizing
                widthPercentage = 0.98; // Use 98% of screen width (increased from 95%)
                heightPercentage = 0.90; // Use 90% of available height (increased from 85%)
            }

            const maxWidth = availableWidth * widthPercentage;
            const maxHeight = availableHeight * heightPercentage;

            // Calculate dimensions maintaining aspect ratio
            if (maxWidth / aspectRatio <= maxHeight) {
                // Width-constrained
                width = maxWidth;
                height = width / aspectRatio;
            } else {
                // Height-constrained
                height = maxHeight;
                width = height * aspectRatio;
            }
        } else {
            // Desktop - responsive but with max limits
            const maxDesktopWidth = 1800;
            let preferredWidth;

            if (isLandscape) {
                // Desktop landscape - use more screen width
                preferredWidth = availableWidth * 0.75; // Use 75% of screen (increased from 70%)
            } else {
                // Desktop portrait (rare) - more conservative
                preferredWidth = availableWidth * 0.65; // Use 65% of screen (increased from 60%)
            }

            width = Math.min(preferredWidth, maxDesktopWidth);
            height = width / aspectRatio;

            // Check if height exceeds available space
            const maxHeightPercentage = isLandscape ? 0.97 : 0.92; // Increased
            if (height > availableHeight * maxHeightPercentage) {
                height = availableHeight * maxHeightPercentage;
                width = height * aspectRatio;
            }
        }

        return {
            width: Math.floor(width),
            height: Math.floor(height)
        };
    };

    // Update dimensions on mount and resize/rotation
    useEffect(() => {
        let isFirstLoad = true;
        
        const updateDimensions = () => {
            const newDimensions = calculateDimensions();
            setDimensions(newDimensions);

            // Check if device is in landscape mode
            const landscape = window.innerWidth > window.innerHeight;
            const wasLandscape = isLandscape;

            // Check if mobile device
            const mobile = window.innerWidth <= 768;
            const wasMobile = isMobile;
            setIsMobile(mobile);

            // Show guide on first load for mobile only
            if (mobile && !wasMobile && !hasSeenGuide) {
                setShowGestureGuide(true);
            } else if (!mobile) {
                setShowGestureGuide(false);
            }

            // If orientation changed (and not first load), refresh the page
            if (wasLandscape !== landscape && !isFirstLoad) {
                // Refresh page once when orientation changes
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            } else {
                // Just update dimensions for normal resize or first load
                setIsLandscape(landscape);
                setTimeout(() => {
                    if (pageFlipRef.current) {
                        window.dispatchEvent(new Event('resize'));
                    }
                }, 100);
            }
            
            // After first run, set flag to false
            if (isFirstLoad) {
                isFirstLoad = false;
            }
        };

        // Set initial dimensions
        updateDimensions();

        // Listen for resize and orientation changes
        window.addEventListener('resize', updateDimensions);
        window.addEventListener('orientationchange', updateDimensions);

        return () => {
            window.removeEventListener('resize', updateDimensions);
            window.removeEventListener('orientationchange', updateDimensions);
        };
    }, [isLandscape, isMobile, hasSeenGuide]);

    // Redirect back if no magazine data
    useEffect(() => {
        if (!magazine) {
            navigate('/archive');
        }
    }, [magazine, navigate]);

    // Check if user has already rated this magazine
    useEffect(() => {
        const checkExistingRating = async () => {
            if (!magazine?.id) return;

            const { data: ratingData } = await supabase
                .from("magazine_ratings")
                .select("rating")
                .eq("magazine_id", magazine.id)
                .eq("user_id", userId)
                .single();

            if (ratingData) {
                setHasRated(true);
                setRating(ratingData.rating);
            }
        };

        checkExistingRating();
    }, [magazine?.id, userId]);

    // Preload images
    useEffect(() => {
        if (!magazine) return;

        const totalImages = 1 + (magazine.pages?.length || 0);
        let loadedCount = 0;

        const checkAllLoaded = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
                setIsLoadingImages(false);
            }
        };

        // Preload cover
        const coverImg = new Image();
        coverImg.onload = () => {
            setLoadingImages(prev => ({ ...prev, cover: true }));
            checkAllLoaded();
        };
        coverImg.onerror = () => checkAllLoaded();
        coverImg.loading = 'eager';
        coverImg.src = magazine.cover;

        // Preload pages
        if (magazine.pages && magazine.pages.length > 0) {
            magazine.pages.forEach((page, index) => {
                const img = new Image();
                img.onload = () => {
                    setLoadingImages(prev => ({ ...prev, [`page-${index}`]: true }));
                    checkAllLoaded();
                };
                img.onerror = () => checkAllLoaded();
                img.loading = 'eager';
                img.src = page;
            });
        }
    }, [magazine]);

    // Handle back button
    const handleClose = () => {
        // Only show rating modal if user hasn't rated yet
        if (!hasRated) {
            setShowRatingModal(true);
        } else {
            // User has already rated, go back directly
            navigate('/archive');
        }
    };

    const handleSkipRating = () => {
        setShowRatingModal(false);
        navigate('/archive');
    };

    const handleSubmitRating = async () => {
        if (rating === 0 || isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Save rating to database using upsert (insert or update)
            const { error } = await supabase
                .from("magazine_ratings")
                .upsert([
                    {
                        magazine_id: magazine.id,
                        user_id: userId,
                        rating: rating
                    }
                ], {
                    onConflict: 'magazine_id,user_id' // Update if already exists
                });

            if (error) {
                console.error('Error saving rating:', error);
                alert('Failed to save rating. Please try again.');
                setIsSubmitting(false);
                return;
            }

            // Record rating analytics event
            await supabase.from("magazine_analytics").insert([
                { magazine_id: magazine.id, event_type: "rating", metadata: { rating } }
            ]);

            console.log('Rating submitted successfully:', rating, 'for magazine:', magazine.id);

            // Mark as rated
            setHasRated(true);

            // Show success feedback
            setShowRatingModal(false);

            // Navigate back after a short delay
            setTimeout(() => {
                navigate('/archive');
            }, 300);

        } catch (err) {
            console.error('Unexpected error:', err);
            alert('An unexpected error occurred. Please try again.');
            setIsSubmitting(false);
        }
    };

    const handleStarClick = (starValue) => {
        setRating(starValue);
    };

    if (!magazine) return null;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-[#0b0c10] via-[#1b0b28] to-[#071030] z-50 flex flex-col">
            {/* Header with Logo and Close Button */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-purple-500/20 bg-black/30 backdrop-blur-sm">
                {/* Logo and Title Section */}
                <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-purple-400/50 flex items-center justify-center shadow-lg overflow-hidden bg-white flex-shrink-0">
                        <img
                            src="https://raw.githubusercontent.com/JayDee15999/pic/refs/heads/main/1.png"
                            alt="Vibe Magazine Logo"
                            className="w-8 h-8 md:w-10 md:h-10 object-cover rounded-full"
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-base md:text-xl font-bold text-white truncate">{magazine.title}</h1>
                        <p className="text-xs md:text-sm text-gray-400 truncate">{magazine.author}</p>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 md:p-3 rounded-full shadow-lg transition-all duration-300 flex-shrink-0 ml-2"
                    title="Close Reader"
                >
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Loading State */}
            {isLoadingImages ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-purple-500 shadow-lg shadow-purple-500/50"></div>
                        <div className="absolute top-0 left-0 animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-pink-500 opacity-50 shadow-lg shadow-pink-500/50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-gray-100 text-xl font-bold animate-pulse">Loading Magazine</p>
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce shadow-sm shadow-purple-500/50" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce shadow-sm shadow-purple-500/50" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce shadow-sm shadow-purple-500/50" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                </div>
            ) : (
                /* Magazine Flipbook - Full Screen Side by Side */
                <div
                    ref={containerRef}
                    className={`flex-1 flex items-center justify-center p-2 md:p-4 relative ${isLandscape ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`}
                    style={{
                        touchAction: isLandscape ? 'pan-y' : 'auto',
                        WebkitOverflowScrolling: 'touch'
                    }}
                >
                    {/* Gesture Guide Overlay */}
                    {showGestureGuide && isMobile && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
                            <div className="bg-gradient-to-br from-purple-900/95 to-pink-900/95 rounded-2xl p-6 mx-4 max-w-sm shadow-2xl border-2 border-purple-400/50 animate-bounce-in relative">
                                {/* Close Button */}
                                <button
                                    onClick={() => {
                                        setShowGestureGuide(false);
                                        setHasSeenGuide(true);
                                        // Save to localStorage so it won't show again
                                        localStorage.setItem('magazine_gesture_guide_seen', 'true');
                                    }}
                                    className="absolute top-3 right-3 w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg hover:shadow-red-500/50 z-20 transform hover:scale-110 hover:rotate-90 active:scale-95"
                                    aria-label="Close guide"
                                >
                                    <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                <div className="text-center space-y-4">
                                    {/* Two Finger Icon */}
                                    <div className="flex justify-center gap-3 mb-4">
                                        <div className="relative">
                                            <svg className="w-12 h-12 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                                            </svg>
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                                        📱 Mobile Controls
                                    </h3>

                                    <div className="space-y-3 text-left">
                                        <div className="flex items-start gap-3 bg-white/10 rounded-lg p-3">
                                                <span className="text-2xl">👈👉</span>
                                            <div>
                                                <p className="text-white font-semibold text-sm">Flip Pages</p>
                                                <p className="text-purple-200 text-xs">Swipe left/right to change pages</p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-purple-200 text-xs mt-4 opacity-75">
                                        Tap the ✕ button above to close
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div
                        className="reader-fullscreen-container"
                    >
                        <PageFlip
                            ref={pageFlipRef}
                            width={dimensions.width}
                            height={dimensions.height}
                            uncutPages={false}
                            showCover={!isLandscape}
                            className="magazine-flipbook-reader"
                            flippingTime={800}
                            useMouseEvents={true}
                            maxShadowOpacity={0.7}
                            showSwipeHint={true}
                            autoSize={true}
                            clickEventForward={true}
                            usePortrait={!isLandscape}
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
                            disableFlipByClick={true}
                            drawShadow={true}
                            mobileScrollSupport={isLandscape}
                        >
                            {/* Cover */}
                            <div className="page-wrapper relative border-4 border-gray-300 shadow-2xl" style={{ boxShadow: '0 0 20px rgba(200,200,200,0.3), inset 0 0 10px rgba(255,255,255,0.2)' }}>
                                {!loadingImages.cover && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#2c1052]">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                                    </div>
                                )}
                                <img
                                    src={magazine.cover}
                                    alt={`Cover of ${magazine.title}`}
                                    className={`w-full h-full object-cover transition-opacity duration-300 ${loadingImages.cover ? 'opacity-100' : 'opacity-0'}`}
                                    style={{ background: '#2c1052' }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                            </div>

                            {/* Magazine Pages */}
                            {magazine.pages?.map((page, index) => (
                                <div key={index} className="page-wrapper relative border-4 border-gray-300 shadow-2xl" style={{ boxShadow: '0 0 20px rgba(200,200,200,0.3), inset 0 0 10px rgba(255,255,255,0.2)' }}>
                                    {!loadingImages[`page-${index}`] && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#2c1052]">
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                                        </div>
                                    )}
                                    <img
                                        src={page}
                                        alt={`Page ${index + 2} of ${magazine.title}`}
                                        className={`w-full h-full object-cover transition-opacity duration-300 ${loadingImages[`page-${index}`] ? 'opacity-100' : 'opacity-0'}`}
                                        style={{ background: '#2c1052' }}
                                    />
                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                        {index + 2}
                                    </div>
                                </div>
                            ))}
                        </PageFlip>
                    </div>
                </div>
            )}

            {/* Instructions and Footer */}
            {!isLoadingImages && (
                <div className="border-t border-purple-500/20 bg-black/30 backdrop-blur-sm">
                    {/* Instructions */}
                    <div className="p-3 text-center">
                        <p className="text-gray-400 text-xs md:text-sm">
                            {isMobile ? (
                                <>📱 Swipe up/down to scroll • Swipe left/right to flip pages</>
                            ) : (
                                <>📱 {isLandscape ? 'Side-by-side view • Scroll to navigate • Swipe to flip pages' : 'Swipe or tap corners to flip pages • Rotate device for side-by-side view'}</>
                            )}
                        </p>
                        {isMobile && (
                            <button
                                onClick={() => setShowGestureGuide(true)}
                                className="mt-2 text-purple-400 hover:text-purple-300 text-xs underline"
                            >
                                Show gesture guide
                            </button>
                        )}
                        {hasRated && (
                            <div className="mt-3 flex items-center justify-center gap-2 text-yellow-400">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <span className="text-sm font-medium">You rated this {rating} star{rating !== 1 ? 's' : ''}!</span>
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* Rating Modal */}
            {showRatingModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-[#2c1052] to-[#1b0b28] border border-purple-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-purple-500/20 animate-bounce-in">
                        <div className="text-center">
                            {/* Celebration Icon */}
                            <div className="mb-6">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30 animate-pulse">
                                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">
                                How was your experience? ✨
                            </h2>
                            <p className="text-gray-300 mb-6">
                                Rate "{magazine.title}" magazine and help others discover great content!
                            </p>

                            {/* Star Rating */}
                            <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => handleStarClick(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="group transform transition-all duration-200 hover:scale-125 focus:outline-none"
                                    >
                                        <svg
                                            className={`w-10 h-10 transition-all duration-200 ${star <= (hoverRating || rating)
                                                ? "text-yellow-400 drop-shadow-lg"
                                                : "text-gray-500 group-hover:text-yellow-300"
                                                }`}
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>

                            {/* Rating Text */}
                            {rating > 0 && (
                                <p className="text-center text-purple-300 mb-6 font-semibold animate-fadeIn">
                                    {rating === 1 && "⭐ Poor"}
                                    {rating === 2 && "⭐⭐ Fair"}
                                    {rating === 3 && "⭐⭐⭐ Good"}
                                    {rating === 4 && "⭐⭐⭐⭐ Very Good"}
                                    {rating === 5 && "⭐⭐⭐⭐⭐ Excellent"}
                                </p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={handleSkipRating}
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-gray-600/50 hover:bg-gray-600 text-white rounded-full transition-all duration-200 text-sm font-medium border border-gray-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Maybe Later
                                </button>
                                {rating > 0 && (
                                    <button
                                        onClick={handleSubmitRating}
                                        disabled={isSubmitting}
                                        className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full transition-all duration-200 text-sm font-bold shadow-lg shadow-purple-500/30 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Submitting...
                                            </span>
                                        ) : (
                                            'Submit Rating'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MagazineReader;
