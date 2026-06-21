import React, { useState, useEffect } from 'react';
import {
  FileText,
  Users,
  TrendingUp,
  Award,
  PlusCircle,
  Play,
  Clock,
  ListChecks,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { Badge, DataList, Row, SectionTitle } from '../../components/Shared';

export default function AdminDashboard({ user, data, api, action, go }) {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const fetchOnlineCount = async () => {
      try {
        const res = await api.get('/api/auth/online-count');
        setOnlineCount(res.count);
      } catch (e) {
        // fail silently
      }
    };
    fetchOnlineCount();
    const interval = setInterval(fetchOnlineCount, 15000);
    return () => clearInterval(interval);
  }, [api]);

  const metrics = [
    {
      label: 'Live Online',
      value: (
        <span className="flex items-center gap-2">
          {onlineCount}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
        </span>
      ),
      icon: UserCheck,
      subtext: 'Active in last minute',
      colorClass: 'metric-icon-blue'
    },
    {
      label: 'Assigned Exams',
      value: data.summary.quizzes || 0,
      icon: FileText,
      subtext: 'Published to batches',
      colorClass: 'metric-icon-blue'
    },
    {
      label: 'Total Attempts',
      value: data.summary.submissions || 0,
      icon: Users,
      subtext: 'All task submissions',
      colorClass: 'metric-icon-purple'
    },
    {
      label: 'Today Active',
      value: data.summary.todayAttendance || 0,
      icon: TrendingUp,
      subtext: 'Present & partial checkins',
      colorClass: 'metric-icon-green'
    },
    {
      label: 'Pending Leaves',
      value: data.summary.pendingLeaves || 0,
      icon: Award,
      subtext: 'Requires approval',
      colorClass: 'metric-icon-orange'
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-purple rounded-xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
          <Briefcase size={200} />
        </div>
        <h2 className="font-title text-2xl md:text-3xl font-bold tracking-tight mb-1">
          Welcome back, {user.name}
        </h2>
        <p className="text-white/80 text-sm md:text-base font-light">
          Manage your assigned assessments and monitor student progress
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <article 
              className="flex items-center gap-4 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow" 
              key={idx}
            >
              <div className={`p-3 rounded-lg ${m.colorClass}`}>
                <Icon size={24} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] text-textMuted font-medium truncate">{m.label}</span>
                <strong className="text-2xl font-bold text-textPrimary leading-none my-1">{m.value}</strong>
                <small className="text-[11px] text-textMuted/80 truncate">{m.subtext}</small>
              </div>
            </article>
          );
        })}
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main content) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Quizzes List */}
          <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <SectionTitle icon={FileText} title="Assigned Exams & Quizzes" />
              <button 
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors" 
                onClick={() => go('quizzes')}
              >
                <PlusCircle size={15} /> Add New
              </button>
            </div>
            
            <DataList emptyText="No quizzes have been created yet.">
              {data.quizzes.slice(0, 3).map((quiz) => (
                <div 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bgPrimary border border-borderCool rounded-lg p-4 hover:border-primary/30 transition-colors" 
                  key={quiz._id}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold bg-bgHover text-textSecondary px-2 py-0.5 rounded uppercase tracking-wider">
                        EXAM-{quiz.title.slice(0, 5).toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        quiz.isLive 
                          ? 'bg-success/10 text-success' 
                          : 'bg-textMuted/10 text-textMuted'
                      }`}>
                        {quiz.isLive ? 'Live' : 'Draft'}
                      </span>
                      <span className="text-xs text-textMuted font-medium">{quiz.batch?.name || 'All'}</span>
                    </div>
                    <h4 className="font-title text-sm font-semibold text-textPrimary mb-1 truncate">{quiz.title}</h4>
                    <p className="flex items-center gap-4 text-[11px] text-textMuted">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {quiz.durationSeconds}s duration
                      </span>
                      <span className="flex items-center gap-1">
                        <ListChecks size={12} /> {quiz.questions?.length || 0} questions
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center justify-end sm:justify-start">
                    <button 
                      className="flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-primary/40 text-textPrimary px-3 py-2 rounded-lg hover:bg-bgHover transition-colors" 
                      onClick={() => go('quizzes')}
                    >
                      <Play size={12} className="text-primary fill-primary/20" /> Monitor
                    </button>
                  </div>
                </div>
              ))}
            </DataList>
          </div>

          {/* Pending Approvals */}
          <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 flex flex-col gap-4 shadow-sm">
            <SectionTitle icon={UserCheck} title="Pending Student Approvals" />
            <DataList emptyText="No pending registration requests.">
              {data.pending.map((student) => (
                <Row
                  key={student._id}
                  title={student.name}
                  meta={`${student.email} ${student.batch?.name ? `| Cohort: ${student.batch.name}` : ''}`}
                >
                  <button 
                    className="text-xs font-semibold bg-success hover:bg-success/90 text-white px-3.5 py-1.5 rounded-lg shadow-sm hover:shadow transition-all" 
                    onClick={() => action(() => api.patch(`/api/auth/approve/${student._id}`, {}), 'Student approved')}
                  >
                    Approve Access
                  </button>
                </Row>
              ))}
            </DataList>
          </div>
        </div>

        {/* Right Column (Side actions & stats) */}
        <div className="lg:col-span-1">
          <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 flex flex-col gap-5 shadow-sm sticky top-6">
            <SectionTitle icon={Briefcase} title="Curriculum & Daily Progress" />
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4 bg-bgPrimary border border-borderCool rounded-lg p-3.5">
                <div className="p-2.5 rounded-lg bg-purple/10 text-purple">
                  <Briefcase size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <strong className="text-sm font-semibold text-textPrimary block truncate">Active Cohorts</strong>
                  <span className="text-[11px] text-textMuted block">Batches currently mapping</span>
                </div>
                <div className="text-lg font-bold text-textPrimary">{data.summary.batches || 0}</div>
              </div>

              <div className="flex items-center gap-4 bg-bgPrimary border border-borderCool rounded-lg p-3.5">
                <div className="p-2.5 rounded-lg bg-success/10 text-success">
                  <Users size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <strong className="text-sm font-semibold text-textPrimary block truncate">Enrolled Students</strong>
                  <span className="text-[11px] text-textMuted block">Total verified profiles</span>
                </div>
                <div className="text-lg font-bold text-textPrimary">{data.summary.students || 0}</div>
              </div>

              <div className="flex items-center gap-4 bg-bgPrimary border border-borderCool rounded-lg p-3.5">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <TrendingUp size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <strong className="text-sm font-semibold text-textPrimary block truncate">Assigned Tasks</strong>
                  <span className="text-[11px] text-textMuted block">Active homework tasks</span>
                </div>
                <div className="text-lg font-bold text-textPrimary">{data.summary.tasks || 0}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button 
                className="w-full text-center text-sm font-semibold bg-primary hover:bg-primary.hover text-white py-2.5 rounded-lg shadow-sm hover:shadow transition-all" 
                onClick={() => go('batches')}
              >
                Manage Batches
              </button>
              <button 
                className="w-full text-center text-sm font-semibold bg-bgSecondary border border-borderCool hover:border-textMuted text-textPrimary py-2.5 rounded-lg hover:bg-bgHover transition-colors" 
                onClick={() => go('attendance')}
              >
                Log Daily Work
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
