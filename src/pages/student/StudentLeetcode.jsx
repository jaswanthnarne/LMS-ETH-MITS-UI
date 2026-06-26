import React, { useState, useEffect, useCallback } from 'react';
import {
  Code2, BarChart3, Star, Flame, Send, Award,
  Link as LinkIcon, Calendar, Trophy, X, RefreshCw, Activity
} from 'lucide-react';
import { Field, SectionTitle, DataList, Badge, Modal } from '../../components/Shared';

// ─── Donut Ring Chart ─────────────────────────────────────────────────────────
function DonutChart({ easy, medium, hard, totalSolved }) {
  const total = easy + medium + hard;
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const easyPct  = total > 0 ? easy / total : 0;
  const medPct   = total > 0 ? medium / total : 0;
  const hardPct  = total > 0 ? hard / total : 0;

  const easyDash  = circumference * easyPct;
  const medDash   = circumference * medPct;
  const hardDash  = circumference * hardPct;
  const gap = circumference * 0.012; // small gap between segments

  // Offsets: start from top (–circumference * 0.25)
  const easyOffset  = -circumference * 0.25;
  const medOffset   = easyOffset  - easyDash  - gap;
  const hardOffset  = medOffset   - medDash   - gap;

  const cx = size / 2;
  const cy = size / 2;

  const arcProps = { cx, cy, r: radius, fill: 'none', strokeWidth, strokeLinecap: 'round' };

  return (
    <div className="flex items-center gap-8 flex-wrap">
      {/* SVG ring */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {/* Background track */}
          <circle {...arcProps} stroke="currentColor" className="text-borderCool opacity-40"
            strokeDasharray={circumference} strokeDashoffset={0} />
          {/* Easy (teal/green) */}
          {easyDash > 0 && (
            <circle {...arcProps} stroke="#00b8a3"
              strokeDasharray={`${easyDash} ${circumference}`}
              strokeDashoffset={easyOffset} />
          )}
          {/* Medium (amber/yellow) */}
          {medDash > 0 && (
            <circle {...arcProps} stroke="#ffc01e"
              strokeDasharray={`${medDash} ${circumference}`}
              strokeDashoffset={medOffset} />
          )}
          {/* Hard (red/pink) */}
          {hardDash > 0 && (
            <circle {...arcProps} stroke="#ef4743"
              strokeDasharray={`${hardDash} ${circumference}`}
              strokeDashoffset={hardOffset} />
          )}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-textPrimary leading-none">{totalSolved}</span>
          <span className="text-[9px] text-textMuted font-bold uppercase tracking-wider mt-0.5">Solved</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="flex flex-col gap-2.5 min-w-0">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: '#00b8a3' }} />
            <span className="text-xs font-semibold text-textSecondary">Easy</span>
          </div>
          <span className="text-xs font-bold" style={{ color: '#00b8a3' }}>{easy}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: '#ffc01e' }} />
            <span className="text-xs font-semibold text-textSecondary">Med.</span>
          </div>
          <span className="text-xs font-bold" style={{ color: '#ffc01e' }}>{medium}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: '#ef4743' }} />
            <span className="text-xs font-semibold text-textSecondary">Hard</span>
          </div>
          <span className="text-xs font-bold" style={{ color: '#ef4743' }}>{hard}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Submission Heatmap ───────────────────────────────────────────────────────
