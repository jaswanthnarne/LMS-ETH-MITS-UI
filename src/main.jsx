import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ShieldCheck, CalendarCheck, PlayCircle, Code2, GraduationCap, X, Bell, Trophy, Sun, Moon, Monitor, MapPin, Mail, Youtube, Linkedin, Instagram, Eye, EyeOff } from 'lucide-react';
import './styles.css';

// Import Layout and Shared
import Layout from './components/Layout';
import { Field, Select, Notice } from './components/Shared';

// Import Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AttendanceLogs from './pages/admin/AttendanceLogs';
import AdminCheckinLogs from './pages/admin/AdminCheckinLogs';
import LeaveRequests from './pages/admin/LeaveRequests';
import BatchManagement from './pages/admin/BatchManagement';
import TaskManagement from './pages/admin/TaskManagement';
import SubmissionReviews from './pages/admin/SubmissionReviews';
import QuizManagement from './pages/admin/QuizManagement';
import AdminLeetcode from './pages/admin/AdminLeetcode';

// Import Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import LeaveApplication from './pages/student/LeaveApplication';
import MyAttendance from './pages/student/MyAttendance';
import StudentCheckin from './pages/student/StudentCheckin';
import MyTasks from './pages/student/MyTasks';
import LiveQuizPlayer from './pages/student/LiveQuizPlayer';
import StudentLeetcode from './pages/student/StudentLeetcode';

// Import Chat
import BatchChat from './pages/chat/BatchChat';

// Import Shared Pages
import Profile from './pages/shared/Profile';
import Leaderboard from './pages/shared/Leaderboard';
import { Testimonial } from './components/ui/testimonial-card';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const socket = io(API_URL, { autoConnect: false });

const testimonials = [
  {
    name: "Rahul",
    role: "Full Stack Student",
    company: "FISAT",
    rating: 5,
    testimonial: "Jaswanth Narne's training helped me master Java microservices. The automated LeetCode growth charts kept our batch highly competitive."
  },
  {
    name: "Vijay",
    role: "DSA Bootcamp Lead",
    company: "MIT",
    rating: 5,
    testimonial: "The real-time quiz assessments and code reviews made learning incredibly active. Best training system I have ever worked with."
  },
  {
    name: "Amar",
    role: "Software Associate",
    company: "TCE Gadag",
    rating: 5,
    testimonial: "Highly professional portal. It integrates check-ins, leaderboard marks, and assignment grades cleanly in one dashboard."
  },
  {
    name: "Amruth",
    role: "Systems Graduate",
    company: "MITS Madanapalle",
    rating: 5,
    testimonial: "This platform tracking resolved code submissions and streak metrics transformed our technical skill confidence entirely."
  }
];

const empty = {
  auth: { name: '', email: '', password: '', role: 'student', rollNumber: '', phone: '', batchCode: '' },
  batch: { name: '', code: '', description: '', mentor: 'Jaswanth Narne', startDate: '', college: '' },
  college: { name: '', code: '' },
  task: { title: '', description: '', batch: '', dueDate: '', maxScore: 100, leetcodeUrl: '' },
  submission: { task: '', githubUrl: '', liveUrl: '', notes: '' },
  review: { score: '', feedback: '', status: 'accepted' },
  leave: { type: 'single-day', fromDate: '', toDate: '', hours: 0, reason: '' },
  quiz: {
    title: '',
    batch: '',
    durationSeconds: 60,
    questions: [{ text: '', options: ['', '', '', ''], correctIndex: 0, points: 1 }]
  },
  answer: {},
  leetcode: { username: '', easy: 0, medium: 0, hard: 0, streak: 0 },
  leetcodeProblem: { title: '', url: '', batch: '', dueDate: '' },
  leetcodeAttempt: {},
  leetcodeReview: { score: 0, feedback: '', status: 'accepted' },
  message: { text: '' },
  filters: { date: new Date().toISOString().slice(0, 10), batch: '' }
};

function client(token) {
  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
    postForm: (path, body) => request(path, { method: 'POST', body }),
    patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path) => request(path, { method: 'DELETE' }),
    getUri: () => API_URL
  };
}

