import React, { useState } from 'react';
import { BookOpen, Send, Calendar, Link2, FileUp, ClipboardCheck, Code, CheckCircle, Github, Globe, FileDown, X } from 'lucide-react';
import { Field, TextArea, Select, DataList, SectionTitle, Modal, Badge } from '../../components/Shared';

export default function MyTasks({ data, forms, setForm, api, action }) {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('');

  const mySubmissions = data.submissions || [];

  const filteredTasks = data.tasks.filter((task) => {
    if (!dateFilter) return true;
    if (!task.dueDate) return false;
    const taskDateStr = new Date(task.dueDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return taskDateStr === dateFilter;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-borderCool">
        <div>
          <h2 className="font-title text-lg font-bold text-textPrimary flex items-center gap-2">
            <BookOpen className="text-primary" size={20} /> My Assignments & Submissions
          </h2>
          <p className="text-xs text-textMuted mt-1">
            View assigned cohort tasks and track your submission review status.
          </p>
        </div>
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="flex items-center gap-2 bg-bgSecondary border border-borderCool px-3 py-1.5 rounded-lg shadow-sm">
            <span className="text-xs font-semibold text-textMuted flex items-center gap-1.5 shrink-0">
              <Calendar size={13} /> Filter Date:
            </span>
            <div className="relative flex items-center">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-bgPrimary border border-borderCool/80 text-textPrimary text-xs rounded px-2 py-1 outline-none cursor-pointer pr-7 font-semibold"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="absolute right-1.5 text-textMuted hover:text-textPrimary p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
          <button 
            onClick={() => setIsSubmitOpen(true)}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-lg shadow-sm shrink-0"
          >
            <Send size={14} /> Submit a Solution
          </button>
        </div>
      </div>

      {/* Assigned Tasks Card Grid */}
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4">
        <SectionTitle icon={BookOpen} title="Assigned Tasks" />
        
        <DataList emptyText="No tasks currently assigned to your cohort.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => {
              const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
              if (dueDateObj) {
                dueDateObj.setHours(23, 59, 59, 999);
              }
              const duePassed = dueDateObj && new Date() > dueDateObj;
              const submission = mySubmissions.find(sub => String(sub.task?._id || sub.task) === String(task._id));
              const hasSubmitted = !!submission;
              const status = submission?.status;
              const isBtnDisabled = duePassed || (hasSubmitted && (status === 'submitted' || status === 'accepted'));
              
              let btnText = 'Submit Solution';
              if (duePassed) btnText = 'Due Date Passed';
              else if (status === 'accepted') btnText = 'Submission Accepted';
              else if (status === 'submitted') btnText = 'Submitted';
              else if (status === 'resubmit') btnText = 'Resubmit Solution';

              return (
                <div 
                  key={task._id}
                  className="bg-bgPrimary border border-borderCool rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-primary/20 transition-all shadow-sm"
                >
                  <div className="min-w-0 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded uppercase tracking-wider">
                        {task.batch ? `${task.batch.name}` : 'Cohort'}
                      </span>
                      <strong className="text-textPrimary text-xs bg-bgSecondary border border-borderCool px-2 py-0.5 rounded">
                        {task.maxScore} pts
                      </strong>
                    </div>
                    <strong className="font-title text-sm font-semibold text-textPrimary block truncate">
                      {task.title}
                    </strong>
                    <p className="text-xs text-textMuted line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 mt-1 border-t border-borderCool/40 pt-3">
                    <div className="flex items-center justify-between text-xs text-textSecondary font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-textMuted" /> 
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Open'}
                      </span>
                      {task.leetcodeUrl && (
                        <a
                          href={task.leetcodeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold bg-warning-light text-warning-text border border-warning/10 px-2 py-0.5 rounded"
                        >
                          LeetCode Link ↗
                        </a>
                      )}
                    </div>

                    <button
                      disabled={isBtnDisabled}
                      onClick={() => {
                        setForm('submission', 'task', task._id);
                        setIsSubmitOpen(true);
                      }}
                      className={`w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg shadow-sm transition-all ${
                        isBtnDisabled
                          ? 'bg-bgHover text-textMuted border border-borderCool cursor-not-allowed'
                          : 'bg-primary hover:bg-primary/95 text-white'
                      }`}
                    >
                      {status === 'accepted' ? <CheckCircle size={12} /> : <Send size={12} />}
                      {btnText}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </DataList>
      </div>

      {/* Submission History Cards (Full Width) */}
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4">
        <SectionTitle icon={ClipboardCheck} title="My Submissions History" />
        
        <DataList emptyText="You haven't submitted any solutions yet. Click 'Submit a Solution' to get started.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mySubmissions.map((sub) => (
              <div 
                key={sub._id}
                className="bg-bgPrimary border border-borderCool rounded-xl p-5 flex flex-col gap-3.5 hover:border-primary/20 transition-all shadow-sm"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <strong className="font-title text-sm font-semibold text-textPrimary block truncate">{sub.task?.title || 'Unknown Task'}</strong>
                    <span className="text-[10px] text-textMuted font-medium block mt-0.5">
                      Submitted: {new Date(sub.updatedAt || sub.createdAt).toLocaleDateString()}
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
                      className="inline-flex items-center gap-1 text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-textSecondary text-textPrimary px-2.5 py-1 rounded-lg"
                    >
                      <Github size={12} className="text-textSecondary" /> Repo
                    </a>
                  )}
                  {sub.liveUrl && (
                    <a 
                      href={sub.liveUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-1 text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-textSecondary text-textPrimary px-2.5 py-1 rounded-lg"
                    >
                      <Globe size={12} className="text-textSecondary" /> Demo
                    </a>
                  )}
                  {sub.fileUrl && (
                    <a 
                      href={`${api.getUri ? api.getUri() : 'http://127.0.0.1:5000'}/${sub.fileUrl}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-1 text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-textSecondary text-textPrimary px-2.5 py-1 rounded-lg"
                    >
                      <FileDown size={12} className="text-textSecondary" /> Attachment
                    </a>
                  )}
                </div>

                {sub.status === 'accepted' && (
                  <div className="bg-bgSecondary border border-borderCool/60 rounded-lg p-3 text-xs flex flex-col gap-1">
                    <div className="flex justify-between items-center text-textPrimary font-semibold">
                      <span>Grade Score</span>
                      <span className="text-primary font-bold">{sub.score} / {sub.task?.maxScore || 100} pts</span>
                    </div>
                    {sub.feedback && (
                      <p className="text-[11px] text-textSecondary italic mt-1 border-t border-borderCool/40 pt-1.5 leading-relaxed">
                        <strong>Feedback:</strong> "{sub.feedback}"
                      </p>
                    )}
                  </div>
                )}

                {sub.status === 'resubmit' && (
                  <div className="bg-danger/5 border border-danger/10 text-danger-text rounded-lg p-3 text-xs leading-relaxed">
                    <strong>Resubmit Requested:</strong> {sub.feedback || 'Please review and resubmit your solution.'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DataList>
      </div>

      {/* Solutions Submit Modal Form */}
      <Modal isOpen={isSubmitOpen} onClose={() => setIsSubmitOpen(false)} title="Submit Assignment Solution">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const body = new FormData(event.currentTarget);
            action(async () => {
              await api.postForm(`/api/tasks/${forms.submission.task}/submit`, body);
              setIsSubmitOpen(false);
            }, 'Assignment submitted successfully');
          }}
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-textMuted">Select Assigned Task</span>
            <Select
              name="task"
              value={forms.submission.task}
              onChange={(value) => setForm('submission', 'task', value)}
              options={[
                ['', 'Select Assigned Task'],
                ...data.tasks
                  .filter((task) => {
                    const sub = mySubmissions.find((s) => String(s.task?._id || s.task) === String(task._id));
                    return !sub || sub.status === 'resubmit';
                  })
                  .map((task) => [task._id, task.title])
              ]}
              required
            />
          </div>

          <Field name="githubUrl" placeholder="GitHub Repository Link (optional)" value={forms.submission.githubUrl} onChange={(value) => setForm('submission', 'githubUrl', value)} />
          <Field name="liveUrl" placeholder="Live Deploy Showcase Link (optional)" value={forms.submission.liveUrl} onChange={(value) => setForm('submission', 'liveUrl', value)} />
          
          {/* Styled File Field */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-textMuted">Upload File Attachment (ZIP, PDF, Image)</span>
            <label className="flex items-center gap-2 bg-bgPrimary border border-borderCool rounded-lg px-3 py-2.5 cursor-pointer hover:border-primary/40 hover:bg-bgHover/40 transition-colors">
              <FileUp size={16} className="text-textMuted" />
              <span className="text-xs text-textSecondary font-semibold">Choose file...</span>
              <input name="file" type="file" className="hidden" onChange={(e) => {
                const fileLabel = e.target.nextSibling || e.target.parentElement.querySelector('.file-name-label');
                if (fileLabel) {
                  fileLabel.innerText = e.target.files[0]?.name || 'Choose file...';
                }
              }} />
              <span className="file-name-label text-xs text-textMuted truncate ml-auto">No file chosen</span>
            </label>
          </div>
          
          <TextArea name="notes" placeholder="Add optional remarks or notes for the reviewer..." value={forms.submission.notes} onChange={(value) => setForm('submission', 'notes', value)} />
          
          <button className="flex items-center justify-center gap-2 w-full text-center text-sm font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm">
            <Send size={15} /> Submit Solution
          </button>
        </form>
      </Modal>
    </div>
  );
}
