import React, { useEffect, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import axios from "axios";

const MagazineView = () => {
  const [magazines, setMagazines] = useState([]);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    // Dummy magazine
    const dummyData = [
      {
        id: 1,
        title: "July 2025 Edition",
        description: "A fresh look into tech, art, and innovation.",
        coverImage: "https://via.placeholder.com/400x600",
        pdfUrl: "https://example.com/sample.pdf",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      },
    ];
    setMagazines(dummyData);
  }, []);

  const handleAddComment = (magazineId) => {
    if (!newComment.trim()) return;

    setComments((prev) => ({
      ...prev,
      [magazineId]: [...(prev[magazineId] || []), newComment],
    }));
    setNewComment("");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <h2 className="text-3xl font-bold text-center mb-10">📖 Magazine Viewer</h2>

      {magazines.map((mag) => (
        <div key={mag.id} className="flex flex-col items-center mb-16">
          <h3 className="text-xl font-semibold mb-2">{mag.title}</h3>
          <p className="text-gray-600 mb-4">{mag.description}</p>

          <HTMLFlipBook width={400} height={500} className="shadow-lg">
            <div className="page bg-white p-4 flex flex-col items-center justify-center">
              <h4 className="text-xl font-bold mb-2">📕 Cover</h4>
              <img src={mag.coverImage} alt="Cover" className="w-48 h-auto rounded" />
            </div>

            <div className="page bg-white p-4">
              <h4 className="text-lg font-semibold mb-2">🔎 Description</h4>
              <p>{mag.description}</p>
            </div>

            <div className="page bg-white p-4 flex flex-col items-center">
              <h4 className="text-lg font-semibold mb-2">🎥 Embedded Video</h4>
              <video controls width="100%" className="rounded shadow-md">
                <source src={mag.videoUrl} type="video/mp4" />
              </video>
            </div>

            <div className="page bg-white p-4 flex flex-col items-center justify-center">
              <h4 className="text-lg font-semibold">📄 Read the Full Magazine</h4>
              <a
                href={mag.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline mt-2"
              >
                Open PDF
              </a>
            </div>

            <div className="page bg-white p-4 flex flex-col">
              <h4 className="text-lg font-semibold mb-2">💬 Comments & Suggestions</h4>

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
                  onClick={() => handleAddComment(mag.id)}
                >
                  Submit
                </button>
              </div>

              <ul className="mt-4 space-y-2">
                {(comments[mag.id] || []).map((c, index) => (
                  <li key={index} className="bg-gray-100 p-2 rounded">
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="page bg-white p-4 flex items-center justify-center">
              <p className="text-sm text-gray-500">🚀 Thank you for reading!</p>
            </div>
          </HTMLFlipBook>
        </div>
      ))}
    </div>
  );
};

export default MagazineView;