function MobileBlocker() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center text-textPrimary">
      <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center shadow-lg border border-borderCool/60 p-1 mb-8">
        <img src="/ethnotech_academic_solutions_logo.jpg" alt="Ethnotech Logo" className="w-full h-full object-contain rounded-xl" />
      </div>
      <h1 className="font-title text-3xl font-black tracking-tight mb-4 text-textPrimary">Desktop Access Required</h1>
      <p className="text-textSecondary text-sm max-w-sm leading-relaxed mb-8 font-light">
        This comprehensive learning management system is highly optimized for desktop environments to support live code reviews, IDE integrations, and real-time structured assessments.
        <br/><br/>
        Please switch to a laptop or desktop computer to access your workspace.
      </p>
      <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-primary bg-primary/10 px-5 py-2.5 rounded-full border border-primary/20 shadow-sm">
        <Monitor size={16} /> OPTIMIZED FOR LARGER SCREENS
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center text-textPrimary">
      <h1 className="font-title text-9xl font-black text-borderCool mb-2 drop-shadow-sm">404</h1>
      <h2 className="font-title text-3xl font-extrabold mb-4 text-textPrimary tracking-tight">Page Not Found</h2>
      <p className="text-textSecondary text-sm max-w-md leading-relaxed mb-8 font-light">
        The page you are looking for does not exist, has been moved, or you might not have access to it.
      </p>
      <button 
        onClick={() => window.location.href = '/'}
        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl shadow-lg hover:shadow-primary/25 transition-all duration-300 font-bold text-sm tracking-wide"
      >
        Return to Portal
      </button>
    </div>
  );
}

