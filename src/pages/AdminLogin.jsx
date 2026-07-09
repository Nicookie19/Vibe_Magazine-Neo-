import React, { useState, useEffect } from 'react';
// For icons, you would typically install lucide-react: npm install lucide-react
// In this environment, we'll simulate the icons with simple text or SVGs.
const icons = {
  LayoutDashboard: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>,
  BookUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><path d="m12 13 3 3 3-3"></path><path d="M15 16V7"></path></svg>,
  MessageSquareQuote: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M8 10h.01"></path><path d="M12 10h.01"></path><path d="M16 10h.01"></path></svg>,
  BarChart3: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>,
  LogOut: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  UploadCloud: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path></svg>,
  ThumbsUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"></path><path d="M18.37 12.87a1 1 0 0 0 .63-1.87 1 1 0 0 0-1-1.74l-3-.5a1 1 0 0 0-1 .8v1.5h2.5a1 1 0 0 1 .99 1.29l-1.17 4.32a1 1 0 0 0 .24 1.02l.5.5a1 1 0 0 0 1.42 0l3-3a1 1 0 0 0 0-1.42l-3-3.01z"></path></svg>,
  MessageCircle: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>,
};

// --- MOCK DATA ---
const mockFeedback = [
    { id: 1, user: 'Alex Doe', avatar: 'https://placehold.co/40x40/E2E8F0/4A5568?text=AD', comment: 'Loved the latest issue! The article on sustainable tech was particularly insightful. Keep up the great work!', date: '2024-08-15' },
    { id: 2, user: 'Jane Smith', avatar: 'https://placehold.co/40x40/E2E8F0/4A5568?text=JS', comment: 'The photography is stunning, as always. However, I found a small typo on page 23. Just a heads up!', date: '2024-08-14' },
    { id: 3, user: 'Sam Wilson', avatar: 'https://placehold.co/40x40/E2E8F0/4A5568?text=SW', comment: 'Could you perhaps cover more topics on digital art in the future? Would be great to see a feature on that.', date: '2024-08-14' },
    { id: 4, user: 'Chris Lee', avatar: 'https://placehold.co/40x40/E2E8F0/4A5568?text=CL', comment: 'The digital version is very convenient, but I wish the font size was adjustable. It\'s a bit small on my tablet.', date: '2024-08-12' },
];

const mockAnalytics = {
    totalReactions: 1256,
    totalComments: 342,
    reactionsChange: 15.2, // percentage
    commentsChange: 8.7, // percentage
    commentsData: [
        { name: 'Jan', comments: 30 }, { name: 'Feb', comments: 45 }, { name: 'Mar', comments: 60 },
        { name: 'Apr', comments: 50 }, { name: 'May', comments: 70 }, { name: 'Jun', comments: 90 },
        { name: 'Jul', comments: 85 },
    ],
    reactionsData: [
        { name: 'Jan', reactions: 200 }, { name: 'Feb', reactions: 250 }, { name: 'Mar', reactions: 400 },
        { name: 'Apr', reactions: 350 }, { name: 'May', reactions: 500 }, { name: 'Jun', reactions: 600 },
        { name: 'Jul', reactions: 700 },
    ],
};


// --- COMPONENTS ---

// 1. Login Page Component
const AdminLogin = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Basic validation
        if (email === 'admin@uic.edu' && password === '123') {
            setError('');
            onLogin();
        } else {
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Admin Login</h1>
                    <p className="mt-2 text-gray-600">Welcome back! Please sign in to your account.</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-sm font-bold text-gray-600 block mb-2" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="admin@uic.edu"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-600 block mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="password"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold text-lg transition-transform transform hover:scale-105"
                        >
                            Sign In
                        </button>
                    </div>
                </form> 
            </div>
        </div>
    );
};

