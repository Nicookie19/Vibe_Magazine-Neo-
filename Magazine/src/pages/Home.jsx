import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import BlurText from "../components/BlurText";

const Home = () => {
  const [events, setEvents] = useState([]);
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState({ "section-join": true });
  const [scrollY, setScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState('latest');
  const [showStats, setShowStats] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');
  
  // Interactive stats counter
  const [stats, setStats] = useState({
    magazines: 0,
    readers: 0,
    articles: 0,
    events: 0
  });

  // Smooth scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Animated stats counter
  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showStats) {
      const targetStats = { magazines: 25, readers: 5000, articles: 150, events: 40 };
      const duration = 2000;
      const steps = 60;
      const stepTime = duration / steps;
      
      let step = 0;
      const interval = setInterval(() => {
        step++;
        setStats({
          magazines: Math.floor((targetStats.magazines / steps) * step),
          readers: Math.floor((targetStats.readers / steps) * step),
          articles: Math.floor((targetStats.articles / steps) * step),
          events: Math.floor((targetStats.events / steps) * step),
        });
        
        if (step >= steps) {
          setStats(targetStats);
          clearInterval(interval);
        }
      }, stepTime);
      
      return () => clearInterval(interval);
    }
  }, [showStats]);

  // Newsletter submission
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setNewsletterStatus('loading');
    
    // Simulate API call
    setTimeout(() => {
      setNewsletterStatus('success');
      setNewsletterEmail('');
      setTimeout(() => setNewsletterStatus(''), 3000);
    }, 1000);
  };

  const handleAnimationComplete = () => {
    console.log('Animation completed!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0c10] via-[#1b0b28] to-[#071030] text-gray-200">
      {/* Hero Section with Featured Video/Image */}
      <section className="relative h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Background Video Container with Parallax */}
        <div 
          className="absolute inset-0 overflow-hidden transition-transform duration-700"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-20 scale-110"
          >
            <source src="/videos/background.mp4" type="video/mp4" />
          </video>
          {/* Enhanced Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0c10]/70 via-[#1b0b28]/60 to-[#071030]/80"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#0b0c10_100%)]"></div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        {/* Hero Content with Enhanced Animation */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <BlurText
            text="VibeMagazine"
            delay={150}
            animateBy="words"
            direction="top"
            onAnimationComplete={handleAnimationComplete}
            className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 text-white tracking-tight"
            style={{ textShadow: '0 0 40px rgba(168, 85, 247, 0.8), 0 0 80px rgba(139, 92, 246, 0.6), 0 4px 20px rgba(0, 0, 0, 0.9)' }}
          />
          <BlurText
            text="Virtual Initiative For Building Engagement"
            delay={150}
            animateBy="words"
            direction="top"
            className="text-xl md:text-2xl lg:text-3xl text-white mb-12 font-light max-w-3xl mx-auto leading-relaxed"
            style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)' }}
          />
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/archive"
              className="group relative bg-violet-600 hover:bg-violet-700 text-white px-10 py-4 rounded-full font-semibold transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/50 overflow-hidden"
            >
              <span className="relative z-10">
                <BlurText
                  text="Explore Magazines"
                  delay={100}
                  animateBy="words"
                  direction="top"
                  className="inline-block"
                />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </Link>
          </div>
        </div>
      </section>
      {/* Latest Magazine Section - Featured Layout */}
      {magazines.length > 0 && (
        <section className="py-24 px-6 bg-gradient-to-b from-black/10 to-transparent relative">
          {/* Decorative Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-3 inline-block">
                Latest Issue
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-violet-600 mx-auto rounded-full"></div>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Magazine Cover - Left Side */}
              <div className="order-2 lg:order-1">
                <button
                  onClick={() => window.location.href = '/archive'}
                  className="group focus:outline-none w-full relative"
                >
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-purple-500/30 transition-all duration-700 group-hover:shadow-purple-500/40 group-hover:border-purple-500/50 group-hover:scale-[1.02]">
                    <img 
                      src={magazines[0].cover} 
                      alt={magazines[0].title} 
                      className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110" 
                    />
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    
                    <div className="absolute top-6 right-6 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs font-bold px-4 py-2 tracking-wider rounded-full shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-2xl animate-pulse">
                      LATEST ISSUE
                    </div>
                  </div>
                </button>
              </div>

              {/* Magazine Details - Right Side */}
              <div className="order-1 lg:order-2">
                <div className="lg:pl-12 space-y-6">
                  <span className="inline-block text-sm font-semibold tracking-wider text-purple-400 mb-2 uppercase">
                    {new Date(magazines[0].created_at).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                  
                  <h2 className="text-4xl lg:text-6xl font-black text-gray-100 leading-tight hover:text-purple-100 transition-colors duration-300">
                    {magazines[0].title}
                  </h2>
                  
                  {magazines[0].subtitle && (
                    <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed italic font-light">
                      {magazines[0].subtitle}
                    </p>
                  )}

                  <p className="text-gray-400 leading-relaxed text-lg border-l-2 border-purple-500/30 pl-4">
                    Explore innovative student projects from our university community. Discover inspiring stories, creative solutions, and the brilliant minds shaping tomorrow's world.
                  </p>

                  <Link
                    to="/archive"
                    className="group inline-flex items-center gap-3 bg-violet-600 hover:bg-violet-700 text-white px-10 py-5 rounded-full font-semibold transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/50 mt-6"
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
      <section className="py-24 px-6 relative">
        {/* Background Decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-100 mb-4 inline-block">
              Upcoming Events
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-violet-600 mx-auto rounded-full transition-all duration-700"></div>
            <p className="text-gray-400 mt-4 text-lg">Don't miss out on these exciting opportunities</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border-l-4 border-red-500 text-red-300 px-6 py-4 mb-8 rounded">
              Error: {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <span className="text-gray-300 text-lg">Loading events...</span>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 bg-black/20 rounded-lg border border-purple-500/20">
              <div className="w-16 h-16 bg-[#241231] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xl text-gray-200 mb-2 font-semibold">No upcoming events</p>
              <p className="text-gray-400">Check back soon for new announcements</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event, index) => (
                <div 
                  key={event.id}
                  className="group relative bg-gradient-to-br from-purple-900/20 to-violet-900/20 rounded-2xl border border-purple-500/30 overflow-hidden hover:border-purple-500/60 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/30"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Event Image */}
                  <div className="relative h-64 overflow-hidden bg-[#241231]">
                    <img
                      src={event.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#241231] via-transparent to-transparent"></div>
                    {/* Image Overlay on Hover */}
                    <div className="absolute inset-0 bg-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Date Badge */}
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                      {event.date}
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="p-6">
                    <h3 className="text-2xl font-black text-gray-100 mb-4 leading-tight group-hover:text-purple-300 transition-colors duration-300">
                      {event.title}
                    </h3>
                    
                    <div className="flex items-center gap-3 text-gray-300 mb-4">
                      <div className="p-2 bg-purple-500/10 rounded-full">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold">{event.venue}</span>
                    </div>

                    <p className="text-gray-400 leading-relaxed">
                      Join us for this exciting event. Don't miss out on this opportunity to connect and learn.
                    </p>
                  </div>

                  {/* Hover effect background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>


          

      {/* Quick Links / Call to Action Grid */}
      <section className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Submit Your Work */}
            <Link
              to="/submit"
              className="group relative bg-gradient-to-br from-purple-900/40 to-violet-900/40 rounded-3xl border border-purple-500/30 p-12 hover:border-purple-500/60 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-violet-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="text-6xl mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  ✨
                </div>
                <h3 className="text-3xl font-black text-gray-100 mb-4 group-hover:text-purple-300 transition-colors duration-300">
                  Submit Your Work
                </h3>
                <p className="text-gray-400 text-lg mb-6">
                  Got a story to tell? Share your articles, poetry, art, or creative works with our community.
                </p>
                <div className="flex items-center gap-2 text-purple-400 font-semibold">
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
              className="group relative bg-gradient-to-br from-violet-900/40 to-pink-900/40 rounded-3xl border border-violet-500/30 p-12 hover:border-violet-500/60 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="text-6xl mb-6 transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500">
                  📖
                </div>
                <h3 className="text-3xl font-black text-gray-100 mb-4 group-hover:text-violet-300 transition-colors duration-300">
                  Browse Archive
                </h3>
                <p className="text-gray-400 text-lg mb-6">
                  Explore our collection of past issues filled with inspiring stories and creative content.
                </p>
                <div className="flex items-center gap-2 text-violet-400 font-semibold">
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
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-100 mb-4">
              Why Join VibeMagazine?
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-violet-600 mx-auto rounded-full"></div>
            <p className="text-gray-400 mt-4 text-lg max-w-2xl mx-auto">
              Discover what makes our community special
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Share Your Voice',
                description: 'Publish your articles, stories, and creative works to reach thousands of readers.',
                icon: '✍️',
                color: 'purple'
              },
              {
                title: 'Connect & Network',
                description: 'Meet fellow students, collaborate on projects, and build lasting connections.',
                icon: '🤝',
                color: 'violet'
              },
              {
                title: 'Learn & Grow',
                description: 'Develop your writing, editing, and creative skills through hands-on experience.',
                icon: '🚀',
                color: 'pink'
              }
            ].map((feature, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className="group relative p-8 bg-gradient-to-br from-purple-900/20 to-violet-900/20 rounded-2xl border border-purple-500/20 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 cursor-pointer overflow-hidden"
              >
                {/* Animated background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-600/10 to-${feature.color}-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                <div className="relative z-10">
                  <div className="text-6xl mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-100 mb-4 group-hover:text-purple-300 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover effect indicator */}
                  <div className={`mt-6 h-1 bg-gradient-to-r from-${feature.color}-500 to-${feature.color}-600 rounded-full transform origin-left transition-transform duration-500 ${hoveredFeature === index ? 'scale-x-100' : 'scale-x-0'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>





















      {/* Join the Vibe Section */}
      <section className="px-6 py-32 bg-gradient-to-br from-[#241231] via-[#1b0b28] to-[#1a0d24] text-white border-t border-purple-500/20 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="mb-6">
            <span className="inline-block text-sm font-bold tracking-wider text-purple-400 uppercase bg-purple-500/10 px-6 py-2 rounded-full border border-purple-500/20">
              Join Us
            </span>
          </div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-purple-100 to-gray-100">
            Want to Join the Vibe?
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed">
            We meet every <span className="text-purple-400 font-semibold">Friday</span>. Come with your creative ideas, articles, or features to share.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              to="https://docs.google.com/forms/d/e/1FAIpQLSdqVUvPu8patyf3Rcz74BP50fPRVOmWbmu78WJ9Dcje-1363Q/viewform?usp=sharing&oid=115741711961155887701"
              className="group border-2 border-purple-400 hover:border-purple-300 text-purple-300 hover:bg-purple-600 hover:text-white font-bold px-12 py-5 rounded-full transition-all duration-500 hover:scale-105 active:scale-95 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-500/30"
            >
              <span className="flex items-center gap-2">
                <BlurText
                  text="Pre-register Our Club"
                  delay={100}
                  animateBy="words"
                  direction="top"
                  className="inline-block"
                />
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
