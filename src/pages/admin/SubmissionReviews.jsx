import React, { useState } from 'react';
import { ClipboardCheck, FileCode, CheckSquare, Github, Globe, FileUp } from 'lucide-react';
import { Field, Select, DataList, SectionTitle } from '../../components/Shared';

export default function SubmissionReviews({ data, forms, setForm, api, action }) {
  const [batchFilter, setBatchFilter] = useState('');
  const [selectedSubIds, setSelectedSubIds] = useState([]);
  const [bulkScore, setBulkScore] = useState('');

  const filteredSubmissions = data.submissions.filter((submission) => {
    if (!batchFilter) return true;
    const subBatchId = submission.student?.batch?._id || submission.student?.batch || submission.task?.batch?._id || submission.task?.batch;
    return String(subBatchId) === String(batchFilter);
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSubIds(filteredSubmissions.map(s => s._id));
    } else {
      setSelectedSubIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedSubIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const executeBulkAction = async (status, score) => {
    if (selectedSubIds.length === 0) return;
    const payload = { ids: selectedSubIds };
    if (status) payload.status = status;
    if (score !== undefined) payload.score = Number(score);

    await action(
      () => api.post('/api/tasks/submissions/bulk-review', payload),
      `Successfully bulk updated ${selectedSubIds.length} submissions`
    );
    setSelectedSubIds([]);
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-borderCool">
          <div>
            <SectionTitle icon={ClipboardCheck} title="Submission Review Queue" />
            <p className="text-xs text-textMuted mt-1">
              Review code uploads, websites, links and grade assignments.
            </p>
          </div>
          {data.batches?.length > 0 && (
            <Select
              value={batchFilter}
              onChange={setBatchFilter}
              options={[['', 'All Cohorts / Batches'], ...data.batches.map(b => [b._id, b.name])]}
              className="w-full sm:w-[220px]"
            />
          )}
        </div>

        {filteredSubmissions.length > 0 && (
          <div className="bg-bgPrimary border border-borderCool rounded-xl p-4 mb-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={selectedSubIds.length === filteredSubmissions.length && filteredSubmissions.length > 0} 
                onChange={handleSelectAll}
                className="w-4 h-4 text-primary border-borderCool rounded focus:ring-primary cursor-pointer"
              />
              <span className="font-semibold text-textPrimary">
                {selectedSubIds.length} of {filteredSubmissions.length} selected
              </span>
            </div>
            
            {selectedSubIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => executeBulkAction('accepted')}
                  className="bg-success text-white px-3.5 py-1.5 rounded-lg font-semibold hover:bg-success/90"
                >
                  Mark Accepted
                </button>
                <button
                  onClick={() => executeBulkAction('submitted')}
                  className="bg-bgSecondary border border-borderCool text-textPrimary px-3.5 py-1.5 rounded-lg font-semibold hover:bg-bgHover"
                >
                  Mark Submitted
                </button>
                <div className="flex items-center gap-1 bg-bgSecondary border border-borderCool rounded-lg px-2.5 py-0.5">
                  <input
                    type="number"
                    placeholder="Score"
                    value={bulkScore}
                    onChange={(e) => setBulkScore(e.target.value)}
                    className="w-14 bg-transparent outline-none text-textPrimary"
                  />
                  <button
                    onClick={() => {
                      if (bulkScore === '') return;
                      executeBulkAction(undefined, bulkScore);
                      setBulkScore('');
                    }}
                    className="text-primary font-bold hover:underline"
                  >
                    Apply Marks
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <DataList emptyText="No student task submissions require reviews.">
          <div className="grid grid-cols-1 gap-5">
            {filteredSubmissions.map((submission) => (
              <div 
                className="flex flex-col lg:flex-row justify-between gap-6 bg-bgPrimary border border-borderCool rounded-xl p-5 hover:border-primary/30 transition-all relative pl-12" 
                key={submission._id}
              >
                <div className="absolute left-4 top-6">
                  <input 
                    type="checkbox" 
                    checked={selectedSubIds.includes(submission._id)} 
                    onChange={() => handleSelectOne(submission._id)}
                    className="w-4 h-4 text-primary border-borderCool rounded focus:ring-primary cursor-pointer"
                  />
                </div>
                {/* Left side: submission details & links */}
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileCode size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-title text-sm font-semibold text-textPrimary truncate">{submission.task?.title}</h3>
                      <small className="text-[11px] text-textMuted block mt-0.5">Submitted by {submission.student?.name}</small>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Auto Grade: {submission.autoScore} / {submission.task?.maxScore || 100}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          submission.status === 'accepted' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                        }`}>
                          Status: {submission.status}
                        </span>
                        {submission.status === 'accepted' && (
                          <span className="text-[10px] font-bold text-textPrimary bg-bgSecondary border border-borderCool px-2 py-0.5 rounded-full">
                            Score Assigned: {submission.score}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Submission Links */}
                  <div className="flex flex-wrap gap-2.5 mt-2">
                    {submission.githubUrl && (
                      <a 
                        href={submission.githubUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-textSecondary text-textPrimary px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Github size={13} className="text-textSecondary" /> GitHub Repo
                      </a>
                    )}
                    {submission.liveUrl && (
                      <a 
                        href={submission.liveUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-textSecondary text-textPrimary px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Globe size={13} className="text-textSecondary" /> Live Demo
                      </a>
                    )}
                    {submission.fileUrl && (
                      <a 
                        href={`${api.getUri ? api.getUri() : 'http://127.0.0.1:5000'}/${submission.fileUrl}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-textSecondary text-textPrimary px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <FileUp size={13} className="text-textSecondary" /> Attachment
                      </a>
                    )}
                  </div>

                  {submission.notes && (
                    <div className="bg-bgSecondary border border-borderCool/60 rounded-lg p-3 text-xs text-textSecondary italic mt-1 leading-relaxed">
                      <strong>Student Notes:</strong> "{submission.notes}"
                    </div>
                  )}
                </div>

                {/* Right side: grading panel */}
                <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-3 pt-4 lg:pt-0 lg:pl-5 border-t lg:border-t-0 lg:border-l border-borderCool/60">
                  <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider block">Grading Panel</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Field 
                      placeholder="Score" 
                      type="number" 
                      value={forms.review.score} 
                      onChange={(value) => setForm('review', 'score', Number(value))} 
                    />
                    <div className="flex flex-col gap-1.5 justify-end">
                      <Select
                        value={forms.review.status}
                        onChange={(value) => setForm('review', 'status', value)}
                        options={[['accepted', 'Accepted'], ['resubmit', 'Resubmit'], ['submitted', 'Submitted']]}
                      />
                    </div>
                  </div>

                  <Field 
                    placeholder="Feedback / Notes" 
                    value={forms.review.feedback} 
                    onChange={(value) => setForm('review', 'feedback', value)} 
                  />

                  <button
                    className="flex items-center justify-center gap-1.5 w-full text-center text-xs font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm mt-1"
                    onClick={() => {
                      setForm('review', 'task', submission.task?._id);
                      action(() => api.patch(`/api/tasks/submissions/${submission._id}`, forms.review), 'Submission graded');
                    }}
                  >
                    <CheckSquare size={14} /> Save Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DataList>
      </div>
    </div>
  );
}
