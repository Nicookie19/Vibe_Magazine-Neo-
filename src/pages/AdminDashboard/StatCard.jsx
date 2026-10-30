// src/pages/AdminDashboard/StatCard.jsx
const StatCard = ({ label, value }) => (
  <div className="vibe-stat bg-[#112326] p-3 sm:p-4 md:p-5 rounded-xl text-center shadow">
    <div className="text-xs sm:text-sm text-gray-400">{label}</div>
    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-300">{value}</div>
  </div>
);

export default StatCard;