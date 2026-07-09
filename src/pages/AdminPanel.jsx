import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const [magazines, setMagazines] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    coverImage: "",
    pdfUrl: "",
  });

  const navigate = useNavigate();

  // 🔐 Redirect if not logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (!isLoggedIn) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    navigate("/admin");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.coverImage || !form.pdfUrl) return;

    setMagazines([
      ...magazines,
      {
        ...form,
        id: Date.now(),
        status: "Pending",
      },
    ]);
    setForm({ title: "", description: "", coverImage: "", pdfUrl: "" });
  };

  const handleApproval = (id, status) => {
    const updated = magazines.map((mag) =>
      mag.id === id ? { ...mag, status } : mag
    );
    setMagazines(updated);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-center">📥 Admin Panel</h2>
        <button
    onClick={() => navigate("/adminLogin")}
    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
  >
    🔒 Logout
  </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto mb-10"
      >
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Magazine Title"
          className="w-full border p-2 mb-4 rounded"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Magazine Description"
          className="w-full border p-2 mb-4 rounded"
        />
        <input
          type="text"
          name="coverImage"
          value={form.coverImage}
          onChange={handleChange}
          placeholder="Cover Image URL"
          className="w-full border p-2 mb-4 rounded"
        />
        <input
          type="text"
          name="pdfUrl"
          value={form.pdfUrl}
          onChange={handleChange}
          placeholder="PDF URL"
          className="w-full border p-2 mb-4 rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Upload Magazine
        </button>
      </form>

      <div className="grid gap-6 max-w-4xl mx-auto">
        {magazines.map((mag) => (
          <div key={mag.id} className="bg-white shadow-md rounded-lg p-4">
            <img
              src={mag.coverImage}
              alt="Cover"
              className="w-full h-48 object-cover rounded mb-4"
            />
            <h3 className="text-xl font-semibold">{mag.title}</h3>
            <p className="text-gray-600 mb-2">{mag.description}</p>
            <a
              href={mag.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline block mb-2"
            >
              View PDF
            </a>
            <p
              className={`text-sm font-medium mb-2 ${
                mag.status === "Approved"
                  ? "text-green-600"
                  : mag.status === "Rejected"
                  ? "text-red-500"
                  : "text-yellow-500"
              }`}
            >
              Status: {mag.status}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleApproval(mag.id, "Approved")}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => handleApproval(mag.id, "Rejected")}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                ❌ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;
