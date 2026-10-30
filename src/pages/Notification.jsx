// src/pages/Notification.jsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const Notification = () => {
  const [searchParams] = useSearchParams();
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    const notificationType = searchParams.get('type');
    const submissionTitle = searchParams.get('title');
    
    setType(notificationType || 'update');
    setTitle(decodeURIComponent(submissionTitle || 'Your Submission'));
  }, [searchParams]);

  const isAccepted = type === 'accepted';
  const isRejected = type === 'rejected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090d0f] via-[#0e1b1e] to-[#0b1417] flex items-center justify-center px-6">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="vibe-panel bg-gradient-to-br from-[#14282c]/80 via-[#0e1b1e]/70 to-[#0b1619]/80 backdrop-blur-xl rounded-2xl border border-brand-500/30 shadow-2xl p-8">
          {/* Logo and Title Section */}
          <div className="text-center mb-8">
            <div className="w-28 h-24 mx-auto mb-4">
              <img 
                src="/brand/vibe-tv.png"
                alt="Vibe Magazine Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${
              isAccepted ? 'bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent' :
              isRejected ? 'bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent' :
              'bg-gradient-to-r from-brand-400 to-pink-600 bg-clip-text text-transparent'
            }`}>
              {isAccepted ? '🎉 Congratulations!' : 
               isRejected ? '📝 Submission Update' : 
               '📧 Notification'}
            </h1>
            <p className={`text-sm font-medium ${
              isAccepted ? 'text-green-300' : 
              isRejected ? 'text-orange-300' :
              'text-brand-300'
            }`}>
              Vibe Magazine Editorial Team
            </p>
          </div>

          {/* Message Content */}
          <div className={`border rounded-lg p-6 mb-8 ${
            isAccepted ? 'bg-green-500/10 border-green-500/30' :
            isRejected ? 'bg-orange-500/10 border-orange-500/30' :
            'bg-brand-500/10 border-brand-500/30'
          }`}>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isAccepted ? 'bg-green-500/20' :
                isRejected ? 'bg-orange-500/20' :
                'bg-brand-500/20'
              }`}>
                {isAccepted ? (
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isRejected ? (
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                )}
              </div>
              
              {isAccepted ? (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Your submission has been accepted!</h3>
                  <p className="text-green-300 text-sm mb-4">
                    We're excited to inform you that "<strong>{title}</strong>" has been selected for publication in Vibe Magazine.
                  </p>
                  <p className="text-green-300/80 text-xs">
                    Your work will be featured in our upcoming publication. We'll keep you updated on the publication timeline.
                  </p>
                </div>
              ) : isRejected ? (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Submission Review Complete</h3>
                  <p className="text-orange-300 text-sm mb-4">
                    Thank you for your submission "<strong>{title}</strong>" to Vibe Magazine.
                  </p>
                  <p className="text-orange-300/80 text-xs mb-3">
                    After careful review, your submission was not selected for this publication cycle.
                  </p>
                  <p className="text-orange-300/80 text-xs">
                    Please don't be discouraged! We encourage you to continue creating and consider submitting to future publications.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Submission Status Update</h3>
                  <p className="text-brand-300 text-sm">
                    We have an update regarding your submission "<strong>{title}</strong>".
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link 
              to="/" 
              className={`w-full py-3.5 rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 transform hover:scale-[1.02] flex items-center justify-center space-x-2 ${
                isAccepted ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white focus:ring-green-500/50' :
                isRejected ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white focus:ring-orange-500/50' :
                'bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-600 hover:to-brand-600 text-white focus:ring-brand-500/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Back to Vibe Magazine</span>
            </Link>

            <div className="text-center">
              <Link 
                to="/submit" 
                className={`inline-flex items-center space-x-2 transition-colors duration-200 text-sm font-medium ${
                  isAccepted ? 'text-green-300 hover:text-green-200' :
                  isRejected ? 'text-orange-300 hover:text-orange-200' :
                  'text-brand-300 hover:text-brand-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Submit New Work</span>
              </Link>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-brand-500/20">
            <div className={`border rounded-lg p-4 ${
              isAccepted ? 'bg-green-900/30 border-green-500/20' :
              isRejected ? 'bg-orange-900/30 border-orange-500/20' :
              'bg-brand-900/30 border-brand-500/20'
            }`}>
              <h4 className="text-white font-medium mb-2 flex items-center">
                <svg className={`w-4 h-4 mr-2 ${
                  isAccepted ? 'text-green-400' :
                  isRejected ? 'text-orange-400' :
                  'text-brand-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isAccepted ? 'What\'s Next?' : isRejected ? 'Keep Creating!' : 'Stay Connected'}
              </h4>
              <ul className={`text-sm space-y-1 ${
                isAccepted ? 'text-green-300' :
                isRejected ? 'text-orange-300' :
                'text-brand-300'
              }`}>
                {isAccepted ? (
                  <>
                    <li>• We'll contact you about publication details</li>
                    <li>• Your work will be featured prominently</li>
                    <li>• Continue creating for future issues</li>
                  </>
                ) : isRejected ? (
                  <>
                    <li>• Each submission is a learning opportunity</li>
                    <li>• Keep developing your creative skills</li>
                    <li>• Submit again when you're ready</li>
                  </>
                ) : (
                  <>
                    <li>• Check your email for more details</li>
                    <li>• Follow us for updates</li>
                    <li>• Submit more of your work</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
