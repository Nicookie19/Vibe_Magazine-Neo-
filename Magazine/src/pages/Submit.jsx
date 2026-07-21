// src/pages/Submit.js
import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const Submit = () => {
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    student_email: "",
    student_id: "",
    title_of_work: "",
    course_program: "",
    category: "Design Project",
    abstract: "",
    file: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setForm({ ...form, file: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowErrorPopup(false);
    setLoading(true);
    try {
      if (!form.file) {
        setError("Please select a file.");
        setShowErrorPopup(true);
        setLoading(false);
        return;
      }
      if (form.file.type !== "application/pdf") {
        setError("Only PDF files are allowed.");
        setShowErrorPopup(true);
        setLoading(false);
        return;
      }
      // Check file size (20MB = 20 * 1024 * 1024 bytes)
      const maxSize = 20 * 1024 * 1024;
      if (form.file.size > maxSize) {
        setError("File size exceeds 20MB. Please upload a smaller file.");
        setShowErrorPopup(true);
        setLoading(false);
        return;
      }

      // Upload file to storage bucket
      const file = form.file;
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("student-submissions") // ✅ bucket name
        .upload(fileName, file);

      if (uploadError) throw new Error("Storage error: " + uploadError.message);

      // Get public URL
      const { data: publicUrlData, error: urlError } = supabase.storage
        .from("student-submissions")
        .getPublicUrl(fileName);

      if (urlError) throw new Error("URL error: " + urlError.message);
      const file_url = publicUrlData.publicUrl;

      // Insert into submissions table
      const { error: dbError } = await supabase.from("submissions").insert([
        {
          full_name: form.full_name,
          student_email: form.student_email,
          student_id: form.student_id,
          title_of_work: form.title_of_work,
          course_program: form.course_program,
          category: form.category,
          abstract: form.abstract,
          file_url,
          status: "Pending",
          submitted_at: new Date().toISOString(),
        },
      ]);

      if (dbError) throw new Error("DB error: " + dbError.message);

      setSuccess(true);
      setForm({
        full_name: "",
        student_email: "",
        student_id: "",
        title_of_work: "",
        course_program: "",
        category: "Design Project",
        abstract: "",
        file: null,
      });
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.");
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0c10] via-[#1b0b28] to-[#071030] text-gray-200 pt-20">
      {/* Error Popup Modal */}
      {showErrorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowErrorPopup(false)}
          ></div>
          
          {/* Popup Content */}
          <div className="relative bg-gradient-to-br from-red-900/90 to-red-950/90 backdrop-blur-md rounded-3xl border-2 border-red-500/50 shadow-2xl shadow-red-500/30 p-8 max-w-md w-full animate-slideIn">
            {/* Close Button */}
            <button
              onClick={() => setShowErrorPopup(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-red-500/50">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
            </div>

            {/* Error Title */}
            <h3 className="text-3xl font-bold text-white text-center mb-4">
              Oops! Error
            </h3>

            {/* Error Message */}
            <p className="text-red-200 text-center text-lg mb-8 leading-relaxed">
              {error}
            </p>

            {/* Close Button */}
            <button
              onClick={() => setShowErrorPopup(false)}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-red-500/50"
            >
              Got It!
            </button>
          </div>
        </div>
      )}

      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 px-6 py-16 max-w-5xl mx-auto">

        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center transform hover:rotate-6 transition-transform duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
            Submit Your Work
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mb-8 rounded-full"></div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Share your creativity with the university community. Submit your project and inspire others with your innovative work.
          </p>
        </div>



        {/* Submission Guidelines */}
        <div className="bg-purple-900/20 backdrop-blur-sm rounded-3xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 p-8 md:p-10 mb-12 hover:border-purple-500/50 hover:shadow-purple-500/20 transition-all duration-500">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Submission Guidelines</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-500 group">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform duration-300 shadow-lg shadow-green-500/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">File Format</h3>
              <p className="text-gray-300 leading-relaxed">
                Only <strong className="text-white">PDF files</strong> are accepted. Maximum file size is <strong className="text-emerald-300">20MB</strong>.
              </p>
            </div>

            <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-500 group">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform duration-300 shadow-lg shadow-orange-500/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Review Time</h3>
              <p className="text-gray-300 leading-relaxed">
                Editorial team will review your submission within <strong className="text-white">1 week</strong> of submission.
              </p>
            </div>

            <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-500 group">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform duration-300 shadow-lg shadow-purple-500/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Categories</h3>
              <p className="text-gray-300 leading-relaxed">
                Choose from <strong className="text-white">Design Projects</strong>, <strong className="text-white">Literary Works</strong>, <strong className="text-white">Data Visualization</strong>, or <strong className="text-white">Other</strong>.
              </p>
            </div>
          </div>
        </div>        {/* Success Message */}
        {success && (
          <div className="bg-green-900/20 backdrop-blur-sm rounded-3xl border border-green-500/30 shadow-2xl shadow-green-500/10 p-10 mb-12 hover:border-green-500/50 hover:shadow-green-500/20 transition-all duration-500">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-lg shadow-green-500/50">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-4">
                🎉 Submission Successful!
              </h2>
              <p className="text-gray-300 text-lg mb-6 max-w-xl mx-auto leading-relaxed">
                Your work has been received and will be reviewed by our editorial team within 1 week.
              </p>
              <div className="bg-green-900/30 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 mb-8 max-w-xl mx-auto">
                <p className="text-green-300 font-semibold mb-3 text-lg">🚀 What happens next?</p>
                <ul className="text-gray-300 space-y-2 text-left">
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span>Editorial review within 1 week</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span>Notification via email about your submission status</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span>Featured in the magazine if approved</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => setSuccess(false)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/50"
              >
                Submit Another Work
              </button>
            </div>
          </div>
        )}

        {/* Submission Form */}
        {!success && (
          <div className="bg-purple-900/20 backdrop-blur-sm rounded-3xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 p-8 md:p-10 hover:border-purple-500/50 hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white">Submission Form</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8" encType="multipart/form-data">
              {/* Personal Information Section */}
              <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-500">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/50">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <span>Personal Information</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-white mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-purple-950/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 transition-all duration-300 hover:border-purple-500/50"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="student_id" className="block text-sm font-medium text-white mb-2">
                      Student ID *
                    </label>
                    <input
                      type="text"
                      id="student_id"
                      name="student_id"
                      value={form.student_id}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-purple-950/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 transition-all duration-300 hover:border-purple-500/50"
                      placeholder="e.g., 20230001"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="student_email" className="block text-sm font-medium text-white mb-2">
                    Student Email *
                  </label>
                  <input
                    type="email"
                    id="student_email"
                    name="student_email"
                    value={form.student_email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-purple-950/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 transition-all duration-300 hover:border-purple-500/50"
                    placeholder="you@university.edu"
                  />
                </div>
              </div>

              {/* Project Information Section */}
              <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-500">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/50">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                    </svg>
                  </div>
                  <span>Project Details</span>
                </h3>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="title_of_work" className="block text-sm font-medium text-white mb-2">
                      Title of Work *
                    </label>
                    <input
                      type="text"
                      id="title_of_work"
                      name="title_of_work"
                      value={form.title_of_work}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-purple-950/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 transition-all duration-300 hover:border-purple-500/50"
                      placeholder="Enter the title of your work"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="course_program" className="block text-sm font-medium text-white mb-2">
                        Course / Program
                      </label>
                      <input
                        type="text"
                        id="course_program"
                        name="course_program"
                        value={form.course_program}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-purple-950/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 transition-all duration-300 hover:border-purple-500/50"
                        placeholder="e.g., CS 490, Digital Media"
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-white mb-2">
                        Category *
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-purple-950/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white transition-all duration-300 hover:border-purple-500/50"
                      >
                        <option value="Design Project">Design Project</option>
                        <option value="Literary Work">Literary Work</option>
                        <option value="Data Visualization">Data Visualization</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="abstract" className="block text-sm font-medium text-white mb-2">
                      Abstract / Description *
                    </label>
                    <textarea
                      id="abstract"
                      name="abstract"
                      rows="5"
                      value={form.abstract}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-purple-950/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 resize-none transition-all duration-300 hover:border-purple-500/50"
                      placeholder="Briefly describe your project, its significance, methodology, and key findings or outcomes..."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-500">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md shadow-green-500/50">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                  </div>
                  <span>File Upload</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="file" className="block text-sm font-medium text-white mb-2">
                      Upload PDF File (Max 20MB) *
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="file"
                        name="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file && file.type !== "application/pdf") {
                            setError("Only PDF files are allowed.");
                            setShowErrorPopup(true);
                            e.target.value = null;
                            setForm((f) => ({ ...f, file: null }));
                          } else if (file && file.size > 20 * 1024 * 1024) {
                            setError("File size exceeds 20MB. Please upload a smaller file.");
                            setShowErrorPopup(true);
                            e.target.value = null;
                            setForm((f) => ({ ...f, file: null }));
                          } else {
                            setError("");
                            setShowErrorPopup(false);
                            setForm((f) => ({ ...f, file }));
                          }
                        }}
                        required
                        className="w-full px-4 py-3 bg-purple-950/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-500 file:to-pink-500 file:text-white hover:file:from-purple-600 hover:file:to-pink-600 transition-all duration-300 hover:border-purple-500/50 cursor-pointer"
                      />
                    </div>
                    <p className="text-sm text-gray-400 mt-2 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span>Only PDF files are accepted. Maximum file size: 20MB</span>
                    </p>
                  </div>

                  {form.file && (
                    <div className="bg-green-900/30 backdrop-blur-sm rounded-xl p-5 border border-green-500/40 shadow-lg shadow-green-500/10">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-green-500/50">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-green-300 font-semibold truncate">{form.file.name}</p>
                          <p className="text-gray-400 text-sm">{(form.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`relative px-10 py-5 rounded-xl font-bold text-lg transition-all duration-500 text-white shadow-2xl border border-purple-500/30 overflow-hidden group
                    ${loading 
                      ? "bg-gray-600 cursor-not-allowed opacity-60" 
                      : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-105 hover:shadow-purple-500/50"
                    }`}
                >
                  {!loading && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </>
                  )}
                  
                  {loading ? (
                    <span className="flex items-center justify-center space-x-3 relative z-10">
                      <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Submitting Your Work...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center space-x-3 relative z-10">
                      <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <span>Submit for Review</span>
                      <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Submit;