function ToastContainer({ toasts, setToasts }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[9999] w-full max-w-[360px] md:max-w-[420px] px-4 pointer-events-none">
      {toasts.map((t) => {
        const toastTypeCls = t.type === 'success' 
          ? 'border-success text-success bg-success-light dark:bg-success/15' 
          : t.type === 'error' 
          ? 'border-danger text-danger bg-danger-light dark:bg-danger/15' 
          : 'border-primary text-primary bg-primary-light';

        return (
          <div 
            key={t.id} 
            className={`flex items-center gap-3.5 px-5 py-3 bg-bgSecondary border rounded-xl shadow-lg text-xs font-semibold animate-slide-down pointer-events-auto ${toastTypeCls}`}
          >
            <Bell size={14} className="shrink-0" />
            <span className="flex-1 truncate pr-1">{t.message}</span>
            <button 
              className="opacity-50 hover:opacity-100 transition-opacity p-0.5 shrink-0" 
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function LoadingOverlay() {
  return (
    <>
      <style>{`
        @keyframes loading-progress {
          0% { left: -40%; right: 100%; }
          50% { left: 80%; right: -20%; }
          100% { left: 100%; right: -40%; }
        }
      `}</style>
      <div className="fixed top-0 left-0 right-0 h-1 bg-primary/25 z-[10000] overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 bottom-0 bg-primary rounded-full" 
          style={{ animation: 'loading-progress 1.5s infinite ease-in-out' }}
        ></div>
      </div>
    </>
  );
}

function LegalModal({ type, onClose }) {
  if (!type) return null;

  const content = {
    terms: {
      title: "Terms of Service",
      body: (
        <div className="space-y-6 text-sm text-textSecondary leading-relaxed">
          <p>Welcome to the Ethnotech Academy & MITS Learning Management System. By accessing or using our platform, you agree to comply with and be bound by these Terms of Service.</p>
          <h2 className="text-xl font-bold text-textPrimary mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By registering for an account, accessing course materials, or participating in any learning activities on this platform, you agree to these terms. If you do not agree to these terms, please do not use the platform.</p>
          <h2 className="text-xl font-bold text-textPrimary mt-8 mb-4">2. User Accounts</h2>
          <p>You must provide accurate and complete registration information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
          <h2 className="text-xl font-bold text-textPrimary mt-8 mb-4">3. Academic Integrity</h2>
          <p>Users are expected to maintain the highest standards of academic integrity. Plagiarism, cheating on assessments, or unauthorized sharing of answers is strictly prohibited and may result in account termination.</p>
          <h2 className="text-xl font-bold text-textPrimary mt-8 mb-4">4. Platform Modifications</h2>
          <p>We reserve the right to modify, suspend, or discontinue any part of the platform at any time without prior notice. We will not be liable to you or any third party for any modification or discontinuation.</p>
        </div>
      )
    },
    privacy: {
      title: "Privacy Policy",
      body: (
        <div className="space-y-6 text-sm text-textSecondary leading-relaxed">
          <p>At Ethnotech Academy, we are committed to protecting your privacy and ensuring the security of your personal information.</p>
          <h2 className="text-xl font-bold text-textPrimary mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, update your profile, or submit assignments. This includes your name, email address, student ID, and academic performance data.</p>
          <h2 className="text-xl font-bold text-textPrimary mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, to process your assessments, to communicate with you, and to generate academic performance reports for the institution.</p>
          <h2 className="text-xl font-bold text-textPrimary mt-8 mb-4">3. Data Sharing</h2>
          <p>Your academic data and progress are shared with your instructors and institutional administrators at MITS. We do not sell your personal information to third parties.</p>
          <p>If you have any questions regarding this Privacy Policy, please contact us at narnejaswanth83@gmail.com.</p>
        </div>
      )
    },
    security: {
      title: "Security Overview",
      body: (
        <div className="space-y-6 text-sm text-textSecondary leading-relaxed">
          <p>Security is a foundational element of the Ethnotech Academy platform. We employ industry-standard measures to protect your data.</p>
          <h2 className="text-xl font-bold text-textPrimary mt-8 mb-4">1. Data Encryption</h2>
          <p>All data transmitted between your browser and our servers is encrypted using standard TLS protocols. Sensitive data at rest is also encrypted using robust algorithms.</p>
          <h2 className="text-xl font-bold text-textPrimary mt-8 mb-4">2. Authentication</h2>
          <p>We use secure, token-based authentication mechanisms to verify your identity and protect your account from unauthorized access. Passwords are cryptographically hashed and salted.</p>
          <h2 className="text-xl font-bold text-textPrimary mt-8 mb-4">3. Vulnerability Management</h2>
          <p>Our systems are continuously monitored for vulnerabilities. We apply security patches and updates promptly to ensure the platform remains secure against emerging threats.</p>
          <h2 className="text-xl font-bold text-textPrimary mt-8 mb-4">4. Reporting Issues</h2>
          <p>If you discover a security vulnerability, please report it immediately to narnejaswanth83@gmail.com. We take all reports seriously and will investigate promptly.</p>
        </div>
      )
    }
  }[type];

  if (!content) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="absolute inset-0 bg-[#0a0f1c]/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transition-all">
        <div className="flex items-center justify-between p-6 lg:p-8 border-b border-borderCool">
          <h2 className="font-title text-2xl font-extrabold text-textPrimary">{content.title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-bgSecondary text-textMuted hover:text-textPrimary transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 lg:p-10 overflow-y-auto">
          {content.body}
        </div>
      </div>
    </div>
  );
}

function Footer({ onOpenLegal }) {
  return (
    <footer className="bg-[#0a0f1c] text-white py-16 px-6 sm:px-10 lg:px-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 mb-16">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center overflow-hidden">
              <img src="/ethnotech_academic_solutions_logo.jpg" alt="Ethnotech" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-title font-bold text-lg tracking-wide">Ethnotech Academy</h3>
              <span className="text-[10px] uppercase tracking-widest text-textMuted font-bold text-slate-400">Future Skills Hub</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md font-light">
            Equipping the next generation of professionals with the skills and knowledge required to thrive in today's fast-paced global job market.
          </p>
          <div className="flex gap-4 mt-2">
            <div className="w-14 h-14 bg-white rounded-xl p-2 flex items-center justify-center">
              <img src="/ethnotech_academic_solutions_logo.jpg" alt="Partner 1" className="w-full h-full object-contain" />
            </div>
            <div className="w-14 h-14 bg-white rounded-xl p-2 flex items-center justify-center">
              <img src="/MITS LOGO.jpg" alt="Partner 2" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-5">
            <h4 className="text-[11px] font-bold tracking-widest uppercase text-white">Contact</h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 text-sm text-slate-400 font-light">
                <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  SK Arena Building, BDA Link Rd, Channasandra, <br/>
                  Rajarajeshwari Nagar, Bengaluru, Karnataka 560098
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400 font-light">
                <Mail size={18} className="text-primary shrink-0" />
                <span>narnejaswanth83@gmail.com</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <h4 className="text-[11px] font-bold tracking-widest uppercase text-white">Connect With Us</h4>
            <div className="flex gap-3">
              <a href="https://www.youtube.com/@EthnotechAcademy" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300">
                <Youtube size={18} />
              </a>
              <a href="https://www.linkedin.com/company/ethnotech-academic-solutions/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300">
                <Linkedin size={18} />
              </a>
              <a href="https://www.instagram.com/ethnotech_academy/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300">
                <Instagram size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/10 text-xs text-slate-500 font-light">
        <p>© 2026 Ethnotech Educational Solutions Pvt Ltd. All Rights Reserved.</p>
        <div className="flex gap-6">
          <button onClick={() => onOpenLegal('terms')} className="hover:text-white transition-colors">Terms</button>
          <button onClick={() => onOpenLegal('privacy')} className="hover:text-white transition-colors">Privacy</button>
          <button onClick={() => onOpenLegal('security')} className="hover:text-white transition-colors">Security</button>
        </div>
      </div>
    </footer>
  );
}

function FirstTimePasswordChange({ user, api, action, refresh, logout }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMsg('New password cannot be the same as current password');
      return;
    }

    const res = await action(async () => {
      return await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
    }, 'Password updated successfully!');

    if (res) {
      await refresh('silent');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-textPrimary select-none">
      <div className="flex items-center gap-3 mb-8 bg-white p-3 rounded-2xl border border-borderCool shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow overflow-hidden border p-0.5">
          <img src="/ethnotech_academic_solutions_logo.jpg" alt="Ethnotech" className="w-full h-full object-contain rounded-lg" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[9px] uppercase tracking-widest text-textMuted font-bold">LMS Portal</span>
          <strong className="text-textPrimary font-title text-xs tracking-wide">MITS | Ethnotech</strong>
        </div>
      </div>

      <form 
        className="w-full max-w-md p-8 sm:p-10 rounded-[32px] bg-white border border-borderCool flex flex-col gap-6 text-textPrimary shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] animate-in fade-in zoom-in duration-300" 
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-black font-title tracking-tight text-textPrimary">
            Secure Your Account
          </h2>
          <p className="text-xs text-textMuted leading-relaxed font-body">
            This is your first login. To protect your profile, please change your default password before accessing your workspace.
          </p>
        </div>

        {errorMsg && (
          <div className="text-xs text-danger bg-danger/10 border border-danger/20 p-3 rounded-xl font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <div className="auth-input-container">
          <label className="auth-input-label">Current Password</label>
          <input 
            type="password" 
            required 
            className="auth-input-field" 
            placeholder="Enter current password" 
            value={currentPassword} 
            onChange={(e) => setCurrentPassword(e.target.value)} 
          />
        </div>

        <div className="auth-input-container">
          <label className="auth-input-label">New Password</label>
          <div className="relative w-full">
            <input 
              type={showPass ? 'text' : 'password'} 
              required 
              className="auth-input-field pr-12 w-full" 
              placeholder="Min 6 characters" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-textMuted hover:text-textPrimary hover:bg-bgSecondary transition-colors flex items-center justify-center"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="auth-input-container">
          <label className="auth-input-label">Confirm New Password</label>
          <input 
            type="password" 
            required 
            className="auth-input-field" 
            placeholder="Confirm new password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
          />
        </div>
        
        <div className="flex flex-col gap-3 mt-4">
          <button className="flex items-center justify-center gap-2 w-full text-center text-sm font-semibold bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl shadow-lg hover:shadow-primary/25 transition-all duration-300">
            <ShieldCheck size={18} /> Update & Enter Workspace
          </button>
          
          <button 
            type="button" 
            onClick={logout} 
            className="w-full text-center text-xs font-semibold text-textMuted hover:text-textPrimary hover:underline transition-colors py-2"
          >
            Cancel and Log Out
          </button>
        </div>
      </form>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const prefix = user?.role === 'admin' ? '/admin/root/console' : '';
  let rawPath = location.pathname;
  if (rawPath.startsWith('/admin/root/console')) {
    rawPath = rawPath.substring('/admin/root/console'.length);
  }
  const path = rawPath.replace(/^\/+/, '') || 'dashboard';

  const validPaths = ['dashboard', 'attendance', 'checkin', 'leaves', 'batches', 'tasks', 'reviews', 'quizzes', 'leetcode', 'leaderboard', 'chat', 'profile'];
  const isNotFound = location.pathname !== '/' && !validPaths.includes(path);
  const active = path;

  const setActive = (newActive) => navigate(`${prefix}/${newActive}`);

  const [token, setToken] = useState(localStorage.getItem('mits_lms_token') || '');
  const [mode, setMode] = useState('login');

  const [forms, setForms] = useState(empty);
  const [toasts, setToasts] = useState([]);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState({
    summary: {},
    batches: [],
    pending: [],
    attendance: [],
    leaves: [],
    tasks: [],
    submissions: [],
    quizzes: [],
    quizAttempts: {},
    leetcode: [],
    leetcodeProblems: [],
    leetcodeSubmissions: [],
    messages: [],
    colleges: []
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [legalModal, setLegalModal] = useState(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const api = useMemo(() => client(token), [token]);

  function addToast(message, type = 'info') {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  function setForm(group, key, value) {
    setForms((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));
  }

  async function refresh(section = 'all') {
    if (!token) return;
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setLoading(true);
    try {
      const me = await api.get('/api/auth/me');
      setUser(me);
      const [summary, batches, tasks, quizzes, leetcodeProblems, colleges] = await Promise.all([
        api.get('/api/analytics/summary'),
        api.get('/api/batches'),
        api.get('/api/tasks'),
        api.get('/api/quiz'),
        api.get('/api/leetcode/problems'),
        api.get('/api/colleges')
      ]);

      const next = { summary, batches, tasks, quizzes, leetcodeProblems, colleges };
      if (me.role === 'admin') {
        const query = new URLSearchParams();
        if (forms.filters.date) query.set('date', forms.filters.date);
        if (forms.filters.batch) query.set('batch', forms.filters.batch);
        Object.assign(next, {
          pending: await api.get('/api/auth/pending'),
          attendance: await api.get(`/api/attendance/logs?${query.toString()}`),
          leaves: await api.get('/api/leave'),
          submissions: await api.get('/api/tasks/submissions'),
          leetcode: await api.get('/api/leetcode'),
          leetcodeSubmissions: await api.get('/api/leetcode/submissions')
        });
      } else {
        Object.assign(next, {
          attendance: await api.get('/api/attendance/mine'),
          leaves: await api.get('/api/leave/mine'),
          leetcode: (await api.get('/api/leetcode/mine')) || null,
          submissions: await api.get('/api/tasks/submissions/mine')
        });
      }
      setState((current) => ({ ...current, ...next }));
      if (section !== 'silent') {
        addToast('LMS Workspace synchronized successfully', 'success');
      }
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
      refreshingRef.current = false;
    }
  }

  async function action(fn, success) {
    try {
      const result = await fn();
      await refresh('silent');
      if (success) addToast(success, 'success');
      return result;
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  useEffect(() => {
    refresh('silent');
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const sendHeartbeat = () => api.post('/api/auth/heartbeat').catch(() => {});
    sendHeartbeat(); // immediate ping
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [token, api]);

  useEffect(() => {
    if (!user?.batch?._id && user?.role !== 'admin') return;
    if (API_URL.includes('vercel.app')) {
      console.log('Skipping Socket.io connection on Vercel serverless environment.');
      return;
    }
    socket.connect();
    if (user?.batch?._id) socket.emit('join-batch', user.batch._id);
    
    socket.on('batch-message', (message) => {
      setState((current) => {
        const exists = current.messages.some((m) => String(m._id) === String(message._id));
        if (exists) return current;
        return { ...current, messages: [...current.messages, message] };
      });
    });

    socket.on('delete-message', (payload) => {
      setState((current) => ({
        ...current,
        messages: current.messages.filter((m) => String(m._id) !== String(payload.id))
      }));
    });

    socket.on('edit-message', (payload) => {
      setState((current) => ({
        ...current,
        messages: current.messages.map((m) => String(m._id) === String(payload._id) ? payload : m)
      }));
    });
    
    socket.on('quiz-update', (payload) => {
      addToast(`Live quiz update: ${payload.title || 'question changed'}`, 'info');
    });
    
    return () => {
      socket.off('batch-message');
      socket.off('delete-message');
      socket.off('edit-message');
      socket.off('quiz-update');
      socket.disconnect();
    };
  }, [user?._id, user?.batch?._id]);

  async function submitAuth(event) {
    event.preventDefault();
    const submitPath = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    await action(async () => {
      const result = await api.post(submitPath, forms.auth);
      if (!result.token) {
        addToast('Registration submitted. Admin approval is required before login.', 'info');
        return;
      }
      localStorage.setItem('mits_lms_token', result.token);
      setToken(result.token);
      setUser(result.user);
      const userPrefix = result.user?.role === 'admin' ? '/admin/root/console' : '';
      navigate(`${userPrefix}/dashboard`);
    });
  }

  function logout() {
    localStorage.removeItem('mits_lms_token');
    setToken('');
    setUser(null);
    navigate('/');
  }

  if (isMobile) {
    return <MobileBlocker />;
  }

  if (isNotFound) {
    return <NotFound />;
  }

  if (!token || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
      <main className="w-full flex flex-col px-6 sm:px-10 lg:px-16 py-12 lg:py-20 text-textPrimary overflow-hidden flex-1">

        {/* Top Header & Login Area */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-20 w-full mb-16 lg:mb-24">


        <section className="flex-1 w-full min-w-0 flex flex-col z-10 order-2 lg:order-1 select-none lg:pr-8">
          {/* Brand Logo Header */}
          <div className="flex flex-wrap items-center gap-4 mb-8 bg-bgSecondary p-4 rounded-2xl border border-borderCool w-fit shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0 select-none overflow-hidden border border-borderCool/60 p-0.5">
                <img src="/MITS LOGO.jpg" alt="MITS Logo" className="w-full h-full object-contain rounded-lg" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-textMuted font-bold">Academic Partner</span>
                <strong className="text-textPrimary font-title text-sm tracking-wide">MITS Madanapalle</strong>
              </div>
            </div>
            <div className="hidden sm:block h-10 w-[1px] bg-borderCool mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0 select-none overflow-hidden border border-borderCool/60 p-0.5">
                <img src="/ethnotech_academic_solutions_logo.jpg" alt="Ethnotech Logo" className="w-full h-full object-contain rounded-lg" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-textMuted font-bold">Industry Partner</span>
                <strong className="text-textPrimary font-title text-sm tracking-wide">Ethnotech Academy</strong>
              </div>
            </div>
          </div>

          {/* Glowing Badges & Title */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-5 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            Co-Branded Learning Portal v2.0
          </div>

          <h1 className="font-title text-5xl lg:text-6xl font-black text-textPrimary tracking-tight leading-[1.15] mb-6">
            Madanapalle Institute <br/>
            <span className="animate-glow-cyan-text">of Technology & Science</span>
          </h1>
          
          <p className="text-textSecondary text-base font-light max-w-3xl leading-relaxed mb-10">
            Welcome to the joint learning management system, custom-engineered with Ethnotech Academy. This unified portal coordinates automated LeetCode milestone tracking, live quizzes, manual classroom attendance, and teacher submission reviews.
          </p>

          {/* Trainer Spotlight Card */}
          <div className="bg-bgSecondary border border-borderCool p-5 rounded-2xl max-w-xl mb-10 shadow-md transition-all duration-300 hover:border-primary/20 group">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="h-14 w-14 rounded-full bg-primary text-white border border-borderCool flex items-center justify-center font-title font-bold text-lg shadow-sm">
                  JN
                </div>
                <div className="absolute -bottom-0.5 -right-0.5">
                  <div className="auth-pulse-dot"></div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] bg-primary/10 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Trainer & Mentor
                  </span>
                  <span className="text-[9px] bg-success-light text-success-text border border-success/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Ethnotech Academy
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-textPrimary mt-2 tracking-wide font-title">Jaswanth Narne</h3>
                <p className="text-textMuted text-xs font-light mt-1.5 leading-relaxed">
                  Full Stack Java Trainer — Ethnotech Academy. Overseeing core Java development, React microservices, and DSA challenge patterns.
                </p>
              </div>
            </div>
          </div>

        </section>

        {/* Rebuilt Auth Card with Pure Tailwind */}
        <form className="w-full lg:w-[480px] shrink-0 p-8 lg:p-12 rounded-[32px] bg-white border border-borderCool flex flex-col gap-6 text-textPrimary z-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] order-1 lg:order-2 mb-12 lg:mb-0 lg:mt-[60px]" onSubmit={submitAuth}>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-3xl font-extrabold font-title tracking-tight text-textPrimary">
              Welcome Back
            </h2>
            <p className="text-sm text-textMuted font-light font-body">
              Please log in to enter your workspace.
            </p>
          </div>

          <div className="auth-input-container">
            <label className="auth-input-label">Email Address</label>
            <input 
              type="email" 
              required 
              className="auth-input-field" 
              placeholder="student@mits.ac.in" 
              value={forms.auth.email} 
              onChange={(e) => setForm('auth', 'email', e.target.value)} 
            />
          </div>

          <div className="auth-input-container">
            <label className="auth-input-label">Password</label>
            <div className="relative w-full">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required 
                className="auth-input-field pr-12 w-full" 
                placeholder="••••••••" 
                value={forms.auth.password} 
                onChange={(e) => setForm('auth', 'password', e.target.value)} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-textMuted hover:text-textPrimary hover:bg-bgSecondary transition-colors flex items-center justify-center"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button className="flex items-center justify-center gap-2 w-full text-center text-base font-semibold bg-primary hover:bg-primary-hover text-white py-4 rounded-xl shadow-lg hover:shadow-primary/25 mt-4 transition-all duration-300">
            <ShieldCheck size={20} /> Sign In to Portal
          </button>
          
          {notice && <Notice text={notice} />}
        </form>
      </div>

      {/* Full-width Features & Testimonials */}
      <section className="w-full flex flex-col z-10 select-none">
          {/* Showcase Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-full py-6">
            <div className="bg-white border border-borderCool hover:border-primary/30 p-6 md:p-8 rounded-3xl flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg h-full group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0">
                <CalendarCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-textPrimary tracking-wide font-title">Attendance & Check-ins</h4>
                <p className="text-[11.5px] text-textMuted mt-1 leading-relaxed font-light">
                  Manual batch attendance rosters combined with automated student check-in session timers.
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-borderCool hover:border-success/30 p-6 md:p-8 rounded-3xl flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg h-full group">
              <div className="w-10 h-10 rounded-xl bg-success-light text-success flex items-center justify-center group-hover:bg-success group-hover:text-white transition-all duration-300 shrink-0">
                <Code2 size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-textPrimary tracking-wide font-title">LeetCode Growth</h4>
                <p className="text-[11.5px] text-textMuted mt-1 leading-relaxed font-light">
                  Direct student statistics fetching to coordinate streaks, solved counts, and active scores.
                </p>
              </div>
            </div>

            <div className="bg-white border border-borderCool hover:border-purple/30 p-6 md:p-8 rounded-3xl flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg h-full group">
              <div className="w-10 h-10 rounded-xl bg-purple-light text-purple flex items-center justify-center group-hover:bg-purple group-hover:text-white transition-all duration-300 shrink-0">
                <PlayCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-textPrimary tracking-wide font-title">Quizzes & Assessments</h4>
                <p className="text-[11.5px] text-textMuted mt-1 leading-relaxed font-light">
                  Real-time interactive batch tests with integrated countdown timers and auto-graded leaderboards.
                </p>
              </div>
            </div>

            <div className="bg-white border border-borderCool hover:border-warning/30 p-6 md:p-8 rounded-3xl flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg h-full group">
              <div className="w-10 h-10 rounded-xl bg-warning-light text-warning flex items-center justify-center group-hover:bg-warning group-hover:text-white transition-all duration-300 shrink-0">
                <Trophy size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-textPrimary tracking-wide font-title">Dynamic Scoreboards</h4>
                <p className="text-[11.5px] text-textMuted mt-1 leading-relaxed font-light">
                  Consolidated rankings weighing student milestones, Streaks, check-ins, and verified work.
                </p>
              </div>
            </div>
          </div>

          {/* Testimonials section */}
          <div className="mt-16 pt-12 border-t border-borderCool">
            <span className="text-[11px] uppercase tracking-widest text-primary font-bold">Student Testimonials</span>
            <h3 className="text-2xl font-bold font-title text-textPrimary mt-2 mb-8">Success Stories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-full">
              {testimonials.map((t) => (
                <Testimonial key={t.name} {...t} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer onOpenLegal={setLegalModal} />
      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
      
      <ToastContainer toasts={toasts} setToasts={setToasts} />
      {loading && <LoadingOverlay />}
      </div>
    );
  }
  if (token && user && user.mustChangePassword) {
    return (
      <>
        <FirstTimePasswordChange user={user} api={api} action={action} refresh={refresh} logout={logout} />
        <ToastContainer toasts={toasts} setToasts={setToasts} />
        {loading && <LoadingOverlay />}
      </>
    );
  }

  return (
    <Layout user={user} active={active} setActive={setActive} refresh={refresh} logout={logout} loading={loading} colleges={state.colleges} api={api} action={action} data={state}>
      {notice && <Notice text={notice} />}
      
      {active === 'dashboard' && (
        user.role === 'admin' ? (
          <AdminDashboard user={user} data={state} api={api} action={action} go={setActive} />
        ) : (
          <StudentDashboard user={user} data={state} api={api} action={action} go={setActive} />
        )
      )}

      {active === 'attendance' && (
        user.role === 'admin' ? (
          <AttendanceLogs data={state} forms={forms} setForm={setForm} api={api} action={action} refresh={refresh} />
        ) : (
          <MyAttendance data={state} api={api} action={action} />
        )
      )}

      {active === 'checkin' && (
        user.role === 'admin' ? (
          <AdminCheckinLogs data={state} forms={forms} setForm={setForm} api={api} action={action} refresh={refresh} />
        ) : (
          <StudentCheckin data={state} api={api} action={action} />
        )
      )}

      {active === 'leaves' && (
        user.role === 'admin' ? (
          <LeaveRequests data={state} api={api} action={action} />
        ) : (
          <LeaveApplication data={state} forms={forms} setForm={setForm} api={api} action={action} />
        )
      )}

      {active === 'batches' && (
        <BatchManagement data={state} forms={forms} setForm={setForm} api={api} action={action} />
      )}

      {active === 'tasks' && (
        user.role === 'admin' ? (
          <TaskManagement data={state} forms={forms} setForm={setForm} api={api} action={action} />
        ) : (
          <MyTasks data={state} forms={forms} setForm={setForm} api={api} action={action} />
        )
      )}

      {active === 'reviews' && (
        <SubmissionReviews data={state} forms={forms} setForm={setForm} api={api} action={action} />
      )}

      {active === 'quizzes' && (
        user.role === 'admin' ? (
          <QuizManagement data={state} forms={forms} setForm={setForm} api={api} action={action} setState={setState} socket={socket} />
        ) : (
          <LiveQuizPlayer data={state} forms={forms} setForm={setForm} api={api} action={action} />
        )
      )}

      {active === 'leetcode' && (
        user.role === 'admin' ? (
          <AdminLeetcode data={state} forms={forms} setForm={setForm} api={api} action={action} />
        ) : (
          <StudentLeetcode user={user} data={state} forms={forms} setForm={setForm} api={api} action={action} />
        )
      )}

      {active === 'leaderboard' && (
        <Leaderboard user={user} data={state} forms={forms} setForm={setForm} api={api} action={action} />
      )}

      {active === 'chat' && (
        <BatchChat user={user} data={state} forms={forms} setForm={setForm} api={api} action={action} setState={setState} socket={socket} />
      )}

      {active === 'profile' && (
        <Profile user={user} api={api} action={action} refresh={refresh} />
      )}

      <ToastContainer toasts={toasts} setToasts={setToasts} />
      {loading && <LoadingOverlay />}
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
