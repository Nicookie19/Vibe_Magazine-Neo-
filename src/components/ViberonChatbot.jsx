import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getViberonAnswer, viberonSuggestions } from "../utils/viberonKnowledge";

const initialMessage = {
  id: "welcome",
  sender: "viberon",
  text: "Hi! I’m Viberon, the website guide. Ask me about VIBE, magazines, submissions, or how to use the site.",
};

const ViberonChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([initialMessage]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const askQuestion = (question) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;

    const result = getViberonAnswer(cleanQuestion);
    setShowSuggestions(false);
    setInput("");
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-question`, sender: "user", text: cleanQuestion },
      { id: `${Date.now()}-answer`, sender: "viberon", ...result },
    ]);
  };

  const renderLink = (message) => {
    if (!message.path || !message.label) return null;
    const className = "mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-300 hover:text-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-400 rounded";
    if (message.path.startsWith("https://")) {
      return <a className={className} href={message.path} target="_blank" rel="noreferrer">{message.label}<span aria-hidden="true">↗</span></a>;
    }
    return <Link className={className} to={message.path} onClick={() => setIsOpen(false)}>{message.label}<span aria-hidden="true">→</span></Link>;
  };

  return (
    <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-[60]">
      {isOpen && (
        <section
          id="viberon-chat-window"
          aria-label="Chat with Viberon"
          className="mb-4 flex h-[70vh] max-h-[36rem] w-[calc(100vw_-_2rem)] max-w-[24rem] flex-col overflow-hidden rounded-2xl border border-brand-400/30 bg-[#0b1012] shadow-2xl shadow-black/60"
        >
          <header className="flex items-center justify-between border-b border-brand-500/20 bg-gradient-to-r from-brand-900/80 to-[#111b1d] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-pink-500 text-lg font-black text-[#071013]" aria-hidden="true">V</div>
              <div>
                <h2 className="font-bold text-white">Viberon</h2>
                <p className="text-xs text-gray-400">Website guide · prepared answers</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
              aria-label="Close Viberon chat"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite" aria-relevant="additions text">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${message.sender === "user" ? "rounded-br-md bg-brand-500 text-[#071013]" : "rounded-bl-md border border-white/10 bg-white/[0.06] text-gray-200"}`}>
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  {message.sender === "viberon" && renderLink(message)}
                </div>
              </div>
            ))}

            {showSuggestions && (
              <div className="pt-1">
                <p className="mb-2 text-xs text-gray-500">Try asking</p>
                <div className="flex flex-wrap gap-2">
                  {viberonSuggestions.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() => askQuestion(suggestion)}
                      className="rounded-full border border-brand-400/30 px-3 py-1.5 text-left text-xs text-brand-200 transition hover:border-brand-300 hover:bg-brand-500/10 focus:outline-none focus:ring-2 focus:ring-brand-400"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="border-t border-brand-500/20 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              askQuestion(input);
            }}
          >
            <label className="sr-only" htmlFor="viberon-question">Ask Viberon a question</label>
            <div className="flex items-center gap-2">
              <input
                id="viberon-question"
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about the website…"
                autoComplete="off"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 text-sm text-white placeholder:text-gray-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-400 text-[#071013] transition hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-brand-200"
                aria-label="Send question"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7-7l7 7-7 7" /></svg>
              </button>
            </div>
            <p className="mt-2 px-1 text-[11px] text-gray-500">Viberon answers from information on this website.</p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="ml-auto flex items-center gap-2 rounded-full border border-brand-200/40 bg-gradient-to-r from-brand-400 to-brand-300 px-4 py-3 font-bold text-[#071013] shadow-xl shadow-brand-950/40 transition hover:-translate-y-0.5 hover:shadow-brand-500/30 focus:outline-none focus:ring-4 focus:ring-brand-300/40"
        aria-expanded={isOpen}
        aria-controls="viberon-chat-window"
        aria-label={isOpen ? "Close Viberon chat" : "Chat with Viberon"}
      >
        {isOpen ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 11.5a8.5 8.5 0 01-12.1 7.7L3 21l1.8-4.7A8.5 8.5 0 1121 11.5z" /></svg>
        )}
        <span>{isOpen ? "Close" : "Ask Viberon"}</span>
      </button>
    </div>
  );
};

export default ViberonChatbot;
