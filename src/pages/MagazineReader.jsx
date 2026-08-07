// src/pages/MagazineReader.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import PageFlip from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { supabase } from "../supabaseClient";
import "../styles/magazineReader.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const isPdfUrl = (url) => typeof url === "string" && /\.pdf(?:$|[?#])/i.test(url);

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 1.25;
const clampZoom = (value) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));

const MagazineReader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const navigationMagazine = location.state?.magazine;
    const [magazine, setMagazine] = useState(navigationMagazine || null);
    const [isLoadingMagazine, setIsLoadingMagazine] = useState(!navigationMagazine);
    const [magazineLoadError, setMagazineLoadError] = useState("");
    const [loadingImages, setLoadingImages] = useState({});
    const [isLoadingImages, setIsLoadingImages] = useState(true);
    const [pdfPages, setPdfPages] = useState([]);
    const [pdfLoadError, setPdfLoadError] = useState("");
    const [dimensions, setDimensions] = useState({ width: 480, height: 700 });
    const [isLandscape, setIsLandscape] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasRated, setHasRated] = useState(false);
    const pageFlipRef = React.useRef(null);
    const containerRef = React.useRef(null);
    const [zoom, setZoom] = useState(1);
    const zoomRef = React.useRef(1);
    const pinchRef = React.useRef(null);
    const [contentBox, setContentBox] = useState(null);
    const [showGestureGuide, setShowGestureGuide] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [hasSeenGuide, setHasSeenGuide] = useState(() => {
        // Check localStorage to see if user has already seen the guide
        return localStorage.getItem('magazine_gesture_guide_seen') === 'true';
    });

    // Direct links and page refreshes do not include React Router state. Load
    // the magazine by its URL id so the reader remains usable in both cases.
    useEffect(() => {
        let cancelled = false;

        const loadMagazine = async () => {
            if (navigationMagazine) {
                setMagazine(navigationMagazine);
                setIsLoadingMagazine(false);
                return;
            }

            if (!id) {
                setIsLoadingMagazine(false);
                return;
            }

            setIsLoadingMagazine(true);
            const { data, error } = await supabase
                .from("magazines")
                .select("*")
                .eq("id", id)
                .eq("published", true)
                .maybeSingle();

            if (cancelled) return;

            if (error || !data) {
                setMagazineLoadError(error?.message || "This magazine is no longer available.");
                setMagazine(null);
            } else {
                setMagazine(data);
            }
            setIsLoadingMagazine(false);
        };

        loadMagazine();
        return () => {
            cancelled = true;
        };
    }, [id, navigationMagazine]);

    const pdfSource = magazine?.pdfurl || (isPdfUrl(magazine?.cover) ? magazine.cover : "");
    const isPdfMagazine = Boolean(pdfSource);
