import React, { useEffect, useState } from 'react';
import { Award, Calendar, Trophy, CheckCircle, Clock, BookOpen, Flame, TrendingUp, ChevronRight } from 'lucide-react';
import { SectionTitle, DataList } from '../../components/Shared';

export default function MyMarks({ data, user, api }) {
  const [tab, setTab] = useState('daily'); // daily | weekly | monthly
  const [leaderboardStats, setLeaderboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

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
        console.error('Error fetching leaderboard stats for marks:', err);
      } finally {
        setLoadingStats(false);
      }
    }
    if (user?._id) {
      loadStats();
    }
  }, [user?._id, api]);

  // Compute daily overview list
  const getDailyScores = () => {
    const daily = {}; // dateString -> { date, attendance, checkin, task, leetcode }

    // 1. Attendance & Check-in
    (data.attendance || []).forEach(a => {
      const date = a.date;
      if (!daily[date]) {
        daily[date] = { date, attendance: 0, checkin: 0, task: 0, leetcode: 0 };
      }
      if (a.status === 'P') {
        daily[date].attendance = 10;
      }
      if (a.checkIn && a.checkOut && (a.totalHours || 0) >= 8) {
        daily[date].checkin = 10;
      }
    });

    // 2. Tasks
    (data.submissions || []).forEach(s => {
      if (s.status === 'accepted') {
        const date = new Date(s.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        if (!daily[date]) {
          daily[date] = { date, attendance: 0, checkin: 0, task: 0, leetcode: 0 };
        }
        daily[date].task += (s.score || 0);
      }
    });

    // 3. LeetCode
    (data.leetcodeSubmissions || []).forEach(s => {
      if (s.status === 'accepted') {
        const date = new Date(s.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        if (!daily[date]) {
          daily[date] = { date, attendance: 0, checkin: 0, task: 0, leetcode: 0 };
        }
        daily[date].leetcode += (s.score || 0);
      }
    });

    return Object.values(daily).sort((a, b) => b.date.localeCompare(a.date));
  };

  const dailyScores = getDailyScores();

  // Weekly Aggregation (Monday start)
  const getWeeklyScores = (dailyList) => {
    const weekly = {};
    dailyList.forEach(day => {
      const d = new Date(day.date + 'T00:00:00.000Z');
      const dayOfWeek = d.getUTCDay();
      const diff = d.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setUTCDate(diff);

      const weekKey = monday.toISOString().slice(0, 10);
      if (!weekly[weekKey]) {
        weekly[weekKey] = {
          key: weekKey,
          label: `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`,
          attendance: 0,
          checkin: 0,
          task: 0,
          leetcode: 0,
          total: 0
        };
      }
      weekly[weekKey].attendance += day.attendance;
      weekly[weekKey].checkin += day.checkin;
      weekly[weekKey].task += day.task;
      weekly[weekKey].leetcode += day.leetcode;
      weekly[weekKey].total += (day.attendance + day.checkin + day.task + day.leetcode);
    });
    return Object.values(weekly).sort((a, b) => b.key.localeCompare(a.key));
  };

  const weeklyScores = getWeeklyScores(dailyScores);

  // Monthly Aggregation
  const getMonthlyScores = (dailyList) => {
    const monthly = {};
    dailyList.forEach(day => {
      const parts = day.date.split('-');
      const monthKey = `${parts[0]}-${parts[1]}`;
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!monthly[monthKey]) {
        monthly[monthKey] = {
          key: monthKey,
          label,
          attendance: 0,
          checkin: 0,
          task: 0,
          leetcode: 0,
          total: 0
        };
      }
      monthly[monthKey].attendance += day.attendance;
      monthly[monthKey].checkin += day.checkin;
      monthly[monthKey].task += day.task;
      monthly[monthKey].leetcode += day.leetcode;
      monthly[monthKey].total += (day.attendance + day.checkin + day.task + day.leetcode);
    });
    return Object.values(monthly).sort((a, b) => b.key.localeCompare(a.key));
  };

  const monthlyScores = getMonthlyScores(dailyScores);

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Overall Points Card */}
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
            <Trophy size={22} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Overall Points</span>
            <strong className="text-2xl font-black text-textPrimary mt-0.5">
              {loadingStats ? (
                <span className="inline-block w-12 h-6 bg-borderCool rounded animate-pulse" />
              ) : (
                `${leaderboardStats?.overallScore || 0} pts`
              )}
            </strong>
          </div>
        </div>

        {/* LeetCode Points & Streak */}
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-warning/10 text-warning shrink-0">
            <Flame size={22} className="fill-warning/10" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Leetcode Points / Streak</span>
            <strong className="text-lg font-bold text-textPrimary mt-0.5">
              {loadingStats ? (
                <span className="inline-block w-16 h-6 bg-borderCool rounded animate-pulse" />
              ) : (
                `${leaderboardStats?.leetcodeScore || 0} pts (${leaderboardStats?.leetcodeStreak || 0}d streak)`
              )}
            </strong>
          </div>
        </div>

        {/* Task Points & Streak */}
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-success/10 text-success shrink-0">
            <CheckCircle size={22} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Task Points / Streak</span>
            <strong className="text-lg font-bold text-textPrimary mt-0.5">
              {loadingStats ? (
                <span className="inline-block w-16 h-6 bg-borderCool rounded animate-pulse" />
              ) : (
                `${leaderboardStats?.taskScore || 0} pts (${leaderboardStats?.taskStreak || 0}d streak)`
              )}
            </strong>
          </div>
        </div>

        {/* Attendance & Check-in Pts */}
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple/10 text-purple shrink-0">
            <Clock size={22} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Attendance & Check-in</span>
            <strong className="text-lg font-bold text-textPrimary mt-0.5">
              {loadingStats ? (
                <span className="inline-block w-16 h-6 bg-borderCool rounded animate-pulse" />
              ) : (
                `${(leaderboardStats?.attendanceMarks || 0) + (leaderboardStats?.checkInMarks || 0)} pts`
              )}
            </strong>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-bgSecondary border border-borderCool rounded-xl w-fit">
        <button
          onClick={() => setTab('daily')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
            tab === 'daily'
              ? 'bg-primary text-white shadow-sm'
              : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
          }`}
        >
          <Calendar size={14} /> Daily Overview
        </button>
        <button
          onClick={() => setTab('weekly')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
            tab === 'weekly'
              ? 'bg-primary text-white shadow-sm'
              : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
          }`}
        >
          <TrendingUp size={14} /> Weekly Aggregation
        </button>
        <button
          onClick={() => setTab('monthly')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
            tab === 'monthly'
              ? 'bg-primary text-white shadow-sm'
              : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
          }`}
        >
          <Award size={14} /> Monthly Aggregation
        </button>
      </div>

      {/* Detail Breakdown List */}
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <div className="pb-5 mb-5 border-b border-borderCool">
          <SectionTitle icon={Award} title="My Points Breakdown Table" />
          <p className="text-xs text-textMuted mt-1">
            Review detailed calculations of your scores and active learning performance.
          </p>
        </div>

        {tab === 'daily' && (
          <DataList emptyText="No scores logged for your account yet. Complete check-ins, attend sessions, or submit assignments.">
            <div className="border border-borderCool rounded-lg overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-bgPrimary text-xs font-bold text-textMuted uppercase border-b border-borderCool">
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Attendance</th>
                      <th className="px-5 py-3">Check-in Duration</th>
                      <th className="px-5 py-3">Assignments</th>
                      <th className="px-5 py-3">LeetCode Problems</th>
                      <th className="px-5 py-3 text-right">Day Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderCool/60 text-xs">
                    {dailyScores.map(row => {
                      const total = row.attendance + row.checkin + row.task + row.leetcode;
                      return (
                        <tr key={row.date} className="hover:bg-bgHover/20 transition-colors">
                          <td className="px-5 py-4 font-bold text-textPrimary">{row.date}</td>
                          <td className="px-5 py-4 text-textSecondary font-medium">
                            {row.attendance > 0 ? (
                              <span className="text-success font-semibold">+{row.attendance} pts (P)</span>
                            ) : '0 pts'}
                          </td>
                          <td className="px-5 py-4 text-textSecondary font-medium">
                            {row.checkin > 0 ? (
                              <span className="text-success font-semibold">+{row.checkin} pts (&ge;8h)</span>
                            ) : '0 pts'}
                          </td>
                          <td className="px-5 py-4 text-textSecondary font-medium">
                            {row.task > 0 ? (
                              <span className="text-success font-semibold">+{row.task} pts</span>
                            ) : '0 pts'}
                          </td>
                          <td className="px-5 py-4 text-textSecondary font-medium">
                            {row.leetcode > 0 ? (
                              <span className="text-success font-semibold">+{row.leetcode} pts</span>
                            ) : '0 pts'}
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-primary">
                            {total} pts
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </DataList>
        )}

        {tab === 'weekly' && (
          <DataList emptyText="No weekly point aggregates available.">
            <div className="grid grid-cols-1 gap-4">
              {weeklyScores.map(row => (
                <div key={row.key} className="bg-bgPrimary border border-borderCool rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <strong className="text-sm font-semibold text-textPrimary">{row.label}</strong>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-textMuted mt-1">
                      <span>Attendance: <span className="font-semibold text-textPrimary">+{row.attendance} pts</span></span>
                      <span>Check-ins: <span className="font-semibold text-textPrimary">+{row.checkin} pts</span></span>
                      <span>Tasks: <span className="font-semibold text-textPrimary">+{row.task} pts</span></span>
                      <span>Leetcode: <span className="font-semibold text-textPrimary">+{row.leetcode} pts</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right shrink-0">
                    <span className="text-2xl font-black text-primary">{row.total} pts</span>
                    <ChevronRight className="text-textMuted hidden sm:block" size={16} />
                  </div>
                </div>
              ))}
            </div>
          </DataList>
        )}

        {tab === 'monthly' && (
          <DataList emptyText="No monthly point aggregates available.">
            <div className="grid grid-cols-1 gap-4">
              {monthlyScores.map(row => (
                <div key={row.key} className="bg-bgPrimary border border-borderCool rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <strong className="text-sm font-semibold text-textPrimary">{row.label}</strong>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-textMuted mt-1">
                      <span>Attendance: <span className="font-semibold text-textPrimary">+{row.attendance} pts</span></span>
                      <span>Check-ins: <span className="font-semibold text-textPrimary">+{row.checkin} pts</span></span>
                      <span>Tasks: <span className="font-semibold text-textPrimary">+{row.task} pts</span></span>
                      <span>Leetcode: <span className="font-semibold text-textPrimary">+{row.leetcode} pts</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right shrink-0">
                    <span className="text-2xl font-black text-primary">{row.total} pts</span>
                    <ChevronRight className="text-textMuted hidden sm:block" size={16} />
                  </div>
                </div>
              ))}
            </div>
          </DataList>
        )}
      </div>
    </div>
  );
}
