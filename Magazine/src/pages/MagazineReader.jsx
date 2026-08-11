// src/pages/MagazineReader.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import PageFlip from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { supabase } from "../supabaseClient";
import "../styles/magazineReader.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const isPdfUrl = (url) => typeof url === "string" && /\.pdf(?:$|[?#])/i.test(url);

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4; // Increased max zoom for better detail viewing
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

    // Collapsible sections state
    const [showZoomControls, setShowZoomControls] = useState(true);
    const [showComments, setShowComments] = useState(true);

    // Comment state - no auth required
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [commentForm, setCommentForm] = useState({
        name: "",
        idNumber: "",
        email: "",
        course: "",
        year: "",
        text: ""
    });
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

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
        // Fill the full viewport width so the book touches the left and right
        // edges. Height follows the aspect ratio (the book scrolls vertically
        // in landscape if it is taller than the viewport).
        const fitWidth = contentBox.width;
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

        // Reserve space for header and footer - more precise for different devices
        const headerHeight = 80;
        const footerHeight = 60;
        const availableHeight = viewportHeight - headerHeight - footerHeight;
        const availableWidth = viewportWidth;

        let width, height;

        if (viewportWidth <= 768) {
            // Mobile devices - fully responsive, use percentage of screen
            let widthPercentage, heightPercentage;

            if (isLandscape) {
                // Landscape mode - maximize horizontal space for two-page spread
                widthPercentage = 0.99;
                heightPercentage = 0.96;
            } else {
                // Portrait mode - standard sizing
                widthPercentage = 0.98;
                heightPercentage = 0.90;
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
                preferredWidth = availableWidth * 0.75;
            } else {
                // Desktop portrait (rare) - more conservative
                preferredWidth = availableWidth * 0.65;
            }

            width = Math.min(preferredWidth, maxDesktopWidth);
            height = width / aspectRatio;

            // Check if height exceeds available space
            const maxHeightPercentage = isLandscape ? 0.97 : 0.92;
            if (height > availableHeight * maxHeightPercentage) {
                height = availableHeight * maxHeightPercentage;
                width = height * aspectRatio;
            }
        }

        // Ensure minimum dimensions for readability
        const minWidth = viewportWidth <= 768 ? 280 : 300;
        const minHeight = viewportWidth <= 768 ? 408 : 438;
        
        if (width < minWidth) {
            width = minWidth;
            height = width / aspectRatio;
        }
        if (height < minHeight) {
            height = minHeight;
            width = height * aspectRatio;
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

    // Fetch comments for this magazine
    useEffect(() => {
        const fetchComments = async () => {
            if (!magazine?.id) return;

            setIsLoadingComments(true);
            try {
                const { data, error } = await supabase
                    .from("magazine_comments")
                    .select("*")
                    .eq("magazine_id", magazine.id)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setComments(data || []);
            } catch (err) {
                console.error("Failed to load comments:", err);
            } finally {
                setIsLoadingComments(false);
            }
        };

        fetchComments();

        // Real-time subscription for new comments
        const subscription = supabase
            .channel("magazine-comments-changes")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "magazine_comments", filter: `magazine_id=eq.${magazine.id}` },
                (payload) => {
                    setComments((prevComments) => [payload.new, ...prevComments]);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [magazine?.id]);

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
                    // Render at higher resolution for quality on all devices
                    // Use device pixel ratio but cap at 3x for quality, minimum 2x for clarity
                    const deviceScale = window.devicePixelRatio || 1;
                    const renderScale = Math.min(3, Math.max(2, deviceScale * 2));
                    const viewport = page.getViewport({ scale: renderScale });
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");

                    if (!context) throw new Error("Could not prepare a magazine page.");

                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    // Enable high quality rendering
                    context.imageSmoothingEnabled = true;
                    context.imageSmoothingQuality = 'high';
                    await page.render({ canvasContext: context, viewport }).promise;
                    renderedPages.push(canvas.toDataURL("image/jpeg", 0.95)); // Higher quality
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

    const zoomPortalRef = React.useRef(null);

    // Close zoom controls when clicking outside
    useEffect(() => {
        if (!showZoomControls) return;
        const handleClickOutside = (e) => {
            const trigger = document.querySelector('[aria-label="Zoom Controls"]');
            if (trigger?.contains(e.target)) return;
            if (zoomPortalRef.current?.contains(e.target)) return;
            setShowZoomControls(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showZoomControls]);

    // Force PageFlip to update on zoom change
    useEffect(() => {
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
    }, [zoom]);

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

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentForm.text.trim() || isSubmittingComment) return;

        // Validate required fields
        if (!commentForm.name.trim()) {
            alert("Please enter your name");
            return;
        }
        if (!commentForm.idNumber.trim()) {
            alert("Please enter your ID number");
            return;
        }
        if (!commentForm.email.trim()) {
            alert("Please enter your email");
            return;
        }
        if (!commentForm.course.trim()) {
            alert("Please enter your course");
            return;
        }
        if (!commentForm.year.trim()) {
            alert("Please enter your year");
            return;
        }

        setIsSubmittingComment(true);

        try {
            const newCommentData = {
                magazine_id: magazine.id,
                user_id: userId,
                user_name: commentForm.name.trim(),
                id_number: commentForm.idNumber.trim(),
                email: commentForm.email.trim(),
                course: commentForm.course.trim(),
                year: commentForm.year.trim(),
                text: commentForm.text.trim()
            };

            const { data, error } = await supabase
                .from("magazine_comments")
                .insert([newCommentData])
                .select()
                .single();

            if (!error && data) {
                setComments([data, ...comments]);
                setCommentForm({ name: "", idNumber: "", email: "", course: "", year: "", text: "" });

                // Record comment analytics event
                await supabase.from("magazine_analytics").insert([
                    { magazine_id: magazine.id, event_type: "comment" }
                ]);
            }
        } catch (err) {
            console.error("Failed to post comment:", err);
            alert("Failed to post comment. Please try again.");
        } finally {
            setIsSubmittingComment(false);
        }
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

                {/* Zoom Bubble - Top Right Collapsible */}
                <div className="relative ml-2 flex-shrink-0">
                    <button
                        onClick={() => setShowZoomControls(!showZoomControls)}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600/50 hover:bg-purple-600 border border-purple-500/30 rounded-full text-white text-sm font-medium transition-all duration-200 shadow-lg"
                        title="Zoom Controls"
                        aria-label="Zoom Controls"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="hidden sm:inline">{Math.round(zoom * 100)}%</span>
                    </button>
                    
                    {/* Zoom Popup */}
                    {showZoomControls && createPortal(
                        <div ref={zoomPortalRef} className="fixed right-4 top-20 w-56 bg-gradient-to-br from-[#241231] to-[#1a0d28] border border-purple-500/30 rounded-xl shadow-2xl p-4 z-[99999] animate-in fade-in-0 zoom-in-95">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-gray-300 text-sm">
                                    <span>Zoom Level</span>
                                    <span className="font-bold text-purple-300">{Math.round(zoom * 100)}%</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={zoomOut}
                                        disabled={zoom <= ZOOM_MIN}
                                        className="flex-1 w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white text-xl font-bold transition-colors"
                                        aria-label="Zoom out"
                                    >
                                        −
                                    </button>
                                    <button
                                        onClick={resetZoom}
                                        className="flex-1 w-10 h-10 flex items-center justify-center bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-bold transition-colors"
                                        aria-label="Reset zoom"
                                    >
                                        100%
                                    </button>
                                    <button
                                        onClick={zoomIn}
                                        disabled={zoom >= ZOOM_MAX}
                                        className="flex-1 w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white text-xl font-bold transition-colors"
                                        aria-label="Zoom in"
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="pt-2 border-t border-purple-500/20">
                                    <p className="text-xs text-gray-400 text-center">
                                        {isMobile ? 'Pinch to zoom' : 'Scroll + Ctrl to zoom'}
                                    </p>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
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
                            minWidth={280}
                            maxWidth={1800}
                            minHeight={408}
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
                                    style={{ 
                                        background: '#2c1052',
                                        imageRendering: 'auto',
                                    }}
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
                                        style={{ 
                                            background: '#2c1052',
                                            imageRendering: 'auto',
                                        }}
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

                    {/* Comments Section - Collapsible */}
                    <div className="border-t border-purple-500/20">
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="w-full p-3 text-left flex items-center justify-between text-gray-300 hover:text-white transition-colors"
                        >
                            <span className="flex items-center gap-2 text-sm font-medium">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Comments ({comments.length})
                            </span>
                            <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${showComments ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ${showComments ? 'max-h-[40vh] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="px-4 py-4 max-h-[40vh] flex flex-col">
                                <div className="space-y-3 overflow-y-auto flex-grow pr-2 max-h-64">
                                    {isLoadingComments ? (
                                        <div className="text-center py-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                                            <p className="text-gray-400 text-sm mt-2">Loading comments...</p>
                                        </div>
                                    ) : comments.length === 0 ? (
                                        <p className="text-gray-400 text-sm text-center py-4">No comments yet. Be the first!</p>
                                    ) : (
                                        comments.map((c) => (
                                            <div
                                                key={c.id}
                                                className="bg-black/20 p-3 rounded-lg border border-purple-500/20"
                                            >
                                                <div className="flex justify-between">
                                                    <div>
                                                        <strong className="text-gray-100">{c.user_name || "Anonymous User"}</strong>
                                                        {c.id_number && <span className="text-xs text-gray-400 ml-2">ID: {c.id_number}</span>}
                                                        {c.course && <span className="text-xs text-gray-400 ml-2">{c.course}</span>}
                                                        {c.year && <span className="text-xs text-gray-400 ml-2">Year {c.year}</span>}
                                                    </div>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(c.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-gray-300 text-sm mt-1">{c.text}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add Comment Form */}
                                <form onSubmit={handleAddComment} className="space-y-3 mt-4 w-full">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Name *</label>
                                            <input
                                                type="text"
                                                value={commentForm.name}
                                                onChange={(e) => setCommentForm({...commentForm, name: e.target.value})}
                                                placeholder="Your name"
                                                className="w-full bg-black/20 border border-purple-500/20 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-600"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">ID Number *</label>
                                            <input
                                                type="text"
                                                value={commentForm.idNumber}
                                                onChange={(e) => setCommentForm({...commentForm, idNumber: e.target.value})}
                                                placeholder="Student/Employee ID"
                                                className="w-full bg-black/20 border border-purple-500/20 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-600"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Email *</label>
                                            <input
                                                type="email"
                                                value={commentForm.email}
                                                onChange={(e) => setCommentForm({...commentForm, email: e.target.value})}
                                                placeholder="your@email.com"
                                                className="w-full bg-black/20 border border-purple-500/20 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-600"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Course *</label>
                                            <input
                                                type="text"
                                                value={commentForm.course}
                                                onChange={(e) => setCommentForm({...commentForm, course: e.target.value})}
                                                placeholder="e.g., BSIT, BSCS, etc."
                                                className="w-full bg-black/20 border border-purple-500/20 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-600"
                                                required
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs text-gray-400 mb-1">Year *</label>
                                            <input
                                                type="text"
                                                value={commentForm.year}
                                                onChange={(e) => setCommentForm({...commentForm, year: e.target.value})}
                                                placeholder="e.g., 1st Year, 2nd Year, etc."
                                                className="w-full bg-black/20 border border-purple-500/20 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-600"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Comment *</label>
                                        <textarea
                                            value={commentForm.text}
                                            onChange={(e) => setCommentForm({...commentForm, text: e.target.value})}
                                            placeholder="Share your thoughts..."
                                            rows={3}
                                            className="w-full bg-black/20 border border-purple-500/20 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-600 resize-none"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingComment}
                                        className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmittingComment ? "Posting..." : "Post Comment"}
                                    </button>
                                </form>
                            </div>
                        </div>
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
