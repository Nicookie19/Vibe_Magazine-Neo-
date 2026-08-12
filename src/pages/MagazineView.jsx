import React, { useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

const MagazineView = () => {
  const location = useLocation();
  const { magazine } = location.state;
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
  const [credentials, setCredentials] = useState({
    name: "",
    id_number: "",
    email: "",
    course: "",
    year: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const [userId] = useState(() => {
    let id = localStorage.getItem('magazine_user_id');
    if (!id) {
      id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('magazine_user_id', id);
    }
    return id;
  });

  const handleCredentialsSubmit = async (magazineId) => {
    if (!newComment.trim()) return;
    if (!credentials.name || !credentials.id_number || !credentials.email || !credentials.course || !credentials.year) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    const newCommentData = {
      magazine_id: magazineId,
      user_id: userId,
      user_name: credentials.name,
      text: newComment.trim(),
      id_number: credentials.id_number,
      email: credentials.email,
      course: credentials.course,
      year: credentials.year
    };

    const { data, error } = await supabase
      .from("magazine_comments")
      .insert([newCommentData])
      .select()
      .single();

    setSubmitting(false);

    if (!error && data) {
      setComments(prev => ({
        ...prev,
        [magazineId]: [data, ...(prev[magazineId] || [])]
      }));
      setNewComment("");
      setShowCredentialsForm(false);
      setCredentials({ name: "", id_number: "", email: "", course: "", year: "" });
    } else if (error) {
      console.error("Error adding comment:", error);
      alert("Failed to post comment: " + error.message);
    }
  };

  const handleCommentClick = () => {
    setShowCredentialsForm(true);
  };

  const handleCredentialsChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <h2 className="text-3xl font-bold text-center mb-10">📖 Magazine Viewer</h2>

      <div className="flex flex-col items-center mb-16">
        <h3 className="text-xl font-semibold mb-2">{magazine.title}</h3>
        <p className="text-gray-600 mb-4">{magazine.description}</p>

        <HTMLFlipBook width={400} height={500} className="shadow-lg">
          <div className="page bg-white p-4 flex flex-col items-center justify-center">
            <h4 className="text-xl font-bold mb-2">📕 Cover</h4>
            <img src={magazine.coverImage} alt="Cover" className="w-48 h-auto rounded" />
          </div>

          <div className="page bg-white p-4">
            <h4 className="text-lg font-semibold mb-2">🔎 Description</h4>
            <p>{magazine.description}</p>
          </div>

          <div className="page bg-white p-4 flex flex-col items-center">
            <h4 className="text-lg font-semibold mb-2">🎥 Embedded Video</h4>
            <video controls width="100%" className="rounded shadow-md">
              <source src={magazine.videoUrl} type="video/mp4" />
            </video>
          </div>

          <div className="page bg-white p-4 flex flex-col items-center justify-center">
            <h4 className="text-lg font-semibold">📄 Read the Full Magazine</h4>
            <a
              href={magazine.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline mt-2"
            >
              Open PDF
            </a>
          </div>

<div className="page bg-white p-4 flex flex-col">
              <h4 className="text-lg font-semibold mb-2">💬 Comments & Suggestions</h4>

              {!showCredentialsForm ? (
                <div className="mb-2">
                  <textarea
                    rows={3}
                    placeholder="Leave a comment..."
                    className="w-full p-2 border rounded"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button
                    className="mt-2 bg-blue-600 text-white px-4 py-1 rounded"
                    onClick={handleCommentClick}
                    disabled={!newComment.trim()}
                  >
                    Post Comment
                  </button>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  <p className="text-sm text-gray-600">Please provide your details to post anonymously:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={credentials.name}
                      onChange={(e) => handleCredentialsChange('name', e.target.value)}
                      className="p-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="School ID Number *"
                      value={credentials.id_number}
                      onChange={(e) => handleCredentialsChange('id_number', e.target.value)}
                      className="p-2 border rounded"
                    />
                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={credentials.email}
                      onChange={(e) => handleCredentialsChange('email', e.target.value)}
                      className="p-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Course *"
                      value={credentials.course}
                      onChange={(e) => handleCredentialsChange('course', e.target.value)}
                      className="p-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Year Level *"
                      value={credentials.year}
                      onChange={(e) => handleCredentialsChange('year', e.target.value)}
                      className="p-2 border rounded"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded"
                      onClick={() => handleCredentialsSubmit(magazine.id)}
                      disabled={submitting}
                    >
                      {submitting ? "Posting..." : "Submit Comment"}
                    </button>
                    <button
                      className="bg-gray-400 text-white px-4 py-2 rounded"
                      onClick={() => setShowCredentialsForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <ul className="mt-4 space-y-2">
                {(comments[magazine.id] || []).map((c, index) => (
                  <li key={index} className="bg-gray-100 p-2 rounded">
                    {c.text || c}
                    {c.user_name && <span className="text-xs text-gray-500 ml-2">— {c.user_name}</span>}
                  </li>
                ))}
              </ul>
            </div>

          <div className="page bg-white p-4 flex items-center justify-center">
            <p className="text-sm text-gray-500">🚀 Thank you for reading!</p>
          </div>
        </HTMLFlipBook>
      </div>
    </div>
  );
};

export default MagazineView;