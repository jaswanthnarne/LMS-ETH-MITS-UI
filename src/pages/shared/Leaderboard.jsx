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

      {/* Tabs Row */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-bgSecondary border border-borderCool rounded-xl w-fit">
        <button 
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
            tab === 'leaderboard' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
          }`} 
          onClick={() => setTab('leaderboard')}
        >
          <Trophy size={14} /> Overall Leaderboard
        </button>
        <button 
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
            tab === 'leetcode' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
          }`} 
          onClick={() => setTab('leetcode')}
        >
          <Code2 size={14} /> Daily Leetcode Tracker
        </button>
        <button 
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
            tab === 'tasks' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
          }`} 
          onClick={() => setTab('tasks')}
        >
          <BookOpen size={14} /> Task Submission Tracker
        </button>
      </div>

      {/* Loading state indicator */}
      {loading ? (
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-12 text-center shadow-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <span className="text-sm font-semibold text-textSecondary">Loading platform statistics...</span>
        </div>
      ) : (
        <>
          {/* 1. Overall Leaderboard Tab */}
          {tab === 'leaderboard' && (
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

          {/* 2. Daily Leetcode Tracker Tab */}
          {tab === 'leetcode' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Problems List */}
              <div className="lg:col-span-1 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4">
                <div className="pb-3 border-b border-borderCool/60">
                  <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 size={15} className="text-primary" /> Daily Challenges
                  </h4>
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] pr-1.5">
                  {problems.length === 0 ? (
                    <div className="text-center py-8 text-xs text-textMuted">
                      No Leetcode problems assigned to this batch.
                    </div>
                  ) : (
                    problems.map(prob => (
                      <button
                        key={prob._id}
                        onClick={() => setActiveProblemId(prob._id)}
                        className={`text-left p-3.5 rounded-lg border text-xs flex flex-col gap-1.5 transition-all ${
                          activeProblemId === prob._id 
                            ? 'bg-primary/5 border-primary shadow-sm' 
                            : 'bg-bgPrimary border-borderCool hover:border-textMuted/45'
                        }`}
                      >
                        <strong className="font-semibold text-textPrimary truncate block">{prob.title}</strong>
                        <span className="text-[10px] text-textMuted flex items-center gap-1">
                          <Calendar size={12} /> Due: {prob.dueDate ? new Date(prob.dueDate).toLocaleDateString() : 'No due date'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column - Student Submissions details */}
              <div className="lg:col-span-2 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4">
                {activeProblem ? (
                  <>
                    <div className="pb-3.5 border-b border-borderCool flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-title text-sm font-semibold text-textPrimary">{activeProblem.title}</h3>
                        <a 
                          href={activeProblem.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold mt-1"
                        >
                          LeetCode Challenge Link <ExternalLink size={11} />
                        </a>
                      </div>
                      <span className="text-xs text-textMuted bg-bgPrimary border border-borderCool/60 px-3 py-1 rounded-lg self-start sm:self-center">
                        Due: {activeProblem.dueDate ? new Date(activeProblem.dueDate).toLocaleDateString() : 'Open'}
                      </span>
                    </div>

                    {user.role === 'student' && (() => {
                      const myStatus = activeProblem.students?.find(s => String(s.studentId) === String(user._id));
                      return (
                        <div className="bg-bgPrimary border border-borderCool rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm mb-2">
                          <div className="min-w-0">
                            <strong className="text-xs font-bold text-textPrimary block">My Submission</strong>
                            {myStatus && myStatus.status !== 'pending' ? (
                              <span className="text-[11px] text-textMuted block mt-1">
                                Submitted on: {myStatus.submittedAt ? new Date(myStatus.submittedAt).toLocaleString() : 'N/A'}
                              </span>
                            ) : (
                              <span className="text-[11px] text-textMuted block mt-1">You haven't submitted your solution yet.</span>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {myStatus && myStatus.status !== 'pending' ? (
                              <div className="flex items-center gap-3">
                                {myStatus.url && (
                                  <a href={myStatus.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline">
                                    View Submission
                                  </a>
                                )}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  myStatus.status === 'accepted' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                                }`}>
                                  {myStatus.status === 'accepted' ? 'Accepted' : 'Submitted'}
                                </span>
                                {myStatus.onTime !== undefined && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    myStatus.onTime ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
                                  }`}>
                                    {myStatus.onTime ? 'On Time' : 'Late'}
                                  </span>
                                )}
                                {myStatus.status === 'accepted' && (
                                  <span className="text-xs font-bold text-textPrimary">
                                    {myStatus.score} pts
                                  </span>
                                )}
                              </div>
                            ) : (
                              <button
                                className="flex items-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-lg shadow-sm"
                                onClick={() => setAttemptProblem(activeProblem)}
                              >
                                Submit Solution URL
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-textMuted uppercase tracking-wider block mb-1">Submission Logs (Cohort)</span>
                      
                      <div className="border border-borderCool rounded-lg overflow-hidden max-h-[280px] overflow-y-auto">
                        <div className="divide-y divide-borderCool">
                          {activeProblem.students.map(st => {
                            const statusCls = st.status === 'accepted' 
                              ? 'bg-success/10 text-success' 
                              : st.status === 'submitted' 
                              ? 'bg-warning/10 text-warning' 
                              : 'bg-textMuted/10 text-textMuted';

                            return (
                              <div key={st.studentId} className="flex justify-between items-center gap-4 px-4 py-3 hover:bg-bgHover/20">
                                <div>
                                  <strong className="text-xs font-semibold text-textPrimary block">{st.name}</strong>
                                  <small className="text-[10px] text-textMuted block mt-0.5">Roll: {st.rollNumber}</small>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  {st.url && (user.role === 'admin' || String(st.studentId) === String(user._id)) && (
                                    <a
                                      href={st.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] font-semibold text-primary hover:underline"
                                    >
                                      View Code
                                    </a>
                                  )}
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusCls}`}>
                                    {st.status === 'accepted' ? 'Accepted' : st.status === 'submitted' ? 'Submitted' : 'Pending'}
                                  </span>
                                  {st.status !== 'pending' && st.onTime !== undefined && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                      st.onTime ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
                                    }`}>
                                      {st.onTime ? 'On Time' : 'Late'}
                                    </span>
                                  )}
                                  {st.status === 'accepted' && (
                                    <span className="text-xs font-bold text-textPrimary">
                                      {st.score} pts
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 text-sm text-textMuted">
                    Select a daily Leetcode challenge to view student submissions.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Task Submission Tracker Tab */}
          {tab === 'tasks' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Tasks List */}
              <div className="lg:col-span-1 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4">
                <div className="pb-3 border-b border-borderCool/60">
                  <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={15} className="text-primary" /> Learning Assignments
                  </h4>
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] pr-1.5">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-xs text-textMuted">
                      No assignments published to this batch.
                    </div>
                  ) : (
                    tasks.map(t => (
                      <button
                        key={t._id}
                        onClick={() => setActiveTaskId(t._id)}
                        className={`text-left p-3.5 rounded-lg border text-xs flex flex-col gap-1.5 transition-all ${
                          activeTaskId === t._id 
                            ? 'bg-primary/5 border-primary shadow-sm' 
                            : 'bg-bgPrimary border-borderCool hover:border-textMuted/45'
                        }`}
                      >
                        <strong className="font-semibold text-textPrimary truncate block">{t.title}</strong>
                        <span className="text-[10px] text-textMuted flex items-center gap-1">
                          <Calendar size={12} /> Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column - Student Submissions details */}
              <div className="lg:col-span-2 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4">
                {activeTask ? (
                  <>
                    <div className="pb-3.5 border-b border-borderCool flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-title text-sm font-semibold text-textPrimary">{activeTask.title}</h3>
                        <span className="text-[10px] text-textMuted block mt-0.5">Max Score: {activeTask.maxScore || 100} pts</span>
                      </div>
                      <span className="text-xs text-textMuted bg-bgPrimary border border-borderCool/60 px-3 py-1 rounded-lg self-start sm:self-center">
                        Due: {activeTask.dueDate ? new Date(activeTask.dueDate).toLocaleDateString() : 'Open'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-textMuted uppercase tracking-wider block mb-1">Assignment Logs</span>
                      
                      <div className="border border-borderCool rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
                        <div className="divide-y divide-borderCool">
                          {activeTask.students.map(st => {
                            const statusCls = st.status === 'accepted' 
                              ? 'bg-success/10 text-success' 
                              : st.status === 'submitted' 
                              ? 'bg-warning/10 text-warning' 
                              : 'bg-textMuted/10 text-textMuted';

                            return (
                              <div key={st.studentId} className="flex justify-between items-center gap-4 px-4 py-3 hover:bg-bgHover/20">
                                <div>
                                  <strong className="text-xs font-semibold text-textPrimary block">{st.name}</strong>
                                  <small className="text-[10px] text-textMuted block mt-0.5">Roll: {st.rollNumber}</small>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusCls}`}>
                                    {st.status === 'accepted' ? 'Accepted' : st.status === 'submitted' ? 'Submitted' : 'Pending'}
                                  </span>
                                  {st.status !== 'pending' && st.onTime !== undefined && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                      st.onTime ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
                                    }`}>
                                      {st.onTime ? 'On Time' : 'Late'}
                                    </span>
                                  )}
                                  {st.status === 'accepted' && (
                                    <span className="text-xs font-bold text-textPrimary">
                                      {st.score} / {activeTask.maxScore || 100} pts
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 text-sm text-textMuted">
                    Select a learning assignment to view student submissions.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Solution Submittal Modal */}
      <Modal isOpen={!!attemptProblem} onClose={() => setAttemptProblem(null)} title={attemptProblem ? `Submit Solution: ${attemptProblem.title}` : ''}>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!attemptProblem) return;
            const link = forms.leetcodeAttempt[attemptProblem._id];
            if (!link) return;
            await action(
              () => api.post(`/api/leetcode/problems/${attemptProblem._id}/submit`, { submissionUrl: link }),
              'Solution submitted successfully'
            );
            setAttemptProblem(null);
            await fetchLeaderboard();
          }}
        >
          <p className="text-xs text-textSecondary leading-relaxed">
            Verify your code passes all test suites on Leetcode, then copy and paste the submission detail link below.
          </p>
          <Field
            placeholder="https://leetcode.com/submissions/detail/12345678/"
            value={forms.leetcodeAttempt[attemptProblem?._id] || ''}
            onChange={(value) => setForm('leetcodeAttempt', attemptProblem._id, value)}
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