// 2. Magazine Upload Component
const MagazineUpload = () => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = (e) => {
        e.preventDefault();
        if (!file || !title) {
            setMessage('Please provide a title and select a file.');
            return;
        }
        setUploading(true);
        setMessage('Uploading...');
        // Simulate upload process
        setTimeout(() => {
            setUploading(false);
            setMessage(`Successfully uploaded "${title}"!`);
            setFile(null);
            setTitle('');
            setDescription('');
            // Reset file input
            document.getElementById('file-upload').value = null;
        }, 2000);
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Upload New Magazine</h2>
            <div className="bg-white p-8 rounded-2xl shadow-md">
                <form onSubmit={handleUpload} className="space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Magazine Title</label>
                        <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., August 2024 Issue" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="A brief summary of this issue's content."></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Magazine File (PDF)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <icons.UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PDF up to 50MB</p>
                            </div>
                        </div>
                        {file && <p className="text-sm text-gray-600 mt-2">Selected: {file.name}</p>}
                    </div>
                    <div className="flex items-center justify-end space-x-4">
                         {message && <p className={`text-sm ${message.includes('Successfully') ? 'text-green-600' : 'text-gray-600'}`}>{message}</p>}
                        <button type="submit" disabled={uploading} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300">
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// 3. User Feedback Component
const UserFeedback = () => (
    <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">User Feedback</h2>
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <ul className="divide-y divide-gray-200">
                {mockFeedback.map(feedback => (
                    <li key={feedback.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex items-start space-x-4">
                            <img className="h-10 w-10 rounded-full" src={feedback.avatar} alt={`${feedback.user}'s avatar`} />
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-semibold text-gray-900">{feedback.user}</p>
                                    <p className="text-xs text-gray-500">{feedback.date}</p>
                                </div>
                                <p className="mt-1 text-gray-700">{feedback.comment}</p>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);


// 4. Analytics Component
const Analytics = () => {
    // Helper to find the max value in a dataset for scaling bars
    const getMaxValue = (data, key) => Math.max(...data.map(item => item[key]));
    const maxComments = getMaxValue(mockAnalytics.commentsData, 'comments');
    const maxReactions = getMaxValue(mockAnalytics.reactionsData, 'reactions');

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Analytics</h2>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-md flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full"><icons.ThumbsUp className="h-6 w-6 text-blue-600" /></div>
                    <div>
                        <p className="text-gray-500 text-sm">Total Reactions</p>
                        <p className="text-2xl font-bold text-gray-800">{mockAnalytics.totalReactions.toLocaleString()}</p>
                        <p className="text-xs text-green-500">+{mockAnalytics.reactionsChange}% this month</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-full"><icons.MessageCircle className="h-6 w-6 text-purple-600" /></div>
                    <div>
                        <p className="text-gray-500 text-sm">Total Comments</p>
                        <p className="text-2xl font-bold text-gray-800">{mockAnalytics.totalComments.toLocaleString()}</p>
                        <p className="text-xs text-green-500">+{mockAnalytics.commentsChange}% this month</p>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Comments Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-md">
                    <h3 className="font-bold text-lg text-gray-800 mb-4">Comments per Month</h3>
                    <div className="flex items-end justify-between h-64 space-x-2">
                        {mockAnalytics.commentsData.map(data => (
                            <div key={data.name} className="flex-1 flex flex-col items-center justify-end">
                                <div className="w-full bg-indigo-200 rounded-t-lg hover:bg-indigo-400 transition-colors" style={{ height: `${(data.comments / maxComments) * 100}%` }}></div>
                                <p className="text-xs text-gray-500 mt-2">{data.name}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reactions Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-md">
                    <h3 className="font-bold text-lg text-gray-800 mb-4">Reactions per Month</h3>
                    <div className="flex items-end justify-between h-64 space-x-2">
                        {mockAnalytics.reactionsData.map(data => (
                            <div key={data.name} className="flex-1 flex flex-col items-center justify-end">
                                <div className="w-full bg-pink-200 rounded-t-lg hover:bg-pink-400 transition-colors" style={{ height: `${(data.reactions / maxReactions) * 100}%` }}></div>
                                <p className="text-xs text-gray-500 mt-2">{data.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


// 5. Main Dashboard Component
const AdminDashboard = ({ onLogout }) => {
    const [activeView, setActiveView] = useState('dashboard');

    const NavItem = ({ icon, label, view, activeView, setActiveView }) => (
        <li
            onClick={() => setActiveView(view)}
            className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${
                activeView === view
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            }`}
        >
            {icon}
            <span className="ml-4 font-medium">{label}</span>
        </li>
    );

    const renderView = () => {
        switch (activeView) {
            case 'upload':
                return <MagazineUpload />;
            case 'feedback':
                return <UserFeedback />;
            case 'analytics':
                return <Analytics />;
            case 'dashboard':
            default:
                return (
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>
                        <div className="bg-white p-8 rounded-2xl shadow-md">
                            <h3 className="text-xl font-semibold">Welcome, Admin!</h3>
                            <p className="mt-2 text-gray-600">Select an option from the sidebar to get started.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white flex flex-col shadow-lg">
                <div className="h-20 flex items-center justify-center border-b">
                    <h1 className="text-2xl font-bold text-indigo-600">Admin Panel</h1>
                </div>
                <nav className="flex-1 px-4 py-4">
                    <ul>
                        <NavItem icon={<icons.LayoutDashboard />} label="Dashboard" view="dashboard" activeView={activeView} setActiveView={setActiveView} />
                        <NavItem icon={<icons.BookUp />} label="Upload Magazine" view="upload" activeView={activeView} setActiveView={setActiveView} />
                        <NavItem icon={<icons.MessageSquareQuote />} label="User Feedback" view="feedback" activeView={activeView} setActiveView={setActiveView} />
                        <NavItem icon={<icons.BarChart3 />} label="Analytics" view="analytics" activeView={activeView} setActiveView={setActiveView} />
                    </ul>
                </nav>
                <div className="p-4 border-t">
                     <button
                        onClick={onLogout}
                        className="flex items-center justify-center w-full p-3 rounded-lg cursor-pointer transition-colors text-red-500 bg-red-50 hover:bg-red-100"
                    >
                        <icons.LogOut />
                        <span className="ml-4 font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 overflow-y-auto">
                {renderView()}
            </main>
        </div>
    );
};


// --- App Component (Main Entry Point) ---
export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // This effect can be used to check for a token in a real app
    useEffect(() => {
        // const token = localStorage.getItem('admin-token');
        // if (token) setIsLoggedIn(true);
    }, []);

    const handleLogin = () => {
        // In a real app, you'd save a token here
        // localStorage.setItem('admin-token', 'your-jwt-token');
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        // localStorage.removeItem('admin-token');
        setIsLoggedIn(false);
    };

    return (
        <div className="App">
            {isLoggedIn ? (
                <AdminDashboard onLogout={handleLogout} />
            ) : (
                <AdminLogin onLogin={handleLogin} />
            )}
        </div>
    );
}
