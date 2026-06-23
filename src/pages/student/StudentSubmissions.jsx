import React, { useState } from 'react';
import { BookOpen, Code2, ClipboardCheck, Calendar, Github, Globe, FileDown, MessageSquare, Award, AlertCircle } from 'lucide-react';
import { Badge, SectionTitle, DataList } from '../../components/Shared';

export default function StudentSubmissions({ data, api, action }) {
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'leetcode'

  const taskSubmissions = data.submissions || [];
  const leetcodeSubmissions = data.leetcodeSubmissions || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-borderCool">
        <div>
          <h2 className="font-title text-lg font-bold text-textPrimary flex items-center gap-2">
            <ClipboardCheck className="text-primary" size={20} /> My Submissions
          </h2>
          <p className="text-xs text-textMuted mt-1">
            Track and review your submitted tasks and resolved coding challenges.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-1.5 p-1 bg-bgSecondary border border-borderCool rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
            activeTab === 'tasks'
              ? 'bg-primary text-white shadow-sm'
              : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
          }`}
        >
          <BookOpen size={14} /> Task Submissions ({taskSubmissions.length})
        </button>
        <button
          onClick={() => setActiveTab('leetcode')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
            activeTab === 'leetcode'
              ? 'bg-primary text-white shadow-sm'
              : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
          }`}
        >
          <Code2 size={14} /> LeetCode Submissions ({leetcodeSubmissions.length})
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'tasks' ? (
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <SectionTitle icon={BookOpen} title="Task Submissions Log" />
          
          <DataList emptyText="No task submissions found. Submit assignments via the Tasks page.">
            <div className="grid grid-cols-1 gap-4">
              {taskSubmissions.map((sub) => {
                const isCloudinary = sub.fileUrl && (sub.fileUrl.startsWith('http://') || sub.fileUrl.startsWith('https://'));
                const fileUrl = isCloudinary 
                  ? sub.fileUrl 
                  : `${api.getUri ? api.getUri() : 'http://127.0.0.1:5000'}/${sub.fileUrl}`;

                return (
                  <div
                    key={sub._id}
                    className="bg-bgPrimary border border-borderCool rounded-xl p-5 flex flex-col gap-4 hover:border-primary/20 transition-all shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <h3 className="font-title text-sm font-semibold text-textPrimary truncate">
                          {sub.task?.title || 'Unknown Task'}
                        </h3>
                        <span className="flex items-center gap-1 text-[10px] text-textMuted font-medium mt-1">
                          <Calendar size={11} />
                          Submitted: {new Date(sub.updatedAt || sub.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <Badge value={sub.status || 'submitted'} />
                    </div>

                    {/* Submission Links */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {sub.githubUrl && (
                        <a
                          href={sub.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-textSecondary text-textPrimary px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Github size={13} className="text-textSecondary" /> GitHub Repo
                        </a>
                      )}
                      {sub.liveUrl && (
                        <a
                          href={sub.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-textSecondary text-textPrimary px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Globe size={13} className="text-textSecondary" /> Live Demo
                        </a>
                      )}
                      {sub.fileUrl && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-textSecondary text-textPrimary px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <FileDown size={13} className="text-textSecondary" /> Attachment File
                        </a>
                      )}
                    </div>

                    {/* Student Notes */}
                    {sub.notes && (
                      <div className="bg-bgSecondary/60 border border-borderCool/40 rounded-lg p-3 text-xs text-textSecondary leading-relaxed">
                        <strong className="text-textPrimary block mb-1">Your Submission Notes:</strong>
                        <p className="italic">"{sub.notes}"</p>
                      </div>
                    )}

                    {/* Review Feedback / Score */}
                    {sub.status === 'accepted' && (
                      <div className="bg-success-light/40 border border-success/20 rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs font-semibold text-success-text">
                          <span className="flex items-center gap-1.5">
                            <Award size={14} /> Assigned Grade Score
                          </span>
                          <strong className="text-sm font-bold">
                            {sub.score} / {sub.task?.maxScore || 100} pts
                          </strong>
                        </div>
                        {sub.feedback && (
                          <div className="border-t border-success/15 pt-2 text-[11px] text-success-text leading-relaxed">
                            <strong className="font-bold block">Mentor Feedback:</strong>
                            <p className="italic">"{sub.feedback}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    {sub.status === 'resubmit' && (
                      <div className="bg-danger/5 border border-danger/10 text-danger-text rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <AlertCircle size={14} className="text-danger" /> Resubmit Requested
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          <strong>Reason / Instructions:</strong> {sub.feedback || 'Please review your solution and submit again.'}
                        </p>
                      </div>
                    )}

                    {sub.status === 'submitted' && sub.autoScore !== undefined && (
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-xs text-primary-text flex justify-between items-center">
                        <span className="font-medium">Estimated decayed submission score:</span>
                        <strong className="font-bold">{sub.autoScore} / {sub.task?.maxScore || 100} pts</strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DataList>
        </div>
      ) : (
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <SectionTitle icon={Code2} title="LeetCode Submissions Log" />

          <DataList emptyText="No LeetCode submissions found. Resolve problems via the LeetCode page.">
            <div className="grid grid-cols-1 gap-4">
              {leetcodeSubmissions.map((sub) => {
                return (
                  <div
                    key={sub._id}
                    className="bg-bgPrimary border border-borderCool rounded-xl p-5 flex flex-col gap-4 hover:border-primary/20 transition-all shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <h3 className="font-title text-sm font-semibold text-textPrimary truncate">
                          {sub.problem?.title || 'LeetCode Challenge'}
                        </h3>
                        <span className="flex items-center gap-1 text-[10px] text-textMuted font-medium mt-1">
                          <Calendar size={11} />
                          Submitted: {new Date(sub.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <Badge value={sub.status || 'submitted'} />
                    </div>

                    {/* Solutions link */}
                    <div className="flex items-center gap-2">
                      <a
                        href={sub.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <Globe size={13} /> View Submission Link ↗
                      </a>
                    </div>

                    {/* Scores and feedback */}
                    <div className="bg-bgSecondary/60 border border-borderCool/40 rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-textPrimary">
                        <span className="flex items-center gap-1.5 text-textMuted">
                          <Award size={14} className="text-primary" /> Grade Score
                        </span>
                        <strong className="text-sm font-bold text-primary">
                          {sub.score || 0} / 10 pts
                        </strong>
                      </div>
                      {sub.feedback && (
                        <div className="border-t border-borderCool/30 pt-2 text-[11px] text-textSecondary leading-relaxed">
                          <strong className="font-bold text-textPrimary block">Feedback:</strong>
                          <p className="italic">"{sub.feedback}"</p>
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
    </div>
  );
}