const readerCover = isPdfMagazine ? pdfPages[0] : magazine?.cover;
    const readerPages = isPdfMagazine ? pdfPages.slice(1) : (magazine?.pages || []);
    const hasFlipbookPages = readerPages.length > 0;
    const isZoomed = zoom > 1.005;

    // The book always fits the available viewport (like the original
    // responsive scaling). In landscape it is a two-page spread, in portrait
    // a single page. `fitBox` is the on-screen size of the book at 100%.
    const fitBox = useMemo(() => {
        if (!contentBox) return null;
        const pageAspect = dimensions.width / dimensions.height;
        const bookAspect = pageAspect * (isLandscape ? 2 : 1);
        const fitWidth = Math.min(contentBox.width, contentBox.height * bookAspect);
        return {
            width: fitWidth,
            height: fitWidth / bookAspect,
        };
    }, [contentBox, isLandscape, dimensions.width, dimensions.height]);

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

    // Keep a ref in sync with the current zoom so native (non-passive)
    // touch/wheel handlers can always read the latest value.
    useEffect(() => {
        zoomRef.current = zoom;
    }, [zoom]);

    // Measure the flipbook viewport's content box so the zoom wrapper can size
    // itself to the scaled book (this makes the viewport scrollable when
    // zoomed in). The box is stable - it never depends on the rendered book,
    // so it cannot fight page-flip's auto-stretch sizing.
    useEffect(() => {
        if (isLoadingImages || !containerRef.current || !hasFlipbookPages) {
            setContentBox(null);
            return undefined;
        }

        let cancelled = false;

        const measure = () => {
            if (cancelled) return;
            const el = containerRef.current;
            if (!el) return;
            const cs = getComputedStyle(el);
            const width = el.clientWidth
                - (parseFloat(cs.paddingLeft) || 0)
                - (parseFloat(cs.paddingRight) || 0);
            const height = el.clientHeight
                - (parseFloat(cs.paddingTop) || 0)
                - (parseFloat(cs.paddingBottom) || 0);
            if (width > 0 && height > 0) {
                setContentBox((prev) =>
                    prev && Math.abs(prev.width - width) < 2 && Math.abs(prev.height - height) < 2
                        ? prev
                        : { width, height }
                );
            }
        };

        measure();
        const timer = window.setTimeout(measure, 300);

        const observer = new ResizeObserver(measure);
        observer.observe(containerRef.current);

        window.addEventListener("resize", measure);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            observer.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, [isLoadingImages, hasFlipbookPages]);

    // Zoom with Ctrl/Cmd + "+" / "-" / "0" keyboard shortcuts.
    useEffect(() => {
        const onKeyDown = (e) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            const key = e.key.toLowerCase();
            if (key === "+" || key === "=") {
                e.preventDefault();
                setZoom((prev) => clampZoom(prev * ZOOM_STEP));
            } else if (key === "-" || key === "_") {
                e.preventDefault();
                setZoom((prev) => clampZoom(prev / ZOOM_STEP));
            } else if (key === "0") {
                e.preventDefault();
                setZoom(1);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    // Zoom with Ctrl/Cmd + mouse wheel (also fires for trackpad pinch). Only
    // attached once the flipbook viewport exists.
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;

        const onWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const factor = Math.pow(1.01, -e.deltaY);
                setZoom((prev) => clampZoom(prev * factor));
            }
        };

        container.addEventListener("wheel", onWheel, { passive: false });
        return () => container.removeEventListener("wheel", onWheel);
    }, [isLoadingImages, hasFlipbookPages]);

    // Pinch-to-zoom and two-finger pan on touch devices. The handlers run in
    // the capture phase on the viewport so page-flip never sees the gesture
    // while two fingers are down (single-finger flipping is untouched).
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;

        const mid = (touches) => ({
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2,
        });

        const dist = (touches) =>
            Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

        const onTouchStart = (e) => {
            if (e.touches.length === 2) {
                pinchRef.current = {
                    startDist: dist(e.touches),
                    startZoom: zoomRef.current,
                    startMid: mid(e.touches),
                    startScrollLeft: container.scrollLeft,
                    startScrollTop: container.scrollTop,
                };
            } else if (e.touches.length < 2) {
                pinchRef.current = null;
            }
        };

        const onTouchMove = (e) => {
            const pinch = pinchRef.current;
            if (!pinch || e.touches.length < 2) return;
            e.preventDefault();
            e.stopPropagation();

            const currentDist = dist(e.touches);
            const currentMid = mid(e.touches);
            setZoom(clampZoom(pinch.startZoom * (currentDist / pinch.startDist)));
            container.scrollLeft = pinch.startScrollLeft + (pinch.startMid.x - currentMid.x);
            container.scrollTop = pinch.startScrollTop + (pinch.startMid.y - currentMid.y);
        };

        const onTouchEnd = () => {
            pinchRef.current = null;
        };

        container.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
        container.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
        container.addEventListener("touchend", onTouchEnd, { passive: true, capture: true });
        container.addEventListener("touchcancel", onTouchEnd, { passive: true, capture: true });

        return () => {
            container.removeEventListener("touchstart", onTouchStart, { capture: true });
            container.removeEventListener("touchmove", onTouchMove, { capture: true });
            container.removeEventListener("touchend", onTouchEnd, { capture: true });
            container.removeEventListener("touchcancel", onTouchEnd, { capture: true });
        };
    }, [isLoadingImages, hasFlipbookPages]);

    // Render PDFs into page images for the existing page-flip reader. This
    // preserves drag and click-to-turn controls for approved submissions.
    useEffect(() => {
        if (!isPdfMagazine || !pdfSource) return;

        let cancelled = false;
        let loadingTask;

        const renderPdfPages = async () => {
            setIsLoadingImages(true);
            setPdfLoadError("");
            setPdfPages([]);

try {
                loadingTask = pdfjsLib.getDocument({ url: pdfSource });
                const pdf = await loadingTask.promise;
                const renderedPages = [];

                for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
                    const page = await pdf.getPage(pageNumber);
                    const viewport = page.getViewport({ scale: 1.5 });
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");

                    if (!context) throw new Error("Could not prepare a magazine page.");

                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    await page.render({ canvasContext: context, viewport }).promise;
                    renderedPages.push(canvas.toDataURL("image/jpeg", 0.92));
                }

                if (!cancelled) {
                    setPdfPages(renderedPages);
                    setLoadingImages(
                        renderedPages.reduce(
                            (images, _page, index) => ({
                                ...images,
                                [index === 0 ? "cover" : `page-${index - 1}`]: true,
                            }),
                            {}
                        )
                    );
                    setIsLoadingImages(false);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Unable to render magazine PDF:", error);
                    // If this magazine already ships page images (created during
                    // upload), fall back to those so the flipbook still works.
                    const previewPages = magazine?.pages?.length ? magazine.pages : [];
                    if (magazine?.cover && previewPages.length > 0) {
                        setPdfPages([magazine.cover, ...previewPages]);
                        setLoadingImages(
                            previewPages.reduce(
                                (images, _page, index) => ({
                                    ...images,
                                    [index === 0 ? "cover" : `page-${index - 1}`]: true,
                                }),
                                {}
                            )
                        );
                        setIsLoadingImages(false);
                    } else {
                        setPdfLoadError("This PDF could not be prepared for the flipbook.");
                        setIsLoadingImages(false);
                    }
                }
            }
        };

        renderPdfPages();

        return () => {
            cancelled = true;
            loadingTask?.destroy();
        };
    }, [isPdfMagazine, pdfSource, magazine?.cover, magazine?.pages]);

    // Preload image-based magazines.
    useEffect(() => {
        if (!magazine) return;

        if (isPdfMagazine) return;

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
    }, [magazine, isPdfMagazine]);

    // Zoom controls
    const zoomIn = () => setZoom((prev) => clampZoom(prev * ZOOM_STEP));
    const zoomOut = () => setZoom((prev) => clampZoom(prev / ZOOM_STEP));
    const resetZoom = () => setZoom(1);

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

    if (isLoadingMagazine) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0c10] text-white">
                Loading magazine…
            </div>
        );
    }

    if (!magazine) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0b0c10] p-6 text-center text-white">
                <p>{magazineLoadError || "This magazine could not be loaded."}</p>
                <button
                    onClick={() => navigate("/archive")}
                    className="rounded-lg bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-500"
                >
                    Back to archive
                </button>
            </div>
        );
    }

    if (pdfLoadError) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0b0c10] p-6 text-center text-white">
                <p>{pdfLoadError}</p>
                <a href={pdfSource} target="_blank" rel="noreferrer" className="rounded-lg bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-500">
                    Open PDF instead
                </a>
                <button onClick={() => navigate("/archive")} className="text-purple-300 hover:text-purple-200">
                    Back to archive
                </button>
            </div>
        );
    }

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
            {!hasFlipbookPages && !isLoadingImages ? (
                <div className="flex flex-1 items-center justify-center bg-[#0b0c10] p-4">
                    <img
                        src={readerCover}
                        alt={`Cover of ${magazine.title}`}
                        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                    />
                </div>
            ) : isLoadingImages ? (
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
                    className={`flex-1 flex items-center justify-center p-2 md:p-4 relative ${isZoomed ? 'overflow-auto' : isLandscape ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`}
                    style={{
                        touchAction: isZoomed ? 'none' : isLandscape ? 'pan-y' : 'auto',
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

                    <div className="magazine-zoom-inner">
                        <div
                            className="magazine-zoom-holder"
                            style={{
                                width: fitBox ? fitBox.width * zoom : undefined,
                                height: fitBox ? fitBox.height * zoom : undefined,
                            }}
                        >
                            <div
                                className="magazine-zoom-stage"
                                style={{
                                    width: fitBox ? fitBox.width : undefined,
                                    height: fitBox ? fitBox.height : undefined,
                                    transform: `scale(${zoom})`,
                                    transformOrigin: 'center center',
                                }}
                            >
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
                            disableFlipByClick={false}
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
                                    src={readerCover}
                                    alt={`Cover of ${magazine.title}`}
                                    className={`w-full h-full object-cover transition-opacity duration-300 ${loadingImages.cover ? 'opacity-100' : 'opacity-0'}`}
                                    style={{ background: '#2c1052' }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                            </div>

                            {/* Magazine Pages */}
                            {readerPages.map((page, index) => (
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
                        </div>
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
                        <div className="mt-2 flex items-center justify-center gap-2 select-none">
                            <button
                                onClick={zoomOut}
                                disabled={zoom <= ZOOM_MIN}
                                aria-label="Zoom out"
                                title="Zoom out (Ctrl + -)"
                                className="w-8 h-8 flex items-center justify-center rounded-full border border-purple-500/30 bg-white/10 text-white text-lg font-bold hover:bg-purple-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                −
                            </button>
                            <button
                                onClick={resetZoom}
                                aria-label="Reset zoom"
                                title="Reset zoom (Ctrl + 0)"
                                className="px-3 py-1 text-xs font-semibold text-purple-200 hover:text-white transition-colors"
                            >
                                {Math.round(zoom * 100)}%
                            </button>
                            <button
                                onClick={zoomIn}
                                disabled={zoom >= ZOOM_MAX}
                                aria-label="Zoom in"
                                title="Zoom in (Ctrl + +)"
                                className="w-8 h-8 flex items-center justify-center rounded-full border border-purple-500/30 bg-white/10 text-white text-lg font-bold hover:bg-purple-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                +
                            </button>
                        </div>
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
