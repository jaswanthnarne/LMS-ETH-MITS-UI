import React, { useState } from 'react';
import { Code2, BarChart3, Star, Flame, Send, Award, CheckCircle, Link as LinkIcon, Calendar, Trophy } from 'lucide-react';
import { Field, SectionTitle, DataList, Row, Badge, Modal } from '../../components/Shared';

export default function StudentLeetcode({ user, data, forms, setForm, api, action }) {
  const [tab, setTab] = useState('challenges'); // challenges | profile | leaderboard
  const [attemptProblem, setAttemptProblem] = useState(null); // problem object

  const [syncing, setSyncing] = useState(false);

  const record = data.leetcode; // student's linked profile
  const problems = data.leetcodeProblems || [];
  const leaderboard = data.leetcodeList || data.leetcode || []; // list of records

  return (
    <div className="flex flex-col gap-6">
      {/* Sub tabs navigation */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-bgSecondary border border-borderCool rounded-xl w-fit">
        <button 
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
            tab === 'challenges' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
          }`} 
          onClick={() => setTab('challenges')}
        >
          <Code2 size={14} /> Solve Challenges
        </button>
        <button 
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
            tab === 'profile' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
          }`} 
          onClick={() => setTab('profile')}
        >
          <Star size={14} /> Profile Sync
        </button>
        <button 
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
            tab === 'leaderboard' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
          }`} 
          onClick={() => setTab('leaderboard')}
        >
          <Award size={14} /> Leaderboard
        </button>
      </div>

      {tab === 'challenges' && (
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
          <div className="pb-5 mb-5 border-b border-borderCool">
            <SectionTitle icon={Code2} title="Assigned Coding Challenges" />
            <p className="text-xs text-textMuted mt-1">
              Attempt coding problems on Leetcode and submit your solution link.
            </p>
          </div>

          <DataList emptyText="No Leetcode problems assigned to your batch yet.">
            <div className="grid grid-cols-1 gap-4">
              {problems.map((problem) => {
                const submission = problem.submission;
                const hasSubmitted = !!submission;
                
                return (
                  <div 
                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bgPrimary border border-borderCool hover:border-primary/20 rounded-xl p-5 shadow-sm transition-colors" 
                    key={problem._id}
                  >
                    <div className="min-w-0 flex-1 flex flex-col gap-2">
                      <h3 className="font-title text-sm font-semibold text-textPrimary">{problem.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-textMuted">
                        <span className="flex items-center gap-1">
                          <LinkIcon size={13} />
                          <a 
                            href={problem.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-primary hover:underline font-semibold"
                          >
                            LeetCode URL
                          </a>
                        </span>
                        {problem.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={13} className="text-textMuted" /> Due: {new Date(problem.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-auto shrink-0 flex items-center justify-end">
                      {!hasSubmitted ? (
                        <button
                          className="flex items-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-lg shadow-sm"
                          onClick={() => setAttemptProblem(problem)}
                        >
                          <Send size={13} /> Submit Solution
                        </button>
                      ) : (
                        <div className="w-full md:w-[220px] bg-bgSecondary border border-borderCool rounded-lg p-3 text-xs flex flex-col gap-1.5 shadow-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Status</span>
                            <Badge value={submission.status} />
                          </div>
                          
                          {submission.status === 'accepted' && (
                            <div className="bg-bgPrimary rounded p-2 border border-borderCool/60 mt-0.5">
                              <strong className="text-textPrimary font-bold text-xs block">Grade: {submission.score} pts</strong>
                              {submission.feedback && (
                                <p className="text-[11px] text-textSecondary italic mt-1 leading-relaxed">
                                  "{submission.feedback}"
                                </p>
                              )}
                            </div>
                          )}
                          
                          <a 
                            href={submission.submissionUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[11px] text-primary font-semibold hover:underline block text-right mt-1"
                          >
                            View My Submission ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </DataList>
        </div>
      )}

      {tab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            className="lg:col-span-1 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4 self-start"
            onSubmit={async (event) => {
              event.preventDefault();
              setSyncing(true);
              await action(
                () => api.post('/api/leetcode/mine', { username: forms.leetcode.username }),
                'Leetcode profile linked and synced'
              );
              setSyncing(false);
            }}
          >
            <SectionTitle icon={Code2} title="Link Leetcode Profile" />
            <Field placeholder="Leetcode username" value={forms.leetcode.username} onChange={(value) => setForm('leetcode', 'username', value)} required />
            
            <button 
              type="submit" 
              disabled={syncing}
              className="flex items-center justify-center gap-2 w-full text-center text-sm font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm disabled:opacity-70"
            >
              {syncing ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <BarChart3 size={15} />
              )}
              {syncing ? 'Syncing Stats...' : 'Link & Sync Stats'}
            </button>
          </form>

          <div className="lg:col-span-2 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <SectionTitle icon={Star} title="My Linked Portfolio Stats" />
            
            {record ? (
              <div className="bg-bgPrimary border border-borderCool rounded-xl p-5 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-title text-base font-bold text-textPrimary">@{record.username}</h3>
                  <span className="text-[10px] font-bold text-textMuted bg-bgSecondary border border-borderCool px-2 py-0.5 rounded uppercase tracking-wider">
                    Synced: {record.lastSyncedAt ? new Date(record.lastSyncedAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bgSecondary border border-borderCool/60 rounded-xl p-4 text-center">
                    <strong className="text-2xl font-black text-textPrimary block">{record.totalSolved || 0}</strong>
                    <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider block mt-1">Total Solved</span>
                  </div>
                  
                  <div className="bg-bgSecondary border border-borderCool/60 rounded-xl p-4 text-center flex flex-col items-center justify-center">
                    <strong className="text-2xl font-black text-warning-text flex items-center justify-center gap-1">
                      <Flame size={20} className="fill-warning/20 text-warning" />
                      {record.streak || 0}
                    </strong>
                    <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider block mt-1">Streak Count</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex justify-between items-center bg-success-light border border-success/10 rounded-lg p-2.5 text-xs font-semibold text-success-text">
                    <span>Easy Problems</span>
                    <strong>{record.easy || 0}</strong>
                  </div>
                  <div className="flex justify-between items-center bg-warning-light border border-warning/10 rounded-lg p-2.5 text-xs font-semibold text-warning-text">
                    <span>Medium Problems</span>
                    <strong>{record.medium || 0}</strong>
                  </div>
                  <div className="flex justify-between items-center bg-danger-light border border-danger/10 rounded-lg p-2.5 text-xs font-semibold text-danger-text">
                    <span>Hard Problems</span>
                    <strong>{record.hard || 0}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-textMuted border border-dashed border-borderCool rounded-xl p-6 leading-relaxed">
                Fill out the profile sync form to map your daily solved coding totals and track consistency streaks.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
          <div className="pb-5 mb-5 border-b border-borderCool">
            <SectionTitle icon={Trophy} title="Leetcode Leaderboard" />
            <p className="text-xs text-textMuted mt-1">
              Top rank coders in your cohort based on total problems solved and active streak.
            </p>
          </div>

          <DataList emptyText="No leetcode metrics yet.">
            <div className="grid grid-cols-1 gap-2">
              {Array.isArray(leaderboard) ? (
                leaderboard.map((recordItem, index) => {
                  const rankColor = index === 0 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                    : index === 1 
                    ? 'bg-slate-400/15 text-slate-500 dark:text-slate-300 border-slate-400/25' 
                    : index === 2 
                    ? 'bg-orange-700/10 text-orange-700 dark:text-orange-400 border-orange-700/20' 
                    : 'bg-bgSecondary text-textSecondary border-borderCool/60';

                  return (
                    <div 
                      className="flex justify-between items-center gap-4 bg-bgPrimary border border-borderCool/80 rounded-xl px-5 py-4 hover:border-primary/20 transition-colors"
                      key={recordItem._id}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${rankColor}`}>
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-textPrimary block truncate">
                            {recordItem.student?.name || recordItem.username}
                          </span>
                          <span className="text-[10px] text-textMuted block font-medium truncate mt-0.5">
                            Handle: @{recordItem.username} | Easy: {recordItem.easy || 0} • Med: {recordItem.medium || 0} • Hard: {recordItem.hard || 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <strong className="text-sm font-bold text-textPrimary block">{recordItem.totalSolved || 0} solved</strong>
                          <span className="block text-[9px] uppercase font-bold text-warning-text mt-0.5 bg-warning-light border border-warning/10 px-1.5 py-0.5 rounded-full">
                            {recordItem.streak || 0} days streak
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex justify-between items-center gap-4 bg-bgPrimary border border-borderCool rounded-xl px-5 py-4">
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-textPrimary block truncate">
                      {leaderboard.student?.name || leaderboard.username}
                    </span>
                    <span className="text-[10px] text-textMuted block font-medium truncate mt-0.5">
                      Handle: @{leaderboard.username}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <strong className="text-sm font-bold text-textPrimary block">{leaderboard.totalSolved || 0} solved</strong>
                    <span className="block text-[9px] uppercase font-bold text-warning-text mt-0.5 bg-warning-light border border-warning/10 px-1.5 py-0.5 rounded-full">
                      {leaderboard.streak || 0} days streak
                    </span>
                  </div>
                </div>
              )}
            </div>
          </DataList>
        </div>
      )}

      {/* Solution Submittal Modal */}
      <Modal isOpen={!!attemptProblem} onClose={() => setAttemptProblem(null)} title={attemptProblem ? `Submit Solution: ${attemptProblem.title}` : ''}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!attemptProblem) return;
            const link = forms.leetcodeAttempt[attemptProblem._id];
            if (!link) return;
            action(
              () => api.post(`/api/leetcode/problems/${attemptProblem._id}/submit`, { submissionUrl: link }),
              'Solution submitted successfully'
            );
            setAttemptProblem(null);
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
