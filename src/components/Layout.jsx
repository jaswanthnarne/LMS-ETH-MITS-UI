import React, { useState } from 'react';
import {
  LayoutDashboard, CalendarCheck, ClipboardList, Users, BookOpen,
  ClipboardCheck, PlayCircle, Code2, MessageSquare, RefreshCw,
  LogOut, Search, Bell, Sun, Moon, Menu, X, User, Trophy, Clock, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Field, Modal } from './Shared';
export default function Layout({ user, active, setActive, refresh, logout, children, loading, colleges = [], api, action, data = {}, unreadChatCount = 0 }) {
  const adminNav = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'attendance', icon: CalendarCheck, label: 'Take Attendance' },
    { id: 'checkin', icon: Clock, label: 'Check-in Logs' },
    { id: 'leaves', icon: ClipboardList, label: 'Leave Requests' },
    { id: 'batches', icon: Users, label: 'My Batches' },
    { id: 'tasks', icon: BookOpen, label: 'Task Management' },
    { id: 'reviews', icon: ClipboardCheck, label: 'Submission Reviews' },
    { id: 'quizzes', icon: PlayCircle, label: 'Exams & Quizzes' },
    { id: 'leetcode', icon: Code2, label: 'Leetcode Tracker' },
    { id: 'leaderboard', icon: Trophy, label: 'Overall Leaderboard' },
    { id: 'marks', icon: Award, label: 'Marks Tracker' },
    { id: 'chat', icon: MessageSquare, label: 'Batch Chat' },
    { id: 'profile', icon: User, label: 'My Profile' }
  ];

  const studentNav = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'marks', icon: Award, label: 'My Marks & Attendance' },
    { id: 'todo', icon: ClipboardList, label: 'My Todo' },
    { id: 'checkin', icon: Clock, label: 'Daily Check-in' },
    { id: 'tasks', icon: BookOpen, label: 'My Tasks' },
    { id: 'submissions', icon: ClipboardCheck, label: 'My Submissions' },
    { id: 'quizzes', icon: PlayCircle, label: 'My Quizzes' },
    { id: 'leetcode', icon: Code2, label: 'Leetcode Growth' },
    { id: 'leaderboard', icon: Trophy, label: 'Overall Leaderboard' },
    { id: 'chat', icon: MessageSquare, label: 'Batch Chat' },
    { id: 'profile', icon: User, label: 'My Profile' }
  ];

  const navItems = user.role === 'admin' ? adminNav : studentNav;
  const prefix = user.role === 'admin' ? '/admin/root/console' : '';

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', phone: user?.phone || '', rollNumber: user?.rollNumber || '',
    leetcodeUsername: user?.leetcodeUsername || '', githubUrl: user?.githubUrl || '', linkedinUrl: user?.linkedinUrl || ''
  });

  const openProfile = () => {
    setProfileForm({
      name: user?.name || '', phone: user?.phone || '', rollNumber: user?.rollNumber || '',
      leetcodeUsername: user?.leetcodeUsername || '', githubUrl: user?.githubUrl || '', linkedinUrl: user?.linkedinUrl || ''
    });
    setIsProfileOpen(true);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await action(async () => {
      const updated = await api.postForm('/api/auth/me', formData);
      if (updated && refresh) await refresh('silent');
    }, 'Profile updated successfully');
    setIsProfileOpen(false);
  };

  const getRealNotifications = () => {
    const list = [];
    if (!user) return list;
    
    if (user.role === 'admin') {
      const pendingApprovals = data.pending || [];
      pendingApprovals.forEach(p => {
        list.push({
          id: `approve-${p._id}`,
          title: 'Pending Registration',
          message: `${p.name} (${p.rollNumber || 'No Roll'}) requested approval.`,
          type: 'approval',
          targetTab: 'batches'
        });
      });

      const pendingLeaves = (data.leaves || []).filter(l => l.status === 'pending');
      pendingLeaves.forEach(l => {
        list.push({
          id: `leave-${l._id}`,
          title: 'New Leave Request',
          message: `${l.student?.name || 'A student'} requested leave.`,
          type: 'leave',
          targetTab: 'leaves'
        });
      });

      const pendingReviews = (data.submissions || []).filter(s => s.status === 'submitted');
      pendingReviews.forEach(s => {
        list.push({
          id: `review-${s._id}`,
          title: 'New Submission',
          message: `${s.student?.name || 'A student'} submitted "${s.task?.title || 'Task'}".`,
          type: 'submission',
          targetTab: 'reviews'
        });
      });
    } else {
      const leaves = data.leaves || [];
      leaves.forEach(l => {
        if (l.status === 'approved' || l.status === 'rejected') {
          list.push({
            id: `leave-res-${l._id}`,
            title: `Leave request ${l.status}`,
            message: `Your leave request for ${new Date(l.fromDate).toLocaleDateString()} was ${l.status}.`,
            type: 'leave',
            targetTab: 'leaves'
          });
        }
      });

      const submissions = data.submissions || [];
      submissions.forEach(s => {
        if (s.status === 'accepted') {
          list.push({
            id: `sub-grade-${s._id}`,
            title: 'Assignment Graded',
            message: `Your submission for "${s.task?.title || 'Task'}" scored ${s.score}/${s.task?.maxScore || 100} pts.`,
            type: 'grade',
            targetTab: 'tasks'
          });
        } else if (s.status === 'resubmit') {
          list.push({
            id: `sub-resub-${s._id}`,
            title: 'Resubmission Requested',
            message: `Mentor requested resubmission for "${s.task?.title || 'Task'}".`,
            type: 'resubmit',
            targetTab: 'tasks'
          });
        }
      });

      const tasks = data.tasks || [];
      const submittedTaskIds = new Set(submissions.map(s => s.task?._id || s.task));
      tasks.forEach(t => {
        if (!submittedTaskIds.has(t._id)) {
          list.push({
            id: `task-new-${t._id}`,
            title: 'New Assignment',
            message: `New assignment: "${t.title}".`,
            type: 'task',
            targetTab: 'tasks'
          });
        }
      });
    }
    return list;
  };

  const notifications = getRealNotifications();



  const pageTitle = navItems.find(i => i.id === active)?.label || 'Workspace';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bgPrimary text-textPrimary font-body">
      {/* Mobile backdrop */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1005] lg:hidden" onClick={() => setDrawerOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-bgSecondary border-r border-borderCool flex flex-col z-[1010] transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:static lg:translate-x-0 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-5">
          <Link to="/" className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-white overflow-hidden border border-borderCool/60 shrink-0 p-0.5 hover:opacity-80 transition-opacity">
            <img src="/ethnotech_academic_solutions_logo.jpg" alt="Ethnotech" className="w-full h-full object-contain rounded-md" />
          </Link>
          <div className="flex flex-col">
            <strong className="font-title text-[15px] font-semibold leading-tight text-textPrimary">Ethnotech</strong>
            <span className="text-[10px] text-textMuted uppercase tracking-widest">Academy</span>
          </div>
          <button className="lg:hidden ml-auto p-1.5 rounded-lg text-textMuted hover:bg-bgHover" onClick={() => setDrawerOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const sel = active === item.id;
            return (
              <Link
                key={item.id}
                to={`${prefix}/${item.id}`}
                onClick={() => { setDrawerOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${sel ? 'bg-primary text-white' : 'text-textSecondary hover:bg-bgHover hover:text-textPrimary'}`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'chat' && unreadChatCount > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 transition-all ${sel ? 'bg-white text-primary' : 'bg-primary text-white animate-pulse'}`}>
                    {unreadChatCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile footer */}
        <div className="px-4 py-4 border-t border-borderCool mt-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={openProfile}>
            <div className="w-9 h-9 rounded-full bg-primary text-white font-medium flex items-center justify-center text-sm shrink-0 overflow-hidden">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
              ) : (
                user.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <strong className="text-sm font-medium text-textPrimary truncate">{user.name}</strong>
              <span className="text-[11px] text-textMuted capitalize">{user.role === 'admin' ? 'Trainer' : 'Student'}</span>
            </div>
            <button className="p-1.5 rounded-lg text-textMuted hover:text-danger hover:bg-danger-light transition-colors" title="Logout" onClick={(e) => { e.stopPropagation(); logout(); }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-bgSecondary border-b border-borderCool flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg text-textMuted hover:bg-bgHover" onClick={() => setDrawerOpen(true)}>
              <Menu size={18} />
            </button>
            <div className="hidden md:flex items-center relative">
              <div className="flex items-center bg-bgPrimary border border-borderCool rounded-lg px-3 py-1.5 w-72 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-light transition-all">
                <Search size={16} className="text-textMuted mr-2 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search pages..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm text-textPrimary placeholder:text-textMuted/50" 
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery('')} 
                    className="text-textMuted hover:text-textPrimary p-0.5"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              
              {searchQuery.trim() && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-bgSecondary border border-borderCool rounded-xl shadow-xl z-50 py-2 divide-y divide-borderCool/40">
                  {navItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <div className="px-4 py-3 text-center text-xs text-textMuted font-medium">
                      No matching pages found
                    </div>
                  ) : (
                    navItems
                      .filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(item => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActive(item.id);
                              setSearchQuery('');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bgHover text-left text-xs font-semibold text-textPrimary transition-colors"
                          >
                            <Icon size={14} className="text-textMuted" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                className="p-2 rounded-lg text-textMuted hover:bg-bgHover transition-colors relative flex items-center justify-center"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <Bell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-bgSecondary border border-borderCool rounded-xl shadow-xl z-50 py-2 animate-slide-down">
                  <div className="px-4 py-2 border-b border-borderCool flex justify-between items-center">
                    <span className="text-xs font-bold text-textPrimary">Notifications</span>
                    {notifications.length > 0 && (
                      <span className="bg-danger/10 text-danger text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {notifications.length} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-borderCool/40">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-textMuted">
                        No notifications at this time.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            setActive(n.targetTab);
                            setShowNotifications(false);
                          }}
                          className="px-4 py-3 hover:bg-bgHover cursor-pointer transition-colors text-left"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[11px] font-bold text-textPrimary">{n.title}</span>
                            <span className="text-[9px] uppercase tracking-wider text-primary font-semibold">{n.type}</span>
                          </div>
                          <p className="text-xs text-textSecondary mt-0.5 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-borderCool rounded-lg hover:bg-bgHover transition-colors disabled:opacity-50" onClick={() => refresh()} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-[1280px] mx-auto">
            <div className="mb-5">
              <span className="text-[11px] font-semibold text-textMuted uppercase tracking-wider">
                {user.role === 'admin' ? 'Admin Workspace' : user.batch?.name || 'Student Workspace'}
              </span>
              <h1 className="font-title font-semibold text-xl lg:text-2xl text-textPrimary mt-0.5">{pageTitle}</h1>
            </div>
            {children}
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      <Modal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} title="My Profile">
        <form className="flex flex-col gap-4" onSubmit={handleProfileSubmit}>
          <Field label="Full Name" name="name" value={profileForm.name} onChange={(v) => setProfileForm(p => ({ ...p, name: v }))} required />
          <Field label="Mobile Number" name="phone" value={profileForm.phone} onChange={(v) => setProfileForm(p => ({ ...p, phone: v }))} />
          {user.role === 'student' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Roll Number" name="rollNumber" value={profileForm.rollNumber} onChange={(v) => setProfileForm(p => ({ ...p, rollNumber: v }))} />
                <Field label="LeetCode Handle" name="leetcodeUsername" value={profileForm.leetcodeUsername} onChange={(v) => setProfileForm(p => ({ ...p, leetcodeUsername: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="GitHub URL" name="githubUrl" value={profileForm.githubUrl} onChange={(v) => setProfileForm(p => ({ ...p, githubUrl: v }))} />
                <Field label="LinkedIn URL" name="linkedinUrl" value={profileForm.linkedinUrl} onChange={(v) => setProfileForm(p => ({ ...p, linkedinUrl: v }))} />
              </div>
            </>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-textMuted">Profile Picture</span>
            <input name="profilePicture" type="file" accept="image/*" className="text-sm text-textSecondary file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-bgHover file:text-textPrimary file:font-medium file:cursor-pointer hover:file:bg-borderCool" />
          </label>
          <button className="w-full bg-primary text-white text-sm font-medium rounded-lg py-2.5 hover:bg-primary-hover transition-colors mt-1">Save Profile</button>
        </form>
      </Modal>
    </div>
  );
}
