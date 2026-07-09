import React, { useState, useEffect } from "react";
import { hexToRgba } from "../../utils/colorUtils";
import { supabase } from "../../supabaseClient";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as pdfjsLib from 'pdfjs-dist';

// Import worker from node_modules
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

const UploadTab = ({
  formData,
  setFormData,
  editor,
  setEditor,
  handleEditorChange,
  magazines,
  setMagazines,
  pagesDropRef,
  setActiveTab,
}) => {
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  
  // Set up PDF.js worker on component mount
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  }, []);
  
  // Convert PDF to images
  const handlePdfFile = async (file) => {
    setIsProcessingPdf(true);
    
    toast.info("📄 Processing PDF... This may take a moment.", {
      position: "bottom-right",
      autoClose: false,
      toastId: "pdf-processing",
      style: {
        background: "#1F2937",
        color: "#fff",
        borderLeft: "4px solid #3B82F6",
      },
      progressStyle: {
        background: "#3B82F6",
      },
      icon: "⏳",
    });

    try {
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      console.log("PDF file loaded, size:", arrayBuffer.byteLength);
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      console.log("PDF loaded successfully, pages:", numPages);
      
      const uploadedPages = [];
      let coverUrl = null;
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        console.log(`Processing page ${pageNum}/${numPages}...`);
        
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        console.log(`Page ${pageNum} rendered to canvas`);
        
        // Convert canvas to blob
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          }, 'image/jpeg', 0.95);
        });
        
        console.log(`Page ${pageNum} converted to blob, size:`, blob.size);
        
        // First page goes to covers folder, rest to pages folder
        const folderName = pageNum === 1 ? 'covers' : 'pages';
        const timestamp = Date.now();
        const fileName = `${folderName}/${timestamp}-page-${pageNum}.jpg`;
        
        console.log(`Uploading ${fileName}...`);
        
        const { error } = await supabase.storage
          .from("magazines")
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) {
          console.error(`Error uploading page ${pageNum}:`, error);
          throw new Error(`Failed to upload page ${pageNum}: ${error.message}`);
        }
        
        const { data } = supabase.storage.from("magazines").getPublicUrl(fileName);
        
        console.log(`Page ${pageNum} uploaded successfully:`, data.publicUrl);
        
        // First page becomes the cover
        if (pageNum === 1) {
          coverUrl = data.publicUrl;
        } else {
          // Pages 2+ become magazine pages
          uploadedPages.push(data.publicUrl);
        }
      }
      
      // Update form data with cover and pages
      setFormData((p) => ({ 
        ...p, 
        cover: coverUrl || p.cover,
        pages: [...p.pages, ...uploadedPages] 
      }));
      
      toast.dismiss("pdf-processing");
      toast.success(`✅ PDF processed! Cover set + ${uploadedPages.length} pages uploaded!`, {
        position: "bottom-right",
        style: {
          background: "#1F2937",
          color: "#fff",
          borderLeft: "4px solid #10B981",
        },
        progressStyle: {
          background: "#10B981",
        },
        icon: "🎯",
      });
      
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast.dismiss("pdf-processing");
      
      let errorMessage = "Failed to process PDF. Please try again.";
      
      if (error.message) {
        if (error.message.includes('Invalid PDF')) {
          errorMessage = "Invalid PDF file. Please check the file and try again.";
        } else if (error.message.includes('upload')) {
          errorMessage = "Failed to upload PDF pages. Check storage permissions.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast.error(`❌ ${errorMessage}`, {
        position: "bottom-right",
        style: {
          background: "#1F2937",
          color: "#fff",
          borderLeft: "4px solid #EF4444",
        },
        progressStyle: {
          background: "#EF4444",
        },
        icon: "⚠️",
      });
    } finally {
      setIsProcessingPdf(false);
    }
  };
  
  // Upload cover to Supabase Storage
  const handleCoverFile = async (file) => {
    const fileName = `covers/${Date.now()}-${file.name}`;
    try {
      const { error } = await supabase.storage
        .from("magazines")
        .upload(fileName, file, { upsert: false });
      if (error) {
        throw error;
      }
      const { data } = supabase.storage.from("magazines").getPublicUrl(fileName);
      setFormData((p) => ({ ...p, cover: data.publicUrl }));
      toast.success("✅ Cover uploaded successfully!", {
        position: "bottom-right",
        style: {
          background: "#1F2937",
          color: "#fff",
          borderLeft: "4px solid #10B981",
        },
        progressStyle: {
          background: "#10B981",
        },
        icon: "🎯",
      });
    } catch (error) {
      console.error("Error uploading cover:", error);
      toast.error("❌ Failed to upload cover image. Check bucket name and permissions.", {
        position: "bottom-right",
        style: {
          background: "#1F2937",
          color: "#fff",
          borderLeft: "4px solid #EF4444",
        },
        progressStyle: {
          background: "#EF4444",
        },
        icon: "⚠️",
      });
    }
  };

  // Upload multiple pages
  const handlePagesFiles = async (files) => {
    const urls = [];
    for (let file of files) {
      const fileName = `pages/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("magazines")
        .upload(fileName, file);

      if (error) {
        console.error("Error uploading page:", error);
        continue;
      }

      const { data } = supabase.storage.from("magazines").getPublicUrl(fileName);

      urls.push(data.publicUrl);
    }

    setFormData((p) => ({ ...p, pages: [...p.pages, ...urls] }));

    // ✅ Success notification
    if (urls.length > 0) {
      toast.success(`✅ ${urls.length} page(s) uploaded successfully!`, {
        position: "bottom-right",
        style: {
          background: "#1F2937",
          color: "#fff",
          borderLeft: "4px solid #10B981",
        },
        progressStyle: {
          background: "#10B981",
        },
        icon: "🎯",
      });
    }
  };

  // Remove page
  const removePage = (index) => {
    setFormData((p) => ({
      ...p,
      pages: p.pages.filter((_, i) => i !== index),
    }));
  };

  // Clear all pages
  const clearPages = () => {
    setFormData((p) => ({ ...p, pages: [] }));
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      title: "",
      subtitle: "",
      cover: "",
      pages: [],
      published: false,
    });
  };

  // Upload magazine to Supabase DB
  const handleUpload = async (e) => {
    e.preventDefault();

    // ⚠️ Warn if not published — ask for confirmation
    if (!formData.published) {
      setShowDraftModal(true);
      return;
    }

    await submitMagazine();
  };

  const handleDraftConfirm = async () => {
    setShowDraftModal(false);
    await submitMagazine();
  };

  const submitMagazine = async () => {

    // Validate required fields
    if (!formData.title.trim()) {
      toast.warning("⚠️ Please enter a title.", {
        position: "bottom-right",
        style: {
          background: "#1F2937",
          color: "#fff",
          borderLeft: "4px solid #F59E0B",
        },
        progressStyle: {
          background: "#F59E0B",
        },
        icon: "📝",
      });
      return;
    }
    if (!formData.cover) {
      toast.warning("⚠️ Please upload a cover image.", {
        position: "bottom-right",
        style: {
          background: "#1F2937",
          color: "#fff",
          borderLeft: "4px solid #F59E0B",
        },
        progressStyle: {
          background: "#F59E0B",
        },
        icon: "📝",
      });
      return;
    }

    const { data, error } = await supabase
      .from("magazines")
      .insert([
        {
          title: formData.title,
          subtitle: formData.subtitle,
          cover: formData.cover,
          pages: formData.pages,
          published: formData.published,
          editor: editor,
          created_at: new Date(),
        },
      ])
      .select();

    if (error) {
      console.error("Error saving magazine:", error);
      toast.error("❌ Failed to upload magazine. Please try again.", {
        position: "bottom-right",
        style: {
          background: "#1F2937",
          color: "#fff",
          borderLeft: "4px solid #EF4444",
        },
        progressStyle: {
          background: "#EF4444",
        },
        icon: "⚠️",
      });
      return;
    }

    // Add to state list
    setMagazines((prev) => [...prev, ...data]);
    handleReset();

    // ✅ Success notification with custom toast
    const message = formData.published
      ? "🎉 Magazine published successfully!"
      : "✅ Magazine saved as draft!";

    setSuccessMessage(message);
    setShowSuccessToast(true);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
  };

  // Delete magazine
  const removeMagazine = async (id) => {
    const { error } = await supabase.from("magazines").delete().eq("id", id);

    if (error) {
      console.error("Error deleting magazine:", error);
      toast.error("❌ Failed to delete magazine.", {
        position: "bottom-right",
        style: {
          background: "#1F2937",
          color: "#fff",
          borderLeft: "4px solid #EF4444",
        },
        progressStyle: {
          background: "#EF4444",
        },
        icon: "⚠️",
      });
      return;
    }

    setMagazines((prev) => prev.filter((m) => m.id !== id));
    toast.info("🗑️ Magazine deleted successfully!", {
      position: "bottom-right",
      style: {
        background: "#1F2937",
        color: "#fff",
        borderLeft: "4px solid #3B82F6",
      },
      progressStyle: {
        background: "#3B82F6",
      },
      icon: "ℹ️",
    });
  };


  return (
    <div className="h-screen overflow-hidden p-6">
      {/* Draft Confirmation Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700 shadow-2xl"
            style={{
              animation: "bounceIn 0.3s ease-out"
            }}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Save as Draft?</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                You haven't selected 'Publish Immediately'. This magazine will be saved as a draft and won't be visible to readers.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDraftModal(false)}
                  className="px-6 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDraftConfirm}
                  className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div
          className="fixed bottom-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm border border-green-400/20"
          style={{
            animation: "bounceIn 0.4s ease-out"
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold">{successMessage}</div>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/40 rounded-full"
              style={{
                animation: "progress 3s linear"
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Magazine Upload</h1>
        <p className="text-gray-400">Create and publish your magazine with professional tools</p>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
        {/* Left: Upload Form - Takes 4 columns */}
        <div className="col-span-4 overflow-y-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Magazine Details</h2>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    name="title"
                    placeholder="Spring Fashion 2024"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subtitle
                  </label>
                  <input
                    name="subtitle"
                    placeholder="The Ultimate Style Guide"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, subtitle: e.target.value }))
                    }
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Cover Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-300">Cover Image *</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="coverUrl"
                    placeholder="Paste image URL"
                    value={
                      typeof formData.cover === "string" &&
                        formData.cover.startsWith("data:")
                        ? ""
                        : formData.cover
                    }
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, cover: e.target.value }))
                    }
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                  />
                  <label className="cursor-pointer">
                    <div className="bg-gray-900/30 border border-dashed border-gray-600 rounded-lg p-2 text-center hover:border-purple-500 hover:bg-gray-900/50 transition-all group h-full flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-xs text-gray-300">Upload</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await handleCoverFile(file);
                        }}
                        className="sr-only"
                      />
                    </div>
                  </label>
                </div>
              </div>

              {/* Pages Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-300">Magazine Pages</label>
                <div
                  ref={pagesDropRef}
                  className="bg-gray-900/30 border-2 border-dashed border-gray-600 rounded-lg p-4 min-h-[80px] flex flex-col items-center justify-center gap-2 hover:border-purple-500 hover:bg-gray-900/50 transition-all group"
                >
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-gray-300 text-xs text-center">Drop pages or browse</p>
                  <div className="flex gap-2">
                    <label className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded text-xs font-medium cursor-pointer hover:bg-purple-600/30 transition-colors">
                      Choose Images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (files && files.length > 0)
                            await handlePagesFiles(files);
                        }}
                        className="sr-only"
                      />
                    </label>
                    <label className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded text-xs font-medium cursor-pointer hover:bg-blue-600/30 transition-colors">
                      Upload PDF
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await handlePdfFile(file);
                        }}
                        className="sr-only"
                        disabled={isProcessingPdf}
                      />
                    </label>
                  </div>
                </div>


                {/* Page Thumbnails */}
                {formData.pages.length > 0 && (
                  <div className="mt-2 p-2 bg-gray-900/20 rounded-lg border border-gray-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        <span className="text-xs text-gray-300 font-medium">
                          {formData.pages.length} Page{formData.pages.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={clearPages}
                        className="text-xs text-red-400 hover:text-red-300 px-1 py-0.5 rounded hover:bg-red-400/10 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="grid grid-cols-8 gap-1 max-h-24 overflow-y-auto">
                      {formData.pages.map((page, i) => (
                        <div key={i} className="relative group">
                          <div className="aspect-[3/4] rounded overflow-hidden border border-gray-600">
                            <img
                              src={page}
                              alt={`page-${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removePage(i)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Publishing Options */}
              <div className="p-3 bg-gray-900/20 rounded-lg border border-gray-700/50">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    name="published"
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, published: e.target.checked }))
                    }
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-1"
                  />
                  <div className="flex-1">
                    <span className="text-gray-200 text-sm font-medium group-hover:text-white transition-colors">
                      Publish immediately
                    </span>
                    <p className="text-gray-500 text-xs">
                      {formData.published ? "Visible to readers" : "Save as draft"}
                    </p>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {formData.published ? 'Publish' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all text-sm"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Middle: Style Editor - Takes 4 columns */}
        <div className="col-span-4 overflow-y-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Style Editor</h3>
            </div>

            <div className="space-y-4">
              {/* Image Filters */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-gray-300 mb-2">Image Adjustments</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "brightness", label: "Brightness", unit: "%", min: 50, max: 150 },
                    { name: "contrast", label: "Contrast", unit: "%", min: 50, max: 150 },
                    { name: "saturate", label: "Saturation", unit: "%", min: 50, max: 200 },
                    { name: "hue", label: "Hue Rotation", unit: "°", min: 0, max: 360 },
                  ].map((filter) => (
                    <div key={filter.name} className="space-y-1">
                      <label className="flex justify-between text-xs">
                        <span className="text-gray-300">{filter.label}</span>
                        <span className="text-purple-400 font-medium">
                          {editor[filter.name]}{filter.unit}
                        </span>
                      </label>
                      <input
                        type="range"
                        min={filter.min}
                        max={filter.max}
                        name={filter.name}
                        value={editor[filter.name]}
                        onChange={handleEditorChange}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((editor[filter.name] - filter.min) / (filter.max - filter.min)) * 100}%, #374151 ${((editor[filter.name] - filter.min) / (filter.max - filter.min)) * 100}%, #374151 100%)`
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Customization */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-gray-300 mb-2">Color Customization</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300">Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        name="accentColor"
                        value={editor.accentColor}
                        onChange={handleEditorChange}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-600"
                      />
                      <div className="text-xs text-gray-400 font-mono">
                        {editor.accentColor}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300">Title Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        name="titleColor"
                        value={editor.titleColor}
                        onChange={handleEditorChange}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-600"
                      />
                      <div className="text-xs text-gray-400 font-mono">
                        {editor.titleColor}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Publishing Status */}
              <div className="bg-gray-900/30 rounded-lg p-3 border border-gray-700/50">
                <h4 className="text-xs font-medium text-gray-300 mb-2">Publishing Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Status</span>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${formData.published
                      ? "bg-green-400/20 text-green-400"
                      : "bg-yellow-400/20 text-yellow-400"
                      }`}>
                      {formData.published ? "Live" : "Draft"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${formData.title ? "bg-green-400" : "bg-red-400"}`}></div>
                      <span className="text-gray-400">Title</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${formData.cover ? "bg-green-400" : "bg-red-400"}`}></div>
                      <span className="text-gray-400">Cover</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${formData.pages.length > 0 ? "bg-green-400" : "bg-yellow-400"}`}></div>
                      <span className="text-gray-400">Pages ({formData.pages.length})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                      <span className="text-gray-400">Systems</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview - Takes 4 columns */}
        <div className="col-span-4 overflow-y-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Live Preview</h3>
            </div>

            <div className="space-y-6">
              {/* Cover Preview */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Cover Design</h4>
                <div className="bg-gray-900/30 p-6 rounded-xl">
                  {formData.cover ? (
                    <div className="relative w-40 h-52 mx-auto rounded-lg overflow-hidden shadow-xl border border-gray-600">
                      <img
                        src={formData.cover}
                        alt="cover-preview"
                        className="w-full h-full object-cover transition-all duration-300"
                        style={{
                          filter: `brightness(${editor.brightness}%) contrast(${editor.contrast}%) saturate(${editor.saturate}%) hue-rotate(${editor.hue}deg)`,
                        }}
                      />
                      <div
                        className="absolute bottom-0 left-0 right-0 p-4"
                        style={{ background: hexToRgba(editor.accentColor, 0.9) }}
                      >
                        <h2
                          className="font-bold text-lg leading-tight"
                          style={{ color: editor.titleColor }}
                        >
                          {formData.title || "Magazine Title"}
                        </h2>
                        {formData.subtitle && (
                          <p
                            className="text-sm opacity-90 mt-1"
                            style={{ color: editor.titleColor }}
                          >
                            {formData.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-40 h-52 mx-auto border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500">
                      <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-center text-sm">Upload cover to preview</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pages Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-300">Pages Overview</h4>
                  <span className="text-xs text-gray-500 bg-gray-700 px-3 py-1 rounded-full">
                    {formData.pages.length} page{formData.pages.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="bg-gray-900/30 p-4 rounded-xl min-h-[180px]">
                  {formData.pages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                      <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm">No pages added yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
                      {formData.pages.map((page, i) => (
                        <div key={i} className="relative group">
                          <div className="aspect-[3/4] rounded overflow-hidden border border-gray-600 hover:border-gray-500 transition-colors">
                            <img
                              src={page}
                              alt={`page-${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute bottom-1 left-1 bg-black/80 text-white text-xs px-2 py-1 rounded">
                            {i + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadTab;

/* CSS Animations */
const styles = `
@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(-50px);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes progress {
  0% {
    width: 100%;
  }
  100% {
    width: 0%;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