// Uses platform LMS submissions directly — green = submitted a problem on our platform
function SubmissionHeatmap({ platformSubmissions }) {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Build a date-keyed map of submission counts (IST dates)
  const calData = React.useMemo(() => {
    const map = {};
    (platformSubmissions || []).forEach(sub => {
      if (!sub.createdAt) return;
      const d = new Date(sub.createdAt);
      // Convert to IST (UTC+5:30)
      const istStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
      map[istStr] = (map[istStr] || 0) + 1;
    });
    return map;
  }, [platformSubmissions]);

  // Build day list: June 20, 2026 → today (IST)
  const PLATFORM_START = '2026-06-20';
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  const days = React.useMemo(() => {
    const list = [];
    const cursor = new Date(PLATFORM_START + 'T00:00:00');
    const end    = new Date(todayIST   + 'T00:00:00');
    while (cursor <= end) {
      const key = cursor.toLocaleDateString('en-CA');
      list.push({ date: new Date(cursor), key, count: calData[key] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return list;
  }, [calData, todayIST]);

  // Group days into week-rows of 7
  const weeks = React.useMemo(() => {
    const out = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [days]);

  const totalSubmissions = Object.values(calData).reduce((a, b) => a + b, 0);
  const activeDays       = Object.keys(calData).length;

  const CELL_W = 38;
  const CELL_H = 38;
  const GAP    = 4;

  function cellBg(count) {
    if (count === 0) return { bg: 'transparent', border: 'rgba(148,163,184,0.15)', text: '#64748b' };
    if (count === 1) return { bg: 'rgba(22,163,74,0.30)', border: 'rgba(34,197,94,0.40)',  text: '#86efac' };
    if (count <= 3)  return { bg: 'rgba(22,163,74,0.55)', border: 'rgba(34,197,94,0.60)',  text: '#4ade80' };
    if (count <= 6)  return { bg: 'rgba(22,163,74,0.80)', border: 'rgba(34,197,94,0.80)',  text: '#22c55e' };
    return               { bg: '#16a34a',                  border: '#15803d',               text: '#dcfce7' };
  }

  const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div className="flex flex-col gap-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-semibold text-textMuted">
          <strong className="text-textPrimary">{totalSubmissions}</strong> platform submissions since Jun 20
        </span>
        <span className="text-[11px] font-semibold text-textMuted">
          Active days: <strong className="text-textPrimary">{activeDays}</strong>
        </span>
      </div>

      {/* Grid: rows = weeks, columns = days (Sun→Sat) */}
      <div className="overflow-x-auto pb-1">
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: GAP }}>

          {/* Day-of-week header */}
          <div style={{ display: 'flex', gap: GAP }}>
            {DOW.map(d => (
              <div key={d} style={{
                width: CELL_W, textAlign: 'center',
                fontSize: 9, fontWeight: 700,
                color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase'
              }}>{d}</div>
            ))}
          </div>

          {/* Week rows */}
          {weeks.map((week, wIdx) => (
            <div key={wIdx} style={{ display: 'flex', gap: GAP }}>
              {week.map((day, dIdx) => {
                const c = cellBg(day.count);
                const dayNum   = day.date.getDate();
                const monthStr = MONTHS[day.date.getMonth()];
                // Show "Jun" on the 1st of a month OR the very first cell
                const label = (dayNum === 1 || (wIdx === 0 && dIdx === 0))
                  ? monthStr
                  : String(dayNum);

                return (
                  <div key={dIdx}
                    title={`${day.date.toDateString()}: ${day.count} submission${day.count !== 1 ? 's' : ''}`}
                    style={{
                      width: CELL_W,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'default'
                    }}
                  >
                    {/* Cell */}
                    <div style={{
                      width: CELL_W - 2,
                      height: CELL_H - 2,
                      borderRadius: 8,
                      background: c.bg,
                      border: `1.5px solid ${c.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.12s, box-shadow 0.12s',
                      boxShadow: day.count > 0 ? '0 0 0 0px rgba(34,197,94,0.3)' : 'none'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.12)';
                      if (day.count > 0) e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.25)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    >
                      {day.count > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 800, color: c.text }}>
                          {day.count}
                        </span>
                      )}
                    </div>

                    {/* Date label below cell */}
                    <span style={{
                      fontSize: 9,
                      fontWeight: dayNum === 1 ? 700 : 600,
                      color: day.count > 0 ? '#4ade80' : '#475569',
                      letterSpacing: '0.02em',
                      lineHeight: 1
                    }}>
                      {label}
                    </span>
                  </div>
                );
              })}
              {/* Pad incomplete last week with empty slots */}
              {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
                <div key={`pad-${i}`} style={{ width: CELL_W }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] text-textMuted font-semibold ml-auto">
        <span>No submissions</span>
        {[0, 1, 3, 5, 8].map(v => {
          const c = cellBg(v);
          return (
            <div key={v} style={{
              width: 14, height: 14, borderRadius: 4,
              background: c.bg, border: `1.5px solid ${c.border}`
            }} />
          );
        })}
        <span>More submissions</span>
      </div>
    </div>
  );
}



// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentLeetcode({ user, data, forms, setForm, api, action }) {
  const [tab, setTab] = useState('challenges');
  const [attemptProblem, setAttemptProblem] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [platformLeaderboard, setPlatformLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoadingLeaderboard(true);
      const res = await api.get('/api/analytics/leaderboard');
      if (res?.leaderboard) {
        const sorted = [...res.leaderboard].sort((a, b) => {
          const scoreA = (a.leetcodeScore || 0) + (a.leetcodeStreak || 0) * 5;
          const scoreB = (b.leetcodeScore || 0) + (b.leetcodeStreak || 0) * 5;
          return scoreB - scoreA;
        });
        setPlatformLeaderboard(sorted);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [api]);

  useEffect(() => {
    if (tab === 'leaderboard') fetchLeaderboard();
  }, [tab, fetchLeaderboard]);

  const record = data.leetcode;
  const problems = data.leetcodeProblems || [];

  const filteredProblems = problems.filter(problem => {
    if (!dateFilter) return true;
    if (!problem.dueDate) return false;
    const probDateStr = new Date(problem.dueDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return probDateStr === dateFilter;
  });

  // Count total submissions in heatmap since platform launch (June 20, 2026)
  const heatmapTotal = React.useMemo(() => {
    if (!record?.submissionCalendar) return 0;
    try {
      const cal = JSON.parse(record.submissionCalendar);
      const platformStart = Math.floor(new Date('2026-06-20T00:00:00').getTime() / 1000);
      return Object.entries(cal).reduce((sum, [ts, cnt]) => {
        return Number(ts) >= platformStart ? sum + Number(cnt) : sum;
      }, 0);
    } catch { return 0; }
  }, [record?.submissionCalendar]);

  const TAB_BTN = (id, icon, label) => (
    <button
      className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
        tab === id
          ? 'bg-primary text-white shadow-sm'
          : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
      }`}
      onClick={() => setTab(id)}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-bgSecondary border border-borderCool rounded-xl w-fit">
        {TAB_BTN('challenges', <Code2 size={14} />, 'Solve Challenges')}
        {TAB_BTN('profile',    <Star size={14} />,  'Profile & Stats')}
        {TAB_BTN('leaderboard',<Trophy size={14} />, 'Leaderboard')}
      </div>

      {/* ── Challenges Tab ──────────────────────────────────────────────────── */}
      {tab === 'challenges' && (
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-borderCool">
            <div>
              <SectionTitle icon={Code2} title="Assigned Coding Challenges" />
              <p className="text-xs text-textMuted mt-1">
                Attempt coding problems on LeetCode and submit your solution link.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-bgPrimary border border-borderCool px-3 py-1.5 rounded-lg shadow-sm">
              <span className="text-xs font-semibold text-textMuted flex items-center gap-1.5 shrink-0">
                <Calendar size={13} /> Filter Date:
              </span>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="bg-bgSecondary border border-borderCool text-textPrimary text-xs rounded px-2 py-1 outline-none cursor-pointer pr-7 font-semibold"
                />
                {dateFilter && (
                  <button type="button" onClick={() => setDateFilter('')}
                    className="absolute right-1.5 text-textMuted hover:text-textPrimary p-0.5">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <DataList emptyText="No LeetCode problems assigned to your batch yet.">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProblems.map(problem => {
                const submission = problem.submission;
                const hasSubmitted = !!submission;
                const status = submission?.status;
                const duePassed = problem.dueDate && new Date() > new Date(problem.dueDate);

                let btnText = 'Submit Solution';
                let isBtnDisabled = false;
                if (status === 'accepted') { btnText = 'Submission Accepted'; isBtnDisabled = true; }
                else if (status === 'submitted') { btnText = 'Submitted'; isBtnDisabled = true; }
                else if (duePassed) { btnText = 'Due Date Passed'; isBtnDisabled = true; }
                else if (status === 'resubmit') { btnText = 'Resubmit Solution'; }

                return (
                  <div key={problem._id}
                    className="bg-bgPrimary border border-borderCool rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-primary/20 transition-all shadow-sm">
                    <div className="min-w-0 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded uppercase tracking-wider">
                            {problem.batch?.name || 'Cohort'}
                          </span>
                          {problem.difficulty && (
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${
                              problem.difficulty === 'Easy' ? 'bg-success/15 text-success border border-success/10' :
                              problem.difficulty === 'Hard' ? 'bg-danger/15 text-danger border border-danger/10' :
                              'bg-warning/15 text-warning border border-warning/10'
                            }`}>
                              {problem.difficulty}
                            </span>
                          )}
                        </div>
                        {status && <Badge value={status} />}
                      </div>
                      <strong className="font-title text-sm font-semibold text-textPrimary block truncate">
                        {problem.title}
                      </strong>
                      <div className="flex items-center gap-1.5 text-xs text-textMuted mt-1">
                        <LinkIcon size={12} />
                        <a href={problem.url} target="_blank" rel="noreferrer"
                          className="text-primary hover:underline font-semibold">
                          LeetCode Link ↗
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-1 border-t border-borderCool/40 pt-3">
                      <div className="flex items-center justify-between text-xs text-textSecondary font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-textMuted" />
                          Due: {problem.dueDate ? new Date(problem.dueDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' }) : 'Open'}
                        </span>
                      </div>

                      {status === 'accepted' && (
                        <div className="bg-bgSecondary border border-borderCool/60 rounded-lg p-2.5 text-xs flex flex-col gap-1">
                          <div className="flex justify-between items-center text-textPrimary font-semibold">
                            <span>Score</span>
                            <span className="text-primary font-bold">{submission.score} pts</span>
                          </div>
                          {submission.feedback && (
                            <p className="text-[11px] text-textSecondary italic mt-1 border-t border-borderCool/40 pt-1 leading-relaxed">
                              "{submission.feedback}"
                            </p>
                          )}
                        </div>
                      )}

                      {hasSubmitted && submission.submissionUrl && (
                        <a href={submission.submissionUrl} target="_blank" rel="noreferrer"
                          className="text-[11px] text-primary font-semibold hover:underline block text-right">
                          View My Submission ↗
                        </a>
                      )}

                      {!isBtnDisabled ? (
                        <button onClick={() => setAttemptProblem(problem)}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg shadow-sm bg-primary hover:bg-primary/95 text-white transition-all">
                          <Send size={12} /> {btnText}
                        </button>
                      ) : (
                        status !== 'accepted' && (
                          <div className="w-full text-center py-2.5 text-xs font-semibold rounded-lg bg-bgHover text-textMuted border border-borderCool">
                            {btnText}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </DataList>
        </div>
      )}

      {/* ── Profile & Stats Tab ─────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="flex flex-col gap-6">
          {/* Link form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form
              className="lg:col-span-1 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4 self-start"
              onSubmit={async e => {
                e.preventDefault();
                setSyncing(true);
                await action(
                  () => api.post('/api/leetcode/mine', { username: forms.leetcode.username }),
                  'LeetCode profile synced successfully'
                );
                setSyncing(false);
              }}
            >
              <SectionTitle icon={Code2} title="Link LeetCode Profile" />
              <p className="text-[11px] text-textMuted leading-relaxed">
                Enter your LeetCode username to sync your real solved stats, difficulty breakdown, and submission heatmap.
              </p>
              <Field
                placeholder="LeetCode username"
                value={forms.leetcode.username}
                onChange={value => setForm('leetcode', 'username', value)}
                required
              />
              <button type="submit" disabled={syncing}
                className="flex items-center justify-center gap-2 w-full text-center text-sm font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm disabled:opacity-70">
                {syncing
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <BarChart3 size={15} />}
                {syncing ? 'Syncing from LeetCode...' : 'Link & Sync Stats'}
              </button>
            </form>

            {/* Donut stats card */}
            <div className="lg:col-span-2 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <SectionTitle icon={Star} title="LeetCode Profile Stats" />
                {record && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-textMuted font-semibold">
                      Synced: {record.lastSyncedAt ? new Date(record.lastSyncedAt).toLocaleDateString('en-IN') : 'Never'}
                    </span>
                    <button
                      onClick={async () => {
                        setSyncing(true);
                        await action(
                          () => api.post('/api/leetcode/mine', { username: record.username }),
                          'Stats refreshed'
                        );
                        setSyncing(false);
                      }}
                      disabled={syncing}
                      className="p-1.5 rounded-lg border border-borderCool bg-bgPrimary text-textSecondary hover:text-primary hover:border-primary/40 transition-all"
                      title="Re-sync from LeetCode">
                      <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                    </button>
                  </div>
                )}
              </div>

              {record ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-textPrimary bg-bgPrimary border border-borderCool px-3 py-1 rounded-full">
                      @{record.username}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-warning bg-warning/10 border border-warning/20 px-2.5 py-0.5 rounded-full">
                      <Flame size={13} /> {record.streak || 0} platform streak
                    </span>
                  </div>

                  <div className="bg-bgPrimary border border-borderCool rounded-xl p-5">
                    <DonutChart
                      easy={record.easy || 0}
                      medium={record.medium || 0}
                      hard={record.hard || 0}
                      totalSolved={record.totalSolved || 0}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-textMuted border border-dashed border-borderCool rounded-xl p-6 leading-relaxed">
                  Link your LeetCode profile to sync your solved totals, difficulty breakdown, and submission heatmap.
                </div>
              )}
            </div>
          </div>

          {/* Heatmap card — always visible, uses platform LMS submissions only */}
          <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-primary" />
              <span className="text-sm font-bold text-textPrimary">Platform Submission Heatmap</span>
              <span className="text-[10px] bg-primary/10 text-primary font-semibold ml-1 px-2 py-0.5 rounded">LMS only</span>
            </div>
            <SubmissionHeatmap
              platformSubmissions={data.leetcodeSubmissions || []}
            />
          </div>
        </div>
      )}

      {/* ── Leaderboard Tab ─────────────────────────────────────────────────── */}
      {tab === 'leaderboard' && (
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
          <div className="pb-5 mb-5 border-b border-borderCool">
            <SectionTitle icon={Trophy} title="LeetCode Leaderboard" />
            <p className="text-xs text-textMuted mt-1">
              Rankings based on platform-assigned problems solved and active LMS streak.
            </p>
          </div>

          <DataList emptyText="No LeetCode metrics yet.">
            <div className="grid grid-cols-1 gap-2">
              {loadingLeaderboard ? (
                <div className="text-center py-10 text-xs text-textMuted">Loading leaderboard...</div>
              ) : platformLeaderboard.length > 0 ? (
                platformLeaderboard.map((item, index) => {
                  const rankColor = index === 0
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    : index === 1
                    ? 'bg-slate-400/15 text-slate-500 border-slate-400/25'
                    : index === 2
                    ? 'bg-orange-700/10 text-orange-700 border-orange-700/20'
                    : 'bg-bgSecondary text-textSecondary border-borderCool/60';

                  return (
                    <div key={item.student?._id}
                      className="flex justify-between items-center gap-4 bg-bgPrimary border border-borderCool/80 rounded-xl px-5 py-4 hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${rankColor}`}>
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-textPrimary block truncate">
                            {item.student?.name}
                          </span>
                          <span className="text-[10px] text-textMuted block font-medium truncate mt-0.5">
                            Roll: {item.student?.rollNumber || 'N/A'} · {item.student?.email}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <strong className="text-sm font-bold text-textPrimary block">
                            {(item.leetcodeScore || 0) + (item.leetcodeStreak || 0) * 5} pts
                          </strong>
                          <span className="block text-[9px] uppercase font-bold text-warning mt-0.5 bg-warning/10 border border-warning/20 px-1.5 py-0.5 rounded-full">
                            {item.leetcodeStreak || 0}d streak
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-xs text-textMuted">No platform LeetCode stats found.</div>
              )}
            </div>
          </DataList>
        </div>
      )}

      {/* Submit Solution Modal */}
      <Modal
        isOpen={!!attemptProblem}
        onClose={() => setAttemptProblem(null)}
        title={attemptProblem ? `Submit Solution: ${attemptProblem.title}` : ''}
      >
        <form className="flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault();
            if (!attemptProblem) return;
            const link = forms.leetcodeAttempt[attemptProblem._id];
            if (!link) return;
            action(
              () => api.post(`/api/leetcode/problems/${attemptProblem._id}/submit`, { submissionUrl: link }),
              'Solution submitted successfully'
            );
            setAttemptProblem(null);
          }}>
          <p className="text-xs text-textSecondary leading-relaxed">
            Verify your code passes all test suites on LeetCode, then paste your submission detail link below.
          </p>
          <Field
            placeholder="https://leetcode.com/submissions/detail/12345678/"
            value={forms.leetcodeAttempt[attemptProblem?._id] || ''}
            onChange={value => setForm('leetcodeAttempt', attemptProblem._id, value)}
            required
          />
          <button className="flex items-center justify-center gap-2 w-full text-center text-sm font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm">
            <Send size={14} /> Submit Solution URL
          </button>
        </form>
      </Modal>
    </div>
  );
}
