// src/App.js
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Home from "./pages/Home";
import Archive from "./pages/Archive";
import About from "./pages/About";
import Submit from "./pages/Submit";
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ConfirmSignup from "./pages/ConfirmSignup";
import Notification from "./pages/Notification";
import MagazineReader from "./pages/MagazineReader";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminAccessButton from "./components/AdminAccessButton";
import AccessDenied from "./pages/AccessDenied";

// ────────────────────────────────
// Utilities
// ────────────────────────────────

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Guest Route: Only allow access if NOT logged in (e.g. login page)
const GuestRoute = ({ children }) => {
  const isAdmin = localStorage.getItem("vibeAdmin") === "true";
  return !isAdmin ? children : <Navigate to="/admin" replace />;
};

// ────────────────────────────────
// Layout Wrapper
// ────────────────────────────────
const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/vibelogin";
  const isResetPasswordPage = location.pathname === "/reset-password";
  const isConfirmSignupPage = location.pathname === "/confirm-signup";
  const isNotificationPage = location.pathname === "/notification";
  const isMagazineReaderPage = location.pathname === "/magazine-reader";
  const isAdminPage = location.pathname.startsWith("/admin");
  const isAccessDeniedPage = location.pathname === "/access-denied";
  const isAuthPage = isLoginPage || isResetPasswordPage || isConfirmSignupPage || isNotificationPage || isAccessDeniedPage;

  // Secret keyboard shortcut: Ctrl + Shift + V to access admin login
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl + Shift + V opens admin login
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        navigate('/vibelogin');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-purple-900 text-gray-100">
      <ScrollToTop />

      {/* Navbar - show only on public pages */}
      {!isAuthPage && !isAdminPage && !isMagazineReaderPage && <Navbar />}

      {/* Main */}
      <main className={`flex-grow ${!isAuthPage && !isAdminPage && !isMagazineReaderPage ? "pt-16" : ""}`}>
        {children}
      </main>

      {/* Footer - only on public pages */}
      {!isAuthPage && !isAdminPage && !isMagazineReaderPage && <Footer />}

    </div>
  );
};

// ────────────────────────────────
// App
// ────────────────────────────────
function App() {
  return (
    <Router>
      <Layout>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/about" element={<About />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/contact" element={<Contact />} />

          {/* Magazine Reader - Fullscreen dedicated page */}
          <Route path="/magazine-reader" element={<MagazineReader />} />

          {/* Login Page */}
          <Route
            path="/vibelogin"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />

          {/* Password Reset Page */}
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Email Confirmation Page */}
          <Route path="/confirm-signup" element={<ConfirmSignup />} />

          {/* Notification Page */}
          <Route path="/notification" element={<Notification />} />

          {/* Access Denied Page */}
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
