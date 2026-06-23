import React, { useState, useEffect } from 'react';
import { PlayCircle, CheckCircle, LogOut, Clock, Target, Calendar, Award, Code2, Hourglass, Flame, RefreshCw, Trophy } from 'lucide-react';
import { Badge, DataList, Row, SectionTitle } from '../../components/Shared';

export default function StudentDashboard({ user, data, api, action, go, loading }) {
  const records = data.attendance || [];
  const [syncing, setSyncing] = useState(false);
  const [leaderboardStats, setLeaderboardStats] = useState(null);

  // Check if we are in initial background loading phase
  const isInitialLoading = loading && (!data.tasks || data.tasks.length === 0) && (!data.attendance || data.attendance.length === 0);

  // Calculate statistics
  const presentDays = records.filter(r => r.status === 'P').length;
  const totalDays = records.length;
  const attendancePercentage = totalDays > 0 
    ? ((presentDays / totalDays) * 100).toFixed(1) 
    : '100.0';

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const todayRecord = records.find(r => r.date === todayStr);
  const todayStatus = todayRecord 
    ? (todayRecord.status === 'P' ? 'Present' : todayRecord.status === 'Ab' ? 'Absent' : 'Leave')
    : 'Not Marked';

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get('/api/analytics/leaderboard');
        if (res && res.leaderboard) {
          const myStats = res.leaderboard.find(x => String(x.student?._id) === String(user._id));
          if (myStats) {
            setLeaderboardStats(myStats);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadStats();
  }, [user._id]);

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-purple rounded-xl p-6 text-white shadow-md relative overflow-hidden">
        <h2 className="font-title text-2xl md:text-3xl font-bold tracking-tight mb-1">
          Welcome back, {user.name}
        </h2>
        {user.batch ? (
          <div className="mt-3 text-sm text-white/90 max-w-2xl">
            <p className="font-semibold text-white">Cohort Batch: {user.batch.name} ({user.batch.code})</p>
            {user.batch.mentor && <p className="text-white/80 text-xs mt-0.5">Mentor: {user.batch.mentor}</p>}
            {user.batch.description && (
              <p className="text-white/70 text-xs font-light mt-2 leading-relaxed">
                {user.batch.description}
              </p>
            )}
          </div>
        ) : (
          <p className="text-white/80 text-xs mt-1">No cohort batch assigned yet. Contact your trainer/admin.</p>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
        <div className="flex items-center gap-4 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Clock size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-textMuted font-medium uppercase tracking-wider">Attendance Rate</span>
            <strong className="text-base font-bold text-textPrimary leading-none mt-1">
              {isInitialLoading ? (
                <span className="inline-block w-12 h-5 bg-borderCool rounded animate-pulse" />
              ) : (
                `${attendancePercentage}%`
              )}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
          <div className="p-3 rounded-lg bg-success/10 text-success">
            <CheckCircle size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-textMuted font-medium uppercase tracking-wider">Today's Status</span>
            <strong className="text-base font-bold text-textPrimary leading-none mt-1 truncate">
              {isInitialLoading ? (
                <span className="inline-block w-16 h-5 bg-borderCool rounded animate-pulse" />
              ) : (
                todayStatus
              )}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
          <div className="p-3 rounded-lg bg-purple/10 text-purple">
            <Target size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-textMuted font-medium uppercase tracking-wider">Assigned Tasks</span>
            <strong className="text-base font-bold text-textPrimary leading-none mt-1">
              {isInitialLoading ? (
                <span className="inline-block w-10 h-5 bg-borderCool rounded animate-pulse" />
              ) : (
                `${data.tasks.length} total`
              )}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
          <div className="p-3 rounded-lg bg-warning/10 text-warning">
            <Award size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-textMuted font-medium uppercase tracking-wider">Quizzes</span>
            <strong className="text-base font-bold text-textPrimary leading-none mt-1">
              {isInitialLoading ? (
                <span className="inline-block w-10 h-5 bg-borderCool rounded animate-pulse" />
              ) : (
                `${data.quizzes.length} available`
              )}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
            <Trophy size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-textMuted font-medium uppercase tracking-wider">Overall Score</span>
            <strong className="text-base font-bold text-textPrimary leading-none mt-1">
              {isInitialLoading ? (
                <span className="inline-block w-14 h-5 bg-borderCool rounded animate-pulse" />
              ) : (
                leaderboardStats ? `${leaderboardStats.overallScore} pts` : '0 pts'
              )}
            </strong>
          </div>
        </div>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Pending Tasks */}
          <article className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <SectionTitle icon={Target} title="My Pending Assignments" />
            
            {isInitialLoading ? (
              <div className="flex flex-col gap-2">
                <div className="h-12 bg-bgPrimary border border-borderCool rounded-lg animate-pulse" />
                <div className="h-12 bg-bgPrimary border border-borderCool rounded-lg animate-pulse" />
              </div>
            ) : (
              <DataList emptyText="Hooray! No pending homework tasks.">
                <div className="grid grid-cols-1 gap-2.5">
                  {data.tasks.slice(0, 3).map((task) => (
                    <Row 
                      key={task._id} 
                      title={task.title} 
                      meta={`Due by: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Open'}`}
                    >
                      <button 
                        className="text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-3 py-1.5 rounded-lg"
                        onClick={() => go('tasks')}
                      >
                        Submit Work
                      </button>
                    </Row>
                  ))}
                </div>
              </DataList>
            )}
          </article>
        </div>

        {/* Right side: Leetcode progress */}
        <div className="lg:col-span-1">
          <article className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4 sticky top-6">
            <SectionTitle icon={Code2} title="Leetcode Metrics" />
            
            {isInitialLoading ? (
              <div className="h-44 bg-bgPrimary border border-borderCool rounded-xl animate-pulse" />
            ) : data.leetcode ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-xs font-bold text-textPrimary bg-bgPrimary border border-borderCool px-2.5 py-1 rounded-full truncate">
                      @{data.leetcode.username}
                    </span>
                    <button 
                      className={`p-1.5 rounded-lg border border-borderCool bg-bgPrimary text-textSecondary hover:bg-bgHover hover:text-primary hover:border-primary/40 shrink-0 transition-all ${
                        syncing ? 'opacity-60' : ''
                      }`}
                      onClick={async () => {
                        setSyncing(true);
                        await action(
                          () => api.post('/api/leetcode/mine', { username: data.leetcode.username }),
                          'LeetCode stats synced using GraphQL successfully'
                        );
                        setSyncing(false);
                      }}
                      disabled={syncing}
                      title="Sync Leetcode Stats via GraphQL"
                    >
                      <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-warning-text bg-warning-light border border-warning/10 px-2 py-0.5 rounded-full shrink-0">
                    <Flame size={14} className="fill-warning/20" /> {leaderboardStats?.leetcodeStreak || 0} Day Streak
                  </div>
                </div>

                <div className="bg-bgPrimary border border-borderCool/60 rounded-xl p-4 text-center">
                  <span className="text-3xl font-black text-textPrimary block">{data.leetcode.totalSolved || 0}</span>
                  <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider block mt-1">Solved Problems</span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-success-light border border-success/10 rounded-lg p-2.5 text-xs font-semibold text-success-text">
                    <span>Easy</span>
                    <strong>{data.leetcode.easy || 0}</strong>
                  </div>
                  <div className="flex justify-between items-center bg-warning-light border border-warning/10 rounded-lg p-2.5 text-xs font-semibold text-warning-text">
                    <span>Medium</span>
                    <strong>{data.leetcode.medium || 0}</strong>
                  </div>
                  <div className="flex justify-between items-center bg-danger-light border border-danger/10 rounded-lg p-2.5 text-xs font-semibold text-danger-text">
                    <span>Hard</span>
                    <strong>{data.leetcode.hard || 0}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 text-center py-4">
                <p className="text-xs text-textMuted leading-relaxed">
                  Track your daily problem solving habits and build your competitive coding portfolio.
                </p>
                <button 
                  className="w-full text-center text-sm font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm"
                  onClick={() => go('leetcode')}
                >
                  Link Leetcode Profile
                </button>
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
