import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import BlurText from "../components/BlurText";
import AnimatedVibeLogo from "../components/AnimatedVibeLogo";

const Home = () => {
  const [events, setEvents] = useState([]);
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  // Fetch events from Supabase
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("events")
      .select("id, title, date, venue, image")
      .order("date", { ascending: true });
    if (error) {
      setError(error.message || "Failed to fetch events.");
      setEvents([]);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  // Fetch latest magazine from Supabase
  const fetchLatestMagazine = async () => {
    const { data, error } = await supabase
      .from("magazines")
      .select("id, title, subtitle, cover, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(1);
    if (!error && data && data.length > 0) {
      setMagazines(data);
    } else {
      setMagazines([]);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchLatestMagazine();
  }, []);

  return (
    <div className="vibe-home min-h-screen text-gray-200">
      <section className="vibe-hero" aria-labelledby="home-title">
        <div className="vibe-hero-grid" aria-hidden="true" />
        <div className="vibe-hero-content">
          <p className="vibe-eyebrow"><span /> Student voices. Full color.</p>
          <h1 id="home-title" className="sr-only">Vibe Magazine</h1>
          <AnimatedVibeLogo />
          <p className="vibe-hero-tagline">Virtual Initiative For Building Engagement</p>
          <p className="vibe-hero-description">Tune into campus stories, fresh perspectives, and a community of creative minds.</p>
          <div className="vibe-hero-actions">
            <Link to="/archive" className="vibe-button vibe-button-primary">Explore Magazines <span aria-hidden="true">↗</span></Link>
            <Link to="/submit" className="vibe-button vibe-button-secondary">Share Your Voice <span aria-hidden="true">→</span></Link>
          </div>
          <div className="vibe-frequency" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>
        </div>
      </section>
      {/* Latest Magazine Section - Featured Layout */}
      {magazines.length > 0 && (
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-black/10 to-transparent relative">
          {/* Decorative Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            {/* Section Header */}
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-100 mb-3 inline-block">
                Latest Issue
              </h2>
              <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-brand-500 to-brand-600 mx-auto rounded-full"></div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
              {/* Magazine Cover - Left Side */}
              <div className="order-2 lg:order-1">
                <button
                  onClick={() => window.location.href = '/archive'}
                  className="group focus:outline-none w-full relative"
                >
                  <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border border-brand-500/30 transition-all duration-700 group-hover:shadow-brand-500/40 group-hover:border-brand-500/50 group-hover:scale-[1.01]">
                    <img 
                      src={magazines[0].cover} 
                      alt={magazines[0].title} 
                      className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110" 
                    />
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-brand-600 to-brand-600 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 tracking-wider rounded-full shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-2xl animate-pulse">
                      LATEST ISSUE
                    </div>
                  </div>
                </button>
              </div>

              {/* Magazine Details - Right Side */}
              <div className="order-1 lg:order-2">
                <div className="lg:pl-8 lg:pl-12 space-y-4 sm:space-y-6">
                  <span className="inline-block text-xs sm:text-sm font-semibold tracking-wider text-brand-400 mb-2 uppercase">
                    {new Date(magazines[0].created_at).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                  
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-100 leading-tight hover:text-brand-100 transition-colors duration-300">
                    {magazines[0].title}
                  </h2>
                  
                  {magazines[0].subtitle && (
                    <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 leading-relaxed italic font-light">
                      {magazines[0].subtitle}
                    </p>
                  )}

                  <p className="text-gray-400 leading-relaxed text-base sm:text-lg border-l-2 border-brand-500/30 pl-4">
                    Explore innovative student projects from our university community. Discover inspiring stories, creative solutions, and the brilliant minds shaping tomorrow's world.
                  </p>

                  <Link
                    to="/archive"
                    className="group inline-flex items-center gap-3 bg-brand-600 hover:bg-brand-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-brand-500/50 mt-4 sm:mt-6"
                  >
                    <span>
                      <BlurText
                        text="Read Magazine"
                        delay={100}
                        animateBy="words"
                        direction="top"
                        className="inline-block"
                      />
                    </span>
                    <svg className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

     

      {/* Events Grid Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
        {/* Background Decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-12 sm:mb-16 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-100 mb-4 inline-block">
              Upcoming Events
            </h2>
            <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-brand-500 to-brand-600 mx-auto rounded-full transition-all duration-700"></div>
            <p className="text-gray-400 mt-4 text-base sm:text-lg">Don't miss out on these exciting opportunities</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border-l-4 border-red-500 text-red-300 px-4 sm:px-6 py-4 mb-8 rounded">
              Error: {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                <span className="text-gray-300 text-lg">Loading events...</span>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 bg-black/20 rounded-lg border border-brand-500/20">
              <div className="w-16 h-16 bg-[#112326] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xl text-gray-200 mb-2 font-semibold">No upcoming events</p>
              <p className="text-gray-400">Check back soon for new announcements</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {events.map((event, index) => (
                <div 
                  key={event.id}
                  className="group relative bg-gradient-to-br from-brand-900/20 to-brand-900/20 rounded-xl sm:rounded-2xl border border-brand-500/30 overflow-hidden hover:border-brand-500/60 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-brand-500/30"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Event Image */}
                  <div className="relative h-48 sm:h-64 overflow-hidden bg-[#112326]">
                    <img
                      src={event.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#112326] via-transparent to-transparent"></div>
                    {/* Image Overlay on Hover */}
                    <div className="absolute inset-0 bg-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Date Badge */}
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-brand-600 to-brand-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      {event.date}
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-xl sm:text-2xl font-black text-gray-100 mb-3 sm:mb-4 leading-tight group-hover:text-brand-300 transition-colors duration-300">
                      {event.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-300 mb-4">
                      <div className="p-2 bg-brand-500/10 rounded-full">
                        <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold">{event.venue}</span>
                    </div>

                    <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                      Join us for this exciting event. Don't miss out on this opportunity to connect and learn.
                    </p>
                  </div>

                  {/* Hover effect background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>


          

      {/* Quick Links / Call to Action Grid */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {/* Submit Your Work */}
            <Link
              to="/submit"
              className="group relative bg-gradient-to-br from-brand-900/40 to-brand-900/40 rounded-2xl sm:rounded-3xl border border-brand-500/30 p-8 sm:p-12 hover:border-brand-500/60 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-brand-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  ✨
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-100 mb-3 sm:mb-4 group-hover:text-brand-300 transition-colors duration-300">
                  Submit Your Work
                </h3>
                <p className="text-gray-400 text-base sm:text-lg mb-6">
                  Got a story to tell? Share your articles, poetry, art, or creative works with our community.
                </p>
                <div className="flex items-center gap-2 text-brand-400 font-semibold">
                  <span>Start Submitting</span>
                  <svg className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Browse Archive */}
            <Link
              to="/archive"
              className="group relative bg-gradient-to-br from-brand-900/40 to-pink-900/40 rounded-2xl sm:rounded-3xl border border-brand-500/30 p-8 sm:p-12 hover:border-brand-500/60 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-brand-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500">
                  📖
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-100 mb-3 sm:mb-4 group-hover:text-brand-300 transition-colors duration-300">
                  Browse Archive
                </h3>
                <p className="text-gray-400 text-base sm:text-lg mb-6">
                  Explore our collection of past issues filled with inspiring stories and creative content.
                </p>
                <div className="flex items-center gap-2 text-brand-400 font-semibold">
                  <span>Explore Now</span>
                  <svg className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>





















      {/* Interactive Features Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-100 mb-4">
              Why Join VibeMagazine?
            </h2>
            <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-brand-500 to-brand-600 mx-auto rounded-full"></div>
            <p className="text-gray-400 mt-4 text-base sm:text-lg max-w-2xl mx-auto">
              Discover what makes our community special
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: 'Share Your Voice',
                description: 'Publish your articles, stories, and creative works to reach thousands of readers.',
                icon: '✍️',
                color: '#ff0080'
              },
              {
                title: 'Connect & Network',
                description: 'Meet fellow students, collaborate on projects, and build lasting connections.',
                icon: '🤝',
                color: '#7dce76'
              },
              {
                title: 'Learn & Grow',
                description: 'Develop your writing, editing, and creative skills through hands-on experience.',
                icon: '🚀',
                color: '#ffc400'
              }
            ].map((feature, index) => (
              <div
                key={index}
                style={{ "--feature-color": feature.color }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className="vibe-feature group relative p-8 bg-gradient-to-br from-brand-900/20 to-brand-900/20 rounded-2xl border border-brand-500/20 hover:border-brand-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-brand-500/30 cursor-pointer overflow-hidden"
              >
                {/* Animated background on hover */}
                <div className="vibe-feature-wash absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  <div className="text-6xl mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-100 mb-4 group-hover:text-brand-300 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover effect indicator */}
                  <div className={`vibe-feature-line mt-6 h-1 rounded-full transform origin-left transition-transform duration-500 ${hoveredFeature === index ? 'scale-x-100' : 'scale-x-0'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>





















      {/* Join the Vibe Section */}
      <section className="px-4 sm:px-6 py-24 sm:py-32 bg-gradient-to-br from-[#101e20] via-[#0a1011] to-[#101416] text-white border-t border-brand-500/20 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="mb-6">
            <span className="inline-block text-sm sm:text-base font-bold tracking-wider text-brand-400 uppercase bg-brand-500/10 px-4 sm:px-6 py-2 rounded-full border border-brand-500/20">
              Join Us
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-brand-100 to-gray-100">
            Want to Join the Vibe?
          </h2>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-12 sm:mb-16 max-w-3xl mx-auto leading-relaxed">
            We meet every <span className="text-brand-400 font-semibold">Friday</span>. Come with your creative ideas, articles, or features to share.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Link
              to="https://docs.google.com/forms/d/e/1FAIpQLSdqVUvPu8patyf3Rcz74BP50fPRVOmWbmu78WJ9Dcje-1363Q/viewform?usp=sharing&oid=115741711961155887701"
              className="group border-2 border-brand-400 hover:border-brand-300 text-brand-300 hover:bg-brand-600 hover:text-white font-bold px-8 sm:px-12 py-4 sm:py-5 rounded-full transition-all duration-500 hover:scale-105 active:scale-95 backdrop-blur-sm hover:shadow-xl hover:shadow-brand-500/30 text-sm sm:text-base"
            >
              <span className="flex items-center gap-2">
                <BlurText
                  text="Pre-register Our Club"
                  delay={100}
                  animateBy="words"
                  direction="top"
                  className="inline-block"
                />
                <svg className="w-4 sm:w-5 h-4 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
