// src/pages/Contact.js
import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const Contact = () => {
  // State for form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState(""); // "success", "error", ""
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus("error");
      setLoading(false);
      return;
    }

    // Insert feedback into Supabase
    const { error } = await supabase.from("feedback").insert([
      {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      },
    ]);

    if (error) {
      setStatus("error");
      setLoading(false);
      return;
    }

    setStatus("success");
    setLoading(false);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0c10] via-[#1b0b28] to-[#071030] text-gray-200 pt-20">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 px-6 py-16 max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center transform hover:rotate-6 transition-transform duration-300 shadow-lg shadow-purple-500/50">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
            Contact Us
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mb-8 rounded-full"></div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Connect with The VIBE Club. We'd love to hear from you about submissions, collaborations, or any inquiries.
          </p>
        </div>

        {/* Team Members */}
        <div className="bg-purple-900/20 backdrop-blur-sm rounded-3xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 p-8 md:p-10 mb-12 hover:border-purple-500/50 hover:shadow-purple-500/20 transition-all duration-500">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300 shadow-md shadow-purple-500/50">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Editorial Team</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Faculty Advisor - Dr. Alan Reyes */}
            <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-8 text-center border border-purple-500/20 hover:border-purple-500/40 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-500 group">
              <div className="relative mb-6">
                <img
                  src="https://ui-avatars.com/api/?name=Alan+Reyes&size=128&background=6366f1&color=fff&rounded=true&bold=true"
                  alt="Dr. Alan Reyes"
                  className="w-28 h-28 rounded-full object-cover mx-auto border-4 border-purple-500 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/50"
                />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-white font-bold text-2xl mb-2">N/A</h3>
              <p className="text-purple-300 font-semibold mb-2">Faculty Advisor</p>
              <p className="text-gray-400 mb-4">Department of Computer Science</p>
              <a
                href="mailto:alan.reyes@university.edu"
                className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200 group/link">
                <svg className="w-5 h-5 group-hover/link:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span>Contact</span>
              </a>
            </div>

            {/* Student Editor - Sophia Kim */}
            <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-8 text-center border border-purple-500/20 hover:border-purple-500/40 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-500 group">
              <div className="relative mb-6">
                <img
                  src="https://ui-avatars.com/api/?name=Sophia+Kim&size=128&background=ec4899&color=fff&rounded=true&bold=true"
                  alt="Sophia Kim"
                  className="w-28 h-28 rounded-full object-cover mx-auto border-4 border-pink-500 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-pink-500/50"
                />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/50">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-white font-bold text-2xl mb-2">N/A</h3>
              <p className="text-purple-300 font-semibold mb-2">Editor-in-Chief</p>
              <p className="text-gray-400 mb-4">Class of 2025</p>
              <a
                href="mailto:sophia.kim@university.edu"
                className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200 group/link"
              >
                <svg className="w-5 h-5 group-hover/link:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span>Contact</span>
              </a>
            </div>
          </div>
        </div>

        {/* University Information */}
        <div className="bg-purple-900/20 backdrop-blur-sm rounded-3xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 p-8 md:p-10 mb-12 hover:border-purple-500/50 hover:shadow-purple-500/20 transition-all duration-500">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300 shadow-md shadow-orange-500/50">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Visit Our Campus</h2>
          </div>

          <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-500">
            <div className="flex items-start space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-3">Department of Digital Innovation</h3>
                <p 
                  className="text-gray-300 text-lg leading-relaxed cursor-pointer hover:text-white transition-colors duration-200"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Department of Digital Innovation\nUniversity of the Immaculate Conception\nFather Selga Avenue, Davao City 8000\nPhilippines`
                    ).then(() => alert("Address copied to clipboard!"));
                  }}
                  title="Click to copy address"
                >
                  <strong>University of the Immaculate Conception</strong><br />
                  Father Selga Avenue, Davao City 8000<br />
                  Philippines
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Google Map */}
        <div className="bg-purple-900/20 backdrop-blur-sm rounded-3xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 p-8 md:p-10 mb-12 hover:border-purple-500/50 hover:shadow-purple-500/20 transition-all duration-500">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300 shadow-md shadow-green-500/50">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Find Us</h2>
          </div>

          <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-3 border border-purple-500/30 shadow-lg shadow-purple-500/10">
            <div className="overflow-hidden rounded-lg aspect-video">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d29324.91588788938!2d125.56409871083981!3d7.069941700000025!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32f96d7040fea619%3A0xc5edd89e649e05b0!2sUniversity%20of%20the%20Immaculate%20Conception%20-%20Main!5e1!3m2!1sen!2sph!4v1756817726593!5m2!1sen!2sph"
                width="600"
                height="450"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="University of the Immaculate Conception - Main Campus"
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Office Hours */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 hover:border-purple-500/40 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-500 group">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-300 flex-shrink-0 shadow-lg shadow-blue-500/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-3">Office Hours</h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  <strong className="text-white">Monday–Friday</strong><br />
                  9:00 AM – 4:00 PM<br />
                  <span className="text-gray-400 text-base italic">Drop-in at Innovation Lab, Room 305</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 hover:border-purple-500/40 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-500 group">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-300 flex-shrink-0 shadow-lg shadow-purple-500/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-3">Quick Contact</h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  <strong className="text-white">Emergency Contact</strong><br />
                  Available during office hours<br />
                  <span className="text-gray-400 text-base italic">For urgent editorial matters</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Form */}
        <div className="bg-purple-900/20 backdrop-blur-sm rounded-3xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 p-8 md:p-10 hover:border-purple-500/50 hover:shadow-purple-500/20 transition-all duration-500">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300 shadow-md shadow-purple-500/50">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Send Us Feedback</h2>
          </div>

          {status === "success" && (
            <div className="mb-8 p-5 bg-green-900/30 backdrop-blur-sm border border-green-500/40 rounded-2xl text-green-300 shadow-lg shadow-green-500/10">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md shadow-green-500/50">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <span className="text-base">Thank you! Your message has been sent successfully.</span>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="mb-8 p-5 bg-red-900/30 backdrop-blur-sm border border-red-500/40 rounded-2xl text-red-300 shadow-lg shadow-red-500/10">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md shadow-red-500/50">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <span className="text-base">Please fill in all required fields.</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-purple-950/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 transition-all duration-300 hover:border-purple-500/50"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-purple-950/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 transition-all duration-300 hover:border-purple-500/50"
                placeholder="you@university.edu"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-purple-950/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 transition-all duration-300 hover:border-purple-500/50"
                placeholder="Feedback, Inquiry, etc."
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-purple-950/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 resize-none transition-all duration-300 hover:border-purple-500/50"
                placeholder="Type your message here..."
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 px-10 rounded-xl font-bold text-lg transition-all duration-500 relative overflow-hidden group
                ${loading 
                  ? "bg-gray-600 cursor-not-allowed" 
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-105"
                } text-white shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 border border-purple-500/30`}
            >
              {!loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              )}
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : "Send Message"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Contact;