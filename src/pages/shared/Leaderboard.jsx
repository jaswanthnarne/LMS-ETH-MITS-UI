import React, { useState, useEffect } from 'react';
import { 
  Trophy, Code2, BookOpen, Calendar, Search, 
  ExternalLink, Flame, CheckCircle2, AlertTriangle, 
  HelpCircle, User, Users, Award, Send
} from 'lucide-react';
import { SectionTitle, Select, DataList, Badge, Modal, Field } from '../../components/Shared';

export default function Leaderboard({ user, data, forms, setForm, api, action }) {
  const [batches, setBatches] = useState(data.batches || []);
  const [selectedBatchId, setSelectedBatchId] = useState(
    user.role === 'admin' 
      ? (data.batches?.[0]?._id || '') 
      : (user.batch?._id || user.batch || '')
  );

  const [tab, setTab] = useState('leaderboard'); // leaderboard | leetcode | tasks
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [problems, setProblems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [batchName, setBatchName] = useState('Cohort');
  const [loading, setLoading] = useState(true);

  // Selected details for expanded list views
  const [activeProblemId, setActiveProblemId] = useState('');
  const [activeTaskId, setActiveTaskId] = useState('');
  const [attemptProblem, setAttemptProblem] = useState(null);

  // Fetch batch analytics details
  async function fetchLeaderboard() {
    if (!selectedBatchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/api/analytics/leaderboard?batchId=${selectedBatchId}`);
      if (res) {
        setLeaderboardData(res.leaderboard || []);
        setProblems(res.problems || []);
        setTasks(res.tasks || []);
        setBatchName(res.batchName || 'Cohort');

        if (res.problems?.length > 0) {
          setActiveProblemId(res.problems[0]._id);
        } else {
          setActiveProblemId('');
        }

        if (res.tasks?.length > 0) {
          setActiveTaskId(res.tasks[0]._id);
        } else {
          setActiveTaskId('');
        }
      }
    } catch (err) {
      console.error('Failed to load leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedBatchId]);

  const activeProblem = problems.find(p => p._id === activeProblemId);
  const activeTask = tasks.find(t => t._id === activeTaskId);

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Batch Filter Row */}
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <SectionTitle icon={Trophy} title={`Leaderboards & Trackers — ${batchName}`} />
            <p className="text-xs text-textMuted mt-1">
              Check overall performance, streaks, daily check-ins, and on-time task metrics.
            </p>
          </div>

          {user.role === 'admin' && batches.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-textSecondary shrink-0">Select Batch:</span>
              <Select
                value={selectedBatchId}
                onChange={setSelectedBatchId}
                options={batches.map(b => [b._id, b.name])}
                className="w-full sm:w-[220px]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Loading state indicator */}
      {loading ? (
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-12 text-center shadow-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <span className="text-sm font-semibold text-textSecondary">Loading platform statistics...</span>
        </div>
      ) : (
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
          <div className="pb-4 mb-4 border-b border-borderCool flex justify-between items-center">
            <h3 className="font-title text-sm font-bold text-textPrimary uppercase tracking-wider">Overall Scoreboard</h3>
            <span className="text-[11px] text-textMuted font-medium">Rankings by combined scores & streaks</span>
          </div>

          <div className="border border-borderCool rounded-lg overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-bgPrimary border-b border-borderCool text-xs font-bold text-textMuted uppercase tracking-wider">
                    <th className="px-5 py-3.5 w-20">Rank</th>
                    <th className="px-5 py-3.5">Student Profile</th>
                    <th className="px-5 py-3.5 text-center">Leetcode Streak</th>
                    <th className="px-5 py-3.5 text-center">Task Streak</th>
                    <th className="px-5 py-3.5 text-center">Check-in Pts</th>
                    <th className="px-5 py-3.5 text-center">Task Pts</th>
                    <th className="px-5 py-3.5 text-center">Leetcode Pts</th>
                    <th className="px-5 py-3.5 text-right pr-6">Total Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderCool/65">
                  {leaderboardData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-sm text-textMuted">
                        No students enrolled in this batch.
                      </td>
                    </tr>
                  ) : (
                    leaderboardData.map((row, idx) => {
                      const rank = idx + 1;
                      const rankBadgeCls = rank === 1 
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                        : rank === 2 
                        ? 'bg-slate-400/15 text-slate-500 dark:text-slate-300 border-slate-400/25' 
                        : rank === 3 
                        ? 'bg-orange-700/10 text-orange-700 dark:text-orange-400 border-orange-700/20' 
                        : 'bg-bgSecondary text-textSecondary border-borderCool/60';

                      return (
                        <tr key={row.student._id} className="hover:bg-bgHover/30 transition-colors">
                          {/* Rank */}
                          <td className="px-5 py-3.5 font-bold text-xs">
                            <span className={`inline-flex w-7 h-7 rounded-full border items-center justify-center font-bold text-xs ${rankBadgeCls}`}>
                              {rank}
                            </span>
                          </td>
                          
                          {/* Student Profile info */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-borderCool/60">
                                {row.student.profilePicture ? (
                                  <img src={row.student.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  row.student.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <strong className="text-sm font-semibold text-textPrimary block truncate">
                                  {row.student.name}
                                </strong>
                                <small className="text-[10px] text-textMuted block mt-0.5 truncate">
                                  {row.student.rollNumber || row.student.email}
                                </small>
                              </div>
                            </div>
                          </td>

                          {/* Leetcode Streak */}
                          <td className="px-5 py-3.5 text-center font-semibold text-xs text-textPrimary">
                            {row.leetcodeStreak > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-warning font-bold">
                                <Flame size={13} className="fill-warning/10" /> {row.leetcodeStreak} days
                              </span>
                            ) : (
                              <span className="text-textMuted/60">—</span>
                            )}
                          </td>

                          {/* Task Streak */}
                          <td className="px-5 py-3.5 text-center font-semibold text-xs text-textPrimary">
                            {row.taskStreak > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-primary font-bold">
                                <Award size={13} /> {row.taskStreak} tasks
                              </span>
                            ) : (
                              <span className="text-textMuted/60">—</span>
                            )}
                          </td>

                          {/* Check-in Marks */}
                          <td className="px-5 py-3.5 text-center text-xs font-medium text-textSecondary">
                            {row.attendanceMarks} pts
                          </td>

                          {/* Task Points */}
                          <td className="px-5 py-3.5 text-center text-xs font-medium text-textSecondary">
                            {row.taskScore} pts
                          </td>

                          {/* Leetcode Points */}
                          <td className="px-5 py-3.5 text-center text-xs font-medium text-textSecondary">
                            {row.leetcodeScore} pts
                          </td>

                          {/* Total Overall Score */}
                          <td className="px-5 py-3.5 text-right pr-6 font-bold text-sm text-textPrimary">
                            <span className="text-primary font-bold">{row.overallScore}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
