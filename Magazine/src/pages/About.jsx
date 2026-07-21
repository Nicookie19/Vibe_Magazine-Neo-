// src/pages/About.js
import React from "react";

const About = () => {
  const features = [
    {
      title: "Digital Skills Training",
      description: "Expert-led sessions in SEO, photography, videography, and content creation",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
      ),
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Innovation & Entrepreneurship",
      description: "Supporting student innovation and social impact initiatives",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      ),
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Campus Engagement",
      description: "Enhancing UIC's virtual presence and community connection",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
        </svg>
      ),
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Collaborative Growth",
      description: "Working with UCO for Publicity and campus organizations",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
        </svg>
      ),
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0c10] via-[#1b0b28] to-[#071030] text-gray-200">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 px-6 py-24 max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl mb-6 shadow-2xl shadow-purple-500/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-pink-400">Campus Insights</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
            The VIBE Club Information Hub
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-violet-600 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Main Description Card */}
        <div className="mb-16">
          <div className="bg-black/30 backdrop-blur-sm rounded-3xl border border-purple-500/30 shadow-2xl p-8 md:p-12 hover:border-purple-500/50 transition-all duration-500">
            <p className="text-gray-300 leading-relaxed text-lg md:text-xl">
              <strong className="text-white font-semibold">Campus Insights</strong> highlights the role of emerging digital technologies in shaping how The VIBE Club connects with its audience. As a content creation group at the University of the Immaculate Conception (UIC), The VIBE Club faces challenges in maintaining a consistent online presence and staying current with digital trends.
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Our Mission</h2>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-3xl border border-purple-500/30 shadow-2xl p-8 md:p-12 hover:border-purple-500/50 transition-all duration-500">
            <p className="text-gray-300 leading-relaxed text-lg md:text-xl">
              To support growth and innovation, The VIBE Club offers expert-led trainings each semester in areas like SEO, digital and mobile photography, videography, content creation, article writing, and AI prompting. These sessions aim to equip members with essential digital communication skills. Beyond personal development, we are committed to promoting entrepreneurship, innovation, and social impact in line with the TBI.
            </p>
          </div>
        </div>

        {/* What We Do - Features Grid */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">What We Do</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-violet-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="group bg-black/30 backdrop-blur-sm rounded-2xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-500 p-8 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02]">
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed text-base md:text-lg">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editorial Board Section */}
        <div>
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Editorial Board</h2>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-violet-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Dr. Alan Reyes */}
            <div className="group bg-black/30 backdrop-blur-sm rounded-2xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-500 p-6 text-center hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-105">
              <div className="relative mb-5 inline-block">
                <img
                  src="https://ui-avatars.com/api/?name=Alan+Reyes&size=128&background=6366f1&color=fff&rounded=true&bold=true"
                  alt="N/A"
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-purple-500 group-hover:border-purple-400 transition-all duration-300 shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mb-2 group-hover:text-purple-300 transition-colors duration-300">N/A</h3>
              <p className="text-purple-400 text-sm font-semibold mb-1">Faculty Advisor</p>
              <p className="text-gray-500 text-xs">Computer Science</p>
            </div>

            {/* Sophia Kim */}
            <div className="group bg-black/30 backdrop-blur-sm rounded-2xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-500 p-6 text-center hover:shadow-2xl hover:shadow-pink-500/20 hover:scale-105">
              <div className="relative mb-5 inline-block">
                <img
                  src="https://ui-avatars.com/api/?name=Sophia+Kim&size=128&background=ec4899&color=fff&rounded=true&bold=true"
                  alt="N/A"
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-pink-500 group-hover:border-pink-400 transition-all duration-300 shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mb-2 group-hover:text-pink-300 transition-colors duration-300">N/A</h3>
              <p className="text-pink-400 text-sm font-semibold mb-1">Editor-in-Chief</p>
              <p className="text-gray-500 text-xs">Class of 2025</p>
            </div>

            {/* Jamal Wright */}
            <div className="group bg-black/30 backdrop-blur-sm rounded-2xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-500 p-6 text-center hover:shadow-2xl hover:shadow-green-500/20 hover:scale-105">
              <div className="relative mb-5 inline-block">
                <img
                  src="https://ui-avatars.com/api/?name=Jamal+Wright&size=128&background=10b981&color=fff&rounded=true&bold=true"
                  alt="Jamal Wright"
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-green-500 group-hover:border-green-400 transition-all duration-300 shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2zM9 9h4l-2 2 2 2H9V9z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mb-2 group-hover:text-green-300 transition-colors duration-300">N/A</h3>
              <p className="text-green-400 text-sm font-semibold mb-1">Design Lead</p>
              <p className="text-gray-500 text-xs">Digital Media</p>
            </div>

            {/* Prof. Elena Torres */}
            <div className="group bg-black/30 backdrop-blur-sm rounded-2xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-500 p-6 text-center hover:shadow-2xl hover:shadow-yellow-500/20 hover:scale-105">
              <div className="relative mb-5 inline-block">
                <img
                  src="https://ui-avatars.com/api/?name=Elena+Torres&size=128&background=f59e0b&color=fff&rounded=true&bold=true"
                  alt="Prof. Elena Torres"
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-yellow-500 group-hover:border-yellow-400 transition-all duration-300 shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mb-2 group-hover:text-yellow-300 transition-colors duration-300">Prof. Elena Torres</h3>
              <p className="text-yellow-400 text-sm font-semibold mb-1">N/A</p>
              <p className="text-gray-500 text-xs">Social Sciences</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;