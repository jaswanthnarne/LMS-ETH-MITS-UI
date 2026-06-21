import React, { useState } from 'react';
import { Code2, Plus, ListChecks, Award, Save, CheckSquare, Edit2, Trash2, X, Link, GraduationCap, Trophy } from 'lucide-react';
import { SectionTitle, DataList, Row, Badge, Field, Select, Modal } from '../../components/Shared';

export default function AdminLeetcode({ data, forms, setForm, api, action }) {
  const [tab, setTab] = useState('publish'); // publish | reviews | leaderboard
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [batchFilter, setBatchFilter] = useState('');
  const [selectedLeetcodeSubIds, setSelectedLeetcodeSubIds] = useState([]);
  const [bulkLeetcodeScore, setBulkLeetcodeScore] = useState('');

  const records = data.leetcode || [];
  const problems = data.leetcodeProblems || [];
  const submissions = data.leetcodeSubmissions || [];

  const handleSelectAllLeetcode = (e) => {
    if (e.target.checked) {
      setSelectedLeetcodeSubIds(filteredSubmissions.map(s => s._id));
    } else {
      setSelectedLeetcodeSubIds([]);
    }
  };

  const handleSelectOneLeetcode = (id) => {
    setSelectedLeetcodeSubIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const executeLeetcodeBulkAction = async (status, score) => {
    if (selectedLeetcodeSubIds.length === 0) return;
    const payload = { ids: selectedLeetcodeSubIds };
    if (status) payload.status = status;
    if (score !== undefined) payload.score = Number(score);

    await action(
      () => api.post('/api/leetcode/submissions/bulk-review', payload),
      `Successfully bulk updated ${selectedLeetcodeSubIds.length} Leetcode submissions`
    );
    setSelectedLeetcodeSubIds([]);
  };

  const filteredProblems = problems.filter((problem) => {
    if (!batchFilter) return true;
    const problemBatchId = problem.batch?._id || problem.batch;
    return String(problemBatchId) === String(batchFilter);
  });

  const filteredSubmissions = submissions.filter((sub) => {
    if (!batchFilter) return true;
    const subBatchId = sub.student?.batch?._id || sub.student?.batch || sub.problem?.batch?._id || sub.problem?.batch;
    return String(subBatchId) === String(batchFilter);
  });

  const filteredLeaderboard = records.filter((record) => {
    if (!batchFilter) return true;
    const studentBatchId = record.student?.batch?._id || record.student?.batch;
    return String(studentBatchId) === String(batchFilter);
  });

  function startCreateProblem() {
    setForm('leetcodeProblem', 'title', '');
    setForm('leetcodeProblem', 'url', '');
    setForm('leetcodeProblem', 'batch', '');
    setForm('leetcodeProblem', 'dueDate', '');
    setEditingProblemId(null);
    setIsModalOpen(true);
  }

  function startEditingProblem(problem) {
    setForm('leetcodeProblem', 'title', problem.title);
    setForm('leetcodeProblem', 'url', problem.url);
    setForm('leetcodeProblem', 'batch', problem.batch?._id || problem.batch);
    setForm('leetcodeProblem', 'dueDate', problem.dueDate ? problem.dueDate.slice(0, 10) : '');
    setEditingProblemId(problem._id);
    setIsModalOpen(true);
  }

  function cancelEditing() {
    setForm('leetcodeProblem', 'title', '');
    setForm('leetcodeProblem', 'url', '');
    setForm('leetcodeProblem', 'batch', '');
    setForm('leetcodeProblem', 'dueDate', '');
    setEditingProblemId(null);
    setIsModalOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (editingProblemId) {
      await action(
        () => api.patch(`/api/leetcode/problems/${editingProblemId}`, forms.leetcodeProblem),
        'Leetcode challenge updated successfully'
      );
    } else {
      await action(
        () => api.post('/api/leetcode/problems', forms.leetcodeProblem),
        'Leetcode challenge published'
      );
    }
    setIsModalOpen(false);
  }

  async function handleDeleteProblem(problemId, problemTitle) {
    if (!window.confirm(`Are you sure you want to permanently delete the Leetcode challenge "${problemTitle}" and all student submissions?`)) return;
    await action(
      () => api.delete(`/api/leetcode/problems/${problemId}`),
      'Leetcode challenge removed'
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Sub tabs navigation & filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5 p-1 bg-bgSecondary border border-borderCool rounded-xl w-fit">
          <button 
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
              tab === 'publish' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
            }`} 
            onClick={() => setTab('publish')}
          >
            <Code2 size={14} /> Publish Problems
          </button>
          <button 
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
              tab === 'reviews' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
            }`} 
            onClick={() => setTab('reviews')}
          >
            <ListChecks size={14} /> Submissions Queue ({filteredSubmissions.filter(s => s.status === 'submitted').length})
          </button>
          <button 
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
              tab === 'leaderboard' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
            }`} 
            onClick={() => setTab('leaderboard')}
          >
            <Award size={14} /> Coding Leaderboard
          </button>
        </div>

        {data.batches?.length > 0 && (
          <Select
            value={batchFilter}
            onChange={setBatchFilter}
            options={[['', 'All Cohorts / Batches'], ...data.batches.map(b => [b._id, b.name])]}
            className="w-full md:w-[220px]"
          />
        )}
      </div>

      {tab === 'publish' && (
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-borderCool">
            <div>
              <SectionTitle icon={Code2} title="Assigned Coding Challenges" />
              <p className="text-xs text-textMuted mt-1">
                Manage and assign daily LeetCode challenges to student cohorts.
              </p>
            </div>
            <button 
              className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-lg shadow-sm"
              onClick={startCreateProblem}
            >
              <Plus size={15} /> Publish Challenge
            </button>
          </div>
          
          <DataList emptyText="No coding challenges published yet. Click 'Publish Challenge' to assign one.">
            <div className="grid grid-cols-1 gap-3.5">
              {filteredProblems.map((problem) => (
                <div 
                  key={problem._id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bgPrimary border border-borderCool hover:border-primary/30 rounded-xl p-5 transition-all shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <strong className="font-title text-sm font-semibold text-textPrimary block truncate mb-1">{problem.title}</strong>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-textMuted">
                      <span className="font-semibold bg-bgSecondary border border-borderCool/60 px-2 py-0.5 rounded text-[10px]">
                        Batch: {problem.batch ? `${problem.batch.name}` : 'All'}
                      </span>
                      <a 
                        href={problem.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-primary hover:underline font-medium truncate max-w-[200px]"
                      >
                        {problem.url}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-borderCool/60 shrink-0">
                    <a 
                      href={problem.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-primary/40 text-textPrimary px-3 py-2 rounded-lg"
                    >
                      Open Link
                    </a>
                    <button 
                      className="p-2 rounded-lg text-textSecondary hover:bg-bgHover transition-colors" 
                      onClick={() => startEditingProblem(problem)} 
                      title="Edit Problem Info"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      className="p-2 rounded-lg text-danger hover:bg-danger/5 transition-colors" 
                      onClick={() => handleDeleteProblem(problem._id, problem.title)} 
                      title="Delete Problem"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </DataList>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
          <div className="pb-5 mb-5 border-b border-borderCool">
            <SectionTitle icon={ListChecks} title="Leetcode Review Queue" />
            <p className="text-xs text-textMuted mt-1">
              Verify links and check solutions submitted by students for review.
            </p>
          </div>

          {filteredSubmissions.length > 0 && (
            <div className="bg-bgPrimary border border-borderCool rounded-xl p-4 mb-4 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={selectedLeetcodeSubIds.length === filteredSubmissions.length && filteredSubmissions.length > 0} 
                  onChange={handleSelectAllLeetcode}
                  className="w-4 h-4 text-primary border-borderCool rounded focus:ring-primary cursor-pointer"
                />
                <span className="font-semibold text-textPrimary">
                  {selectedLeetcodeSubIds.length} of {filteredSubmissions.length} selected
                </span>
              </div>
              
              {selectedLeetcodeSubIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => executeLeetcodeBulkAction('accepted')}
                    className="bg-success text-white px-3.5 py-1.5 rounded-lg font-semibold hover:bg-success/90"
                  >
                    Mark Accepted
                  </button>
                  <button
                    onClick={() => executeLeetcodeBulkAction('submitted')}
                    className="bg-bgSecondary border border-borderCool text-textPrimary px-3.5 py-1.5 rounded-lg font-semibold hover:bg-bgHover"
                  >
                    Mark Submitted
                  </button>
                  <div className="flex items-center gap-1 bg-bgSecondary border border-borderCool rounded-lg px-2.5 py-0.5">
                    <input
                      type="number"
                      placeholder="Score"
                      value={bulkLeetcodeScore}
                      onChange={(e) => setBulkLeetcodeScore(e.target.value)}
                      className="w-14 bg-transparent outline-none text-textPrimary"
                    />
                    <button
                      onClick={() => {
                        if (bulkLeetcodeScore === '') return;
                        executeLeetcodeBulkAction(undefined, bulkLeetcodeScore);
                        setBulkLeetcodeScore('');
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

          <DataList emptyText="No student solutions submitted for review.">
            <div className="grid grid-cols-1 gap-5">
              {filteredSubmissions.map((sub) => (
                <div 
                  className="flex flex-col lg:flex-row justify-between gap-6 bg-bgPrimary border border-borderCool rounded-xl p-5 hover:border-primary/30 transition-all relative pl-12" 
                  key={sub._id}
                >
                  <div className="absolute left-4 top-6">
                    <input 
                      type="checkbox" 
                      checked={selectedLeetcodeSubIds.includes(sub._id)} 
                      onChange={() => handleSelectOneLeetcode(sub._id)}
                      className="w-4 h-4 text-primary border-borderCool rounded focus:ring-primary cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <h3 className="font-title text-sm font-semibold text-textPrimary">{sub.problem?.title}</h3>
                    <small className="text-[11px] text-textMuted block">Submitted by {sub.student?.name}</small>
                    
                    <div className="mt-2">
                      <a 
                        href={sub.submissionUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-primary text-primary px-3.5 py-2 rounded-lg transition-colors"
                      >
                        <Link size={13} /> View LeetCode Solution URL
                      </a>
                    </div>
                    
                    {sub.feedback && (
                      <div className="bg-bgSecondary border border-borderCool/60 rounded-lg p-3 text-xs text-textSecondary italic mt-1 leading-relaxed">
                        <strong>Previous Feedback:</strong> "{sub.feedback}"
                      </div>
                    )}
                  </div>

                  <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-3 pt-4 lg:pt-0 lg:pl-5 border-t lg:border-t-0 lg:border-l border-borderCool/60">
                    <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider block">Grading Panel</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Field 
                        placeholder="Score" 
                        type="number" 
                        value={forms.leetcodeReview.score} 
                        onChange={(value) => setForm('leetcodeReview', 'score', Number(value))} 
                      />
                      <div className="flex flex-col gap-1.5 justify-end">
                        <Select
                          value={forms.leetcodeReview.status}
                          onChange={(value) => setForm('leetcodeReview', 'status', value)}
                          options={[['accepted', 'Accepted'], ['submitted', 'Submitted']]}
                        />
                      </div>
                    </div>
                    
                    <Field 
                      placeholder="Feedback remarks..." 
                      value={forms.leetcodeReview.feedback} 
                      onChange={(value) => setForm('leetcodeReview', 'feedback', value)} 
                    />
                    
                    <button
                      className="flex items-center justify-center gap-1.5 w-full text-center text-xs font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm mt-1"
                      onClick={() => {
                        action(() => api.patch(`/api/leetcode/submissions/${sub._id}`, forms.leetcodeReview), 'Leetcode submission graded');
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
      )}

      {tab === 'leaderboard' && (
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
          <div className="pb-5 mb-5 border-b border-borderCool">
            <SectionTitle icon={Trophy} title="Leetcode Coding Leaderboard" />
            <p className="text-xs text-textMuted mt-1">
              Top rank coders based on active stats and streaks.
            </p>
          </div>

          <DataList emptyText="No coding progress recorded.">
            <div className="grid grid-cols-1 gap-2">
              {filteredLeaderboard.map((record, index) => {
                // Gold/Silver/Bronze colors for top 3
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
                    key={record._id}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${rankColor}`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-textPrimary block truncate">
                          {record.student?.name || record.username}
                        </span>
                        <span className="text-[10px] text-textMuted block font-medium truncate mt-0.5">
                          Handle: @{record.username} | Easy: {record.easy || 0} • Med: {record.medium || 0} • Hard: {record.hard || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <strong className="text-sm font-bold text-textPrimary block">{record.totalSolved || 0} solved</strong>
                        <span className="block text-[9px] uppercase font-bold text-warning-text mt-0.5 bg-warning-light border border-warning/10 px-1.5 py-0.5 rounded-full">
                          {record.streak || 0} days streak
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DataList>
        </div>
      )}

      {/* Leetcode form overlay modal */}
      <Modal isOpen={isModalOpen} onClose={cancelEditing} title={editingProblemId ? 'Update Challenge details' : 'Publish Leetcode Challenge'}>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Field placeholder="Problem Title" value={forms.leetcodeProblem.title} onChange={(value) => setForm('leetcodeProblem', 'title', value)} required />
          <Field placeholder="Leetcode Problem URL" value={forms.leetcodeProblem.url} onChange={(value) => setForm('leetcodeProblem', 'url', value)} required />
          
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-textMuted">Assign Batch / Cohort</span>
            <Select
              value={forms.leetcodeProblem.batch}
              onChange={(value) => setForm('leetcodeProblem', 'batch', value)}
              options={[['', 'Assign Batch / Cohort'], ...data.batches.map((batch) => [batch._id, batch.name])]}
              required
            />
          </div>

          <Field label="Due Date" type="date" value={forms.leetcodeProblem.dueDate} onChange={(value) => setForm('leetcodeProblem', 'dueDate', value)} />
          
          <button className="flex items-center justify-center gap-2 w-full text-center text-sm font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm">
            <Save size={16} /> {editingProblemId ? 'Update Assignment' : 'Publish Problem'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
