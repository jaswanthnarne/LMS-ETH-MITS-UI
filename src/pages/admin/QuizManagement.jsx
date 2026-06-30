import React, { useState } from 'react';
import { PlayCircle, Plus, Trash2, Shield, Eye, BarChart3, Edit2, X, Save, Clock, HelpCircle, Award, Download, Upload, ChevronRight, ChevronLeft, Pause, StopCircle, RotateCcw, CheckCircle, FileSpreadsheet, Settings, Camera, Mic, Monitor, FileText, Lock, Unlock } from 'lucide-react';
import { Field, Select, DataList, Row, SectionTitle, Modal } from '../../components/Shared';

const WIZARD_STEPS = ['Basic Details', 'Questions', 'Proctoring & Settings', 'Review & Save'];

const QUESTION_TYPES = [
  ['single_correct', 'MCQ / Single Correct'],
  ['true_false', 'True / False'],
  ['fill_blank', 'Fill in the Blank'],
  ['numeric', 'Numeric / Value']
];

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     bg: 'bg-textMuted/10', text: 'text-textMuted' },
  published: { label: 'Published', bg: 'bg-primary/10',   text: 'text-primary' },
  live:      { label: 'Live',      bg: 'bg-success/10',   text: 'text-success' },
  paused:    { label: 'Paused',    bg: 'bg-warning/10',   text: 'text-warning' },
  ended:     { label: 'Ended',     bg: 'bg-danger/10',    text: 'text-danger' }
};

export default function QuizManagement({ data, forms, setForm, api, action, setState, socket, startProctoring }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [batchFilter, setBatchFilter] = useState('');
  const [wizardStep, setWizardStep] = useState(0);
  const [exporting, setExporting] = useState(null);

  React.useEffect(() => {
    if (!socket) return;
    const handleQuizStudentStatus = (payload) => {
      if (payload.quiz) {
        api.get(`/api/quiz/${payload.quiz}/attempts`).then((attempts) => {
          setState((current) => ({
            ...current,
            quizAttempts: { ...current.quizAttempts, [payload.quiz]: attempts }
          }));
        });
      }
    };
    data.quizzes.forEach((quiz) => {
      if (quiz.status === 'live' || quiz.isLive) {
        socket.emit('join-quiz', quiz._id);
      }
    });
    socket.on('quiz-student-status', handleQuizStudentStatus);
    return () => { socket.off('quiz-student-status', handleQuizStudentStatus); };
  }, [socket, data.quizzes]);

  const filteredQuizzes = data.quizzes.filter((quiz) => {
    if (!batchFilter) return true;
    const quizBatchId = quiz.batch?._id || quiz.batch;
    const quizBatches = quiz.batches || [];
    return String(quizBatchId) === String(batchFilter) || quizBatches.some(b => String(b?._id || b) === String(batchFilter));
  });

  // ─── Template Download ───
  function downloadExcelTemplate() {
    import('xlsx').then((XLSX) => {
      const headers = [
        ['Question Text', 'Question Type', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Points'],
        ['What is the capital of India?', 'single_correct', 'New Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'New Delhi', '5'],
        ['React is a backend framework.', 'true_false', '', '', '', '', 'False', '5'],
        ['Write the capital of France.', 'fill_blank', '', '', '', '', 'Paris', '5'],
        ['What is 5 + 10?', 'numeric', '', '', '', '', '15', '5']
      ];
      const ws = XLSX.utils.aoa_to_sheet(headers);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Questions Template');
      XLSX.writeFile(wb, 'exam_questions_template.xlsx');
    });
  }

  // ─── Excel Import ───
  function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    import('xlsx').then((XLSX) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
          const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
          const parsed = [];
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[0]) continue;
            const text = String(row[0]).trim();
            const rawType = String(row[1] || '').trim().toLowerCase();
            const optA = String(row[2] || '').trim();
            const optB = String(row[3] || '').trim();
            const optC = String(row[4] || '').trim();
            const optD = String(row[5] || '').trim();
            const correctAnswer = String(row[6] || '').trim();
            const points = Number(row[7]) || 1;
            if (!text) continue;
            let type = 'single_correct';
            if (['true_false', 'true/false', 'tf'].includes(rawType)) type = 'true_false';
            else if (['fill_blank', 'fill', 'fib'].includes(rawType)) type = 'fill_blank';
            else if (['numeric', 'number'].includes(rawType)) type = 'numeric';

            let options = [], correctIndex = 0, correctAnswerText = '';
            if (type === 'single_correct') {
              options = [optA, optB, optC, optD].filter(Boolean);
              if (options.length < 2) continue;
              const normAns = correctAnswer.toUpperCase();
              if (normAns === 'A' || normAns === 'OPTION A') correctIndex = 0;
              else if (normAns === 'B' || normAns === 'OPTION B') correctIndex = 1;
              else if (normAns === 'C' || normAns === 'OPTION C') correctIndex = 2;
              else if (normAns === 'D' || normAns === 'OPTION D') correctIndex = 3;
              else {
                const mi = options.findIndex(o => o.toLowerCase() === correctAnswer.toLowerCase());
                correctIndex = mi !== -1 ? mi : 0;
              }
            } else if (type === 'true_false') {
              options = ['True', 'False'];
              const normTF = correctAnswer.toLowerCase();
              correctIndex = ['true', 't', 'yes', 'y', 'a'].includes(normTF) ? 0 : 1;
            } else {
              correctAnswerText = correctAnswer;
            }
            parsed.push({ text, type, options, correctIndex, correctAnswerText, points });
          }
          if (parsed.length === 0) { alert('No valid questions parsed.'); return; }
          setForm('quiz', 'questions', parsed);
          alert(`✓ Imported ${parsed.length} questions from Excel!`);
        } catch (err) { alert('Failed to parse: ' + err.message); }
      };
      reader.readAsArrayBuffer(file);
    });
    event.target.value = '';
  }

  // ─── Export Results ───
  async function exportResults(quizId) {
    setExporting(quizId);
    try {
      const data = await api.get(`/api/quiz/${quizId}/export-results`);
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data.summary), 'Summary');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data.studentResults), 'Student Results');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data.questionAnalysis), 'Question Analysis');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data.detailedAnswers), 'Detailed Answers');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data.violationsLog), 'Violations Log');
      XLSX.writeFile(wb, `${data.quizTitle || 'exam'}_results.xlsx`);
    } catch (err) { alert('Export failed: ' + (err.message || 'Unknown error')); }
    setExporting(null);
  }

  // ─── Wizard Form State ───
  function resetForm() {
    const fields = {
      title: '', department: '', instructions: '', batch: '', batches: [],
      durationSeconds: 1800, passingPercentage: 40,
      questions: [{ text: '', type: 'single_correct', options: ['', '', '', ''], correctIndex: 0, correctAnswerText: '', points: 1 }],
      requireWebcam: false, requireMic: false, requireScreenshare: false, shuffleQuestions: false,
      showAnswersToStudents: false, enableCertificate: false, allowPaperDownload: false
    };
    Object.entries(fields).forEach(([k, v]) => setForm('quiz', k, v));
  }

  function startCreateQuiz() {
    resetForm();
    setEditingQuizId(null);
    setWizardStep(0);
    setIsModalOpen(true);
  }

  function startEditingQuiz(quiz) {
    const fields = {
      title: quiz.title || '', department: quiz.department || '', instructions: quiz.instructions || '',
      batch: quiz.batch?._id || quiz.batch || '', 
      batches: (quiz.batches || []).map(b => b._id || b),
      durationSeconds: quiz.durationSeconds || 1800, passingPercentage: quiz.passingPercentage || 40,
      questions: quiz.questions?.length ? quiz.questions : [{ text: '', type: 'single_correct', options: ['', '', '', ''], correctIndex: 0, correctAnswerText: '', points: 1 }],
      requireWebcam: quiz.requireWebcam || false, requireMic: quiz.requireMic || false,
      requireScreenshare: quiz.requireScreenshare || false, shuffleQuestions: quiz.shuffleQuestions || false,
      showAnswersToStudents: quiz.showAnswersToStudents || false, enableCertificate: quiz.enableCertificate || false,
      allowPaperDownload: quiz.allowPaperDownload || false
    };
    Object.entries(fields).forEach(([k, v]) => setForm('quiz', k, v));
    setEditingQuizId(quiz._id);
    setWizardStep(0);
    setIsModalOpen(true);
  }

  async function handleSaveDraft(e) {
    e?.preventDefault();
    const payload = { ...forms.quiz, status: 'draft' };
    if (editingQuizId) {
      await action(() => api.patch(`/api/quiz/${editingQuizId}`, payload), 'Exam saved as draft');
    } else {
      await action(() => api.post('/api/quiz', payload), 'Exam created as draft');
    }
    setIsModalOpen(false);
  }

  async function handleDeleteQuiz(quizId, quizTitle) {
    if (!window.confirm(`Permanently delete "${quizTitle}" and all student attempts?`)) return;
    await action(() => api.delete(`/api/quiz/${quizId}`), 'Exam deleted');
  }

  // ─── Proctoring Controls ───
  async function publishQuiz(quizId) {
    await action(async () => {
      const updated = await api.patch(`/api/quiz/${quizId}/publish`);
      if (socket) socket.emit('quiz-host-update', { batch: updated.batch?._id || updated.batch, title: updated.title, status: 'published' });
    }, 'Exam published — ready to start');
  }

  async function startExam(quizId) {
    await action(async () => {
      const updated = await api.patch(`/api/quiz/${quizId}/start`);
      if (socket) socket.emit('quiz-host-update', { batch: updated.batch?._id || updated.batch, title: updated.title, isLive: true, status: 'live' });
    }, 'Exam is now LIVE');
  }

  async function pauseExam(quizId) {
    await action(async () => {
      const updated = await api.patch(`/api/quiz/${quizId}/pause`);
      if (socket) socket.emit('quiz-host-update', { batch: updated.batch?._id || updated.batch, title: updated.title, isLive: false, status: 'paused' });
    }, 'Exam paused');
  }

  async function endExam(quizId) {
    if (!window.confirm('End this exam? All in-progress attempts will be auto-submitted.')) return;
    await action(async () => {
      const updated = await api.patch(`/api/quiz/${quizId}/end`);
      if (socket) socket.emit('quiz-host-update', { batch: updated.batch?._id || updated.batch, title: updated.title, isLive: false, status: 'ended' });
    }, 'Exam ended — all attempts finalized');
  }

  async function reopenExam(quizId) {
    await action(async () => {
      const updated = await api.patch(`/api/quiz/${quizId}/reopen`);
      if (socket) socket.emit('quiz-host-update', { batch: updated.batch?._id || updated.batch, title: updated.title, isLive: true, status: 'live' });
    }, 'Exam reopened');
  }

  async function toggleSetting(quizId, key, currentValue) {
    await action(() => api.patch(`/api/quiz/${quizId}/settings`, { [key]: !currentValue }), `${key} toggled`);
  }

  // ─── Question Helpers ───
  function updateQuestion(index, key, value) {
    const questions = forms.quiz.questions.map((q, i) => i === index ? { ...q, [key]: value } : q);
    setForm('quiz', 'questions', questions);
  }

  function addQuestion() {
    setForm('quiz', 'questions', [
      ...forms.quiz.questions,
      { text: '', type: 'single_correct', options: ['', '', '', ''], correctIndex: 0, correctAnswerText: '', points: 1 }
    ]);
  }

  function removeQuestion(index) {
    if (forms.quiz.questions.length === 1) return;
    setForm('quiz', 'questions', forms.quiz.questions.filter((_, i) => i !== index));
  }

  // ─── Computed ───
  const totalMarks = (forms.quiz.questions || []).reduce((sum, q) => sum + (q.points || 1), 0);
  const getQuizStatus = (quiz) => quiz.status || (quiz.isLive ? 'live' : 'draft');

  // ─────── RENDER ───────
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-borderCool">
          <div>
            <SectionTitle icon={Shield} title="Exam Proctoring Control Room" />
            <p className="text-xs text-textMuted mt-1">Create, proctor, and manage live examinations with full security controls.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data.batches?.length > 0 && (
              <Select value={batchFilter} onChange={setBatchFilter}
                options={[['', 'All Batches'], ...data.batches.map(b => [b._id, b.name])]}
                className="w-full sm:w-[200px]" />
            )}
            <button className="flex items-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-lg shadow-sm" onClick={startCreateQuiz}>
              <Plus size={15} /> Create Exam
            </button>
          </div>
        </div>

        <DataList emptyText="No exams configured. Click 'Create Exam' to begin.">
          <div className="grid grid-cols-1 gap-4">
            {filteredQuizzes.map((quiz) => {
              const status = getQuizStatus(quiz);
              const sc = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
              const attempts = data.quizAttempts[quiz._id] || [];
              const passCount = attempts.filter(a => a.passed || (a.percentage >= (quiz.passingPercentage || 40))).length;

              return (
                <div className="bg-bgPrimary border border-borderCool hover:border-primary/20 rounded-xl p-5 shadow-sm flex flex-col gap-4 transition-colors" key={quiz._id}>
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-title text-sm font-semibold text-textPrimary truncate">{quiz.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-textMuted mt-1">
                        <span className="font-medium bg-bgSecondary border border-borderCool/60 px-2 py-0.5 rounded text-[10px]">
                          {quiz.batches?.length > 0 ? quiz.batches.map(b => b.name).join(', ') : quiz.batch?.name || 'All'}
                        </span>
                        {quiz.department && (
                          <span className="font-bold bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] uppercase">
                            {quiz.department}
                          </span>
                        )}
                        <span className="flex items-center gap-1"><HelpCircle size={13} /> {quiz.questions?.length || 0} Qs</span>
                        <span className="flex items-center gap-1"><Clock size={13} /> {Math.floor((quiz.durationSeconds || 0) / 60)}m</span>
                        <span className="flex items-center gap-1">Total: {quiz.totalMarks || 0} marks</span>
                        <span className="flex items-center gap-1">Pass: {quiz.passingPercentage || 40}%</span>
                        {(quiz.requireWebcam || quiz.requireMic || quiz.requireScreenshare) && (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 font-bold border border-rose-100 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
                            <Shield size={10} /> Proctored
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`self-start inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${sc.bg} ${sc.text}`}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Proctoring Control Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-borderCool/60">
                    {status === 'draft' && (
                      <button className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary/95 px-3.5 py-2 rounded-lg shadow-sm" onClick={() => publishQuiz(quiz._id)}>
                        <FileText size={13} /> Publish
                      </button>
                    )}
                    {status === 'published' && (
                      <button className="flex items-center gap-1.5 text-xs font-semibold bg-success text-white hover:bg-success/90 px-3.5 py-2 rounded-lg shadow-sm animate-pulse" onClick={() => startExam(quiz._id)}>
                        <PlayCircle size={13} /> Start Exam
                      </button>
                    )}
                    {status === 'live' && (
                      <>
                        <button className="flex items-center gap-1.5 text-xs font-semibold bg-warning text-white hover:bg-warning/90 px-3.5 py-2 rounded-lg" onClick={() => pauseExam(quiz._id)}>
                          <Pause size={13} /> Pause
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-semibold bg-danger text-white hover:bg-danger/90 px-3.5 py-2 rounded-lg" onClick={() => endExam(quiz._id)}>
                          <StopCircle size={13} /> End Exam
                        </button>
                      </>
                    )}
                    {status === 'paused' && (
                      <>
                        <button className="flex items-center gap-1.5 text-xs font-semibold bg-success text-white hover:bg-success/90 px-3.5 py-2 rounded-lg" onClick={() => startExam(quiz._id)}>
                          <PlayCircle size={13} /> Resume
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-semibold bg-danger text-white hover:bg-danger/90 px-3.5 py-2 rounded-lg" onClick={() => endExam(quiz._id)}>
                          <StopCircle size={13} /> End Exam
                        </button>
                      </>
                    )}
                    {status === 'ended' && (
                      <button className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary/95 px-3.5 py-2 rounded-lg" onClick={() => reopenExam(quiz._id)}>
                        <RotateCcw size={13} /> Reopen
                      </button>
                    )}
                    {status !== 'draft' && (
                      <button className="flex items-center gap-1.5 text-xs font-semibold bg-[#0f172a] text-white hover:bg-slate-900 px-3.5 py-2 rounded-lg shadow-sm"
                        onClick={() => startProctoring(quiz._id)}>
                        <Shield size={13} /> Proctor Room
                      </button>
                    )}
                    <button className="flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-3.5 py-2 rounded-lg"
                      onClick={async () => {
                        const a = await api.get(`/api/quiz/${quiz._id}/attempts`);
                        setState(c => ({ ...c, quizAttempts: { ...c.quizAttempts, [quiz._id]: a } }));
                      }}>
                      <BarChart3 size={13} /> Scores
                    </button>

                    <button className="flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-3.5 py-2 rounded-lg"
                      onClick={() => exportResults(quiz._id)} disabled={exporting === quiz._id}>
                      <Download size={13} /> {exporting === quiz._id ? 'Exporting...' : 'Export'}
                    </button>

                    {(status === 'draft' || status === 'published') && (
                      <button className="flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-3.5 py-2 rounded-lg"
                        onClick={() => startEditingQuiz(quiz)}>
                        <Edit2 size={13} /> Edit
                      </button>
                    )}

                    <button className="flex items-center gap-1.5 text-xs font-semibold bg-danger-light text-danger hover:bg-danger/10 px-3.5 py-2 rounded-lg ml-auto"
                      onClick={() => handleDeleteQuiz(quiz._id, quiz.title)}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>

                  {/* Post-exam settings toggles (visible when published/ended) */}
                  {['published', 'live', 'paused', 'ended'].includes(status) && (
                    <div className="flex flex-wrap items-center gap-3 text-[10px]">
                      <button onClick={() => toggleSetting(quiz._id, 'showAnswersToStudents', quiz.showAnswersToStudents)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md font-bold uppercase tracking-wider border transition-colors ${quiz.showAnswersToStudents ? 'bg-success/10 text-success border-success/20' : 'bg-bgSecondary text-textMuted border-borderCool'}`}>
                        {quiz.showAnswersToStudents ? <Unlock size={10} /> : <Lock size={10} />} Answers {quiz.showAnswersToStudents ? 'Visible' : 'Hidden'}
                      </button>
                      <button onClick={() => toggleSetting(quiz._id, 'enableCertificate', quiz.enableCertificate)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md font-bold uppercase tracking-wider border transition-colors ${quiz.enableCertificate ? 'bg-success/10 text-success border-success/20' : 'bg-bgSecondary text-textMuted border-borderCool'}`}>
                        <Award size={10} /> Certificate {quiz.enableCertificate ? 'ON' : 'OFF'}
                      </button>
                      <button onClick={() => toggleSetting(quiz._id, 'allowPaperDownload', quiz.allowPaperDownload)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md font-bold uppercase tracking-wider border transition-colors ${quiz.allowPaperDownload ? 'bg-success/10 text-success border-success/20' : 'bg-bgSecondary text-textMuted border-borderCool'}`}>
                        <FileText size={10} /> Paper {quiz.allowPaperDownload ? 'Downloadable' : 'Locked'}
                      </button>
                    </div>
                  )}

                  {/* Scoreboard */}
                  {attempts.length > 0 && (
                    <div className="bg-bgSecondary border border-borderCool/60 rounded-xl p-4 mt-2">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-title text-xs font-bold text-textPrimary flex items-center gap-1.5">
                          <Award size={14} className="text-warning" /> Student Scoreboard
                        </h4>
                        <span className="text-[10px] text-textMuted font-semibold">
                          {passCount}/{attempts.length} Passed • Avg: {attempts.length > 0 ? (attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempts.length).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {attempts.map((attempt) => {
                          const totalV = (attempt.violations?.tabSwitches || 0) + (attempt.violations?.windowBlurs || 0) + (attempt.violations?.fullScreenExits || 0);
                          const pct = attempt.percentage || (attempt.totalMarks > 0 ? ((attempt.score / attempt.totalMarks) * 100).toFixed(1) : 0);
                          const isPassed = attempt.passed || pct >= (quiz.passingPercentage || 40);
                          return (
                            <Row key={attempt._id} title={attempt.student?.name} meta={`${pct}% • ${attempt.score}/${attempt.totalMarks || quiz.totalMarks || '?'} pts`}>
                              <div className="flex items-center gap-2 text-[10px]">
                                <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${isPassed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                  {isPassed ? 'PASS' : 'FAIL'}
                                </span>
                                {totalV > 0 && (
                                  <span className="px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-warning/10 text-warning">
                                    {totalV} Warns
                                  </span>
                                )}
                                <span className="text-textMuted font-medium">
                                  {new Date(attempt.submittedAt || attempt.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </Row>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DataList>
      </div>

      {/* ─── Multi-Step Wizard Modal ─── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingQuizId ? 'Edit Exam' : 'Create Exam'}>
        <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Step Indicator */}
          <div className="flex items-center gap-1 pb-3 border-b border-borderCool">
            {WIZARD_STEPS.map((step, i) => (
              <React.Fragment key={i}>
                <button onClick={() => setWizardStep(i)}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md transition-all ${i === wizardStep ? 'bg-primary text-white' : i < wizardStep ? 'bg-success/10 text-success' : 'bg-bgSecondary text-textMuted'}`}>
                  {i < wizardStep ? '✓' : i + 1}. {step}
                </button>
                {i < WIZARD_STEPS.length - 1 && <ChevronRight size={12} className="text-textMuted" />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Basic Details */}
          {wizardStep === 0 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Exam Title" placeholder="e.g. Java FSD Mid-Sem" value={forms.quiz.title} onChange={v => setForm('quiz', 'title', v)} required />
                <Field label="Department" placeholder="e.g. CSE, ECE" value={forms.quiz.department} onChange={v => setForm('quiz', 'department', v)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Duration (minutes)" type="number" value={Math.floor(forms.quiz.durationSeconds / 60)} onChange={v => setForm('quiz', 'durationSeconds', Number(v) * 60)} />
                <Field label="Passing %" type="number" min="0" max="100" value={forms.quiz.passingPercentage} onChange={v => setForm('quiz', 'passingPercentage', Number(v))} />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-textMuted">Total Marks</span>
                  <div className="px-4 py-2.5 bg-bgSecondary border border-borderCool rounded-lg text-sm font-bold text-textPrimary">{totalMarks}</div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-textMuted">Target Batches</span>
                <div className="grid grid-cols-2 gap-2 border border-borderCool p-3 rounded-lg max-h-[120px] overflow-y-auto bg-bgPrimary">
                  {data.batches.map((batch) => {
                    const isChecked = (forms.quiz.batches || []).includes(batch._id);
                    return (
                      <label key={batch._id} className="flex items-center gap-2 text-xs text-textPrimary cursor-pointer hover:text-primary transition-colors">
                        <input type="checkbox" checked={isChecked}
                          onChange={(e) => {
                            const current = forms.quiz.batches || [];
                            const next = e.target.checked ? [...current, batch._id] : current.filter(id => id !== batch._id);
                            setForm('quiz', 'batches', next);
                            setForm('quiz', 'batch', next[0] || '');
                          }}
                          className="rounded border-borderCool text-primary focus:ring-primary" />
                        {batch.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <Field label="Instructions (optional)" placeholder="Instructions shown to students before exam..." value={forms.quiz.instructions || ''} onChange={v => setForm('quiz', 'instructions', v)} />
            </div>
          )}

          {/* Step 2: Questions */}
          {wizardStep === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-borderCool">
                <span className="text-xs font-bold text-textPrimary">{forms.quiz.questions.length} Questions • {totalMarks} Total Marks</span>
                <div className="ml-auto flex items-center gap-2">
                  <button className="flex items-center gap-1 text-[10px] font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-3 py-1.5 rounded-md"
                    onClick={downloadExcelTemplate} type="button">
                    <Download size={12} /> Template
                  </button>
                  <label className="flex items-center gap-1 text-[10px] font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-3 py-1.5 rounded-md cursor-pointer">
                    <Upload size={12} /> Import
                    <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelImport} />
                  </label>
                </div>
              </div>

              {forms.quiz.questions.map((question, qi) => (
                <div className="flex flex-col gap-3 border border-borderCool bg-bgPrimary p-4 rounded-lg" key={qi}>
                  <div className="flex justify-between items-center pb-2 border-b border-borderCool/60">
                    <strong className="text-xs font-bold text-textPrimary">Q{qi + 1} • {question.points || 1} pts</strong>
                    {forms.quiz.questions.length > 1 && (
                      <button type="button" className="text-[11px] font-semibold text-danger hover:underline" onClick={() => removeQuestion(qi)}>Remove</button>
                    )}
                  </div>
                  <Field placeholder="Question text..." value={question.text} onChange={v => updateQuestion(qi, 'text', v)} required />
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <span className="text-xs font-medium text-textMuted">Type</span>
                      <Select value={question.type || 'single_correct'} onChange={v => {
                        updateQuestion(qi, 'type', v);
                        if (v === 'true_false') updateQuestion(qi, 'options', ['True', 'False']);
                        else if (v === 'fill_blank' || v === 'numeric') updateQuestion(qi, 'options', []);
                        else if (!question.options?.length || question.options.length < 2) updateQuestion(qi, 'options', ['', '', '', '']);
                      }} options={QUESTION_TYPES} />
                    </div>
                    <Field label="Points" type="number" min="1" value={question.points} onChange={v => updateQuestion(qi, 'points', Number(v))} />
                  </div>

                  {(question.type === 'single_correct' || !question.type) && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(question.options || ['', '', '', '']).map((opt, oi) => (
                          <Field key={oi} placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt}
                            onChange={v => {
                              const opts = [...(question.options || ['', '', '', ''])];
                              opts[oi] = v;
                              updateQuestion(qi, 'options', opts);
                            }} required />
                        ))}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-textMuted">Correct Option</span>
                        <Select value={question.correctIndex} onChange={v => updateQuestion(qi, 'correctIndex', Number(v))}
                          options={[[0, 'Option A'], [1, 'Option B'], [2, 'Option C'], [3, 'Option D']]} />
                      </div>
                    </>
                  )}
                  {question.type === 'true_false' && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-textMuted">Correct Answer</span>
                      <Select value={question.correctIndex} onChange={v => updateQuestion(qi, 'correctIndex', Number(v))}
                        options={[[0, 'True'], [1, 'False']]} />
                    </div>
                  )}
                  {(question.type === 'fill_blank' || question.type === 'numeric') && (
                    <Field label="Expected Answer" placeholder="Type the correct answer..." value={question.correctAnswerText || ''}
                      onChange={v => updateQuestion(qi, 'correctAnswerText', v)} required />
                  )}
                </div>
              ))}
              <button type="button" className="w-full text-center text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-textMuted text-textPrimary py-2 rounded-lg hover:bg-bgHover"
                onClick={addQuestion}>+ Add Question</button>
            </div>
          )}

          {/* Step 3: Proctoring & Settings */}
          {wizardStep === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 p-4 bg-bgSecondary border border-borderCool rounded-lg">
                <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={14} className="text-primary" /> Proctoring Configuration
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['requireWebcam', 'Require Webcam', Camera],
                    ['requireMic', 'Require Microphone', Mic],
                    ['requireScreenshare', 'Require Screenshare', Monitor],
                    ['shuffleQuestions', 'Shuffle Questions', HelpCircle]
                  ].map(([key, label, Icon]) => (
                    <label key={key} className="flex items-center gap-2 text-xs font-semibold text-textPrimary cursor-pointer">
                      <input type="checkbox" checked={forms.quiz[key] || false} onChange={e => setForm('quiz', key, e.target.checked)}
                        className="rounded border-borderCool text-primary focus:ring-primary" />
                      <Icon size={14} className="text-textMuted" /> {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 p-4 bg-bgSecondary border border-borderCool rounded-lg">
                <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                  <Settings size={14} className="text-primary" /> Post-Exam Settings
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    ['showAnswersToStudents', 'Show correct answers to students after exam'],
                    ['enableCertificate', 'Generate certificate for passing students'],
                    ['allowPaperDownload', 'Allow students to download the question paper after exam']
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-xs font-semibold text-textPrimary cursor-pointer">
                      <input type="checkbox" checked={forms.quiz[key] || false} onChange={e => setForm('quiz', key, e.target.checked)}
                        className="rounded border-borderCool text-primary focus:ring-primary" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Save */}
          {wizardStep === 3 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-bgSecondary border border-borderCool rounded-lg p-3">
                  <span className="text-textMuted font-medium">Title</span>
                  <p className="font-bold text-textPrimary mt-0.5">{forms.quiz.title || '—'}</p>
                </div>
                <div className="bg-bgSecondary border border-borderCool rounded-lg p-3">
                  <span className="text-textMuted font-medium">Department</span>
                  <p className="font-bold text-textPrimary mt-0.5">{forms.quiz.department || '—'}</p>
                </div>
                <div className="bg-bgSecondary border border-borderCool rounded-lg p-3">
                  <span className="text-textMuted font-medium">Duration</span>
                  <p className="font-bold text-textPrimary mt-0.5">{Math.floor(forms.quiz.durationSeconds / 60)} minutes</p>
                </div>
                <div className="bg-bgSecondary border border-borderCool rounded-lg p-3">
                  <span className="text-textMuted font-medium">Passing %</span>
                  <p className="font-bold text-textPrimary mt-0.5">{forms.quiz.passingPercentage}%</p>
                </div>
                <div className="bg-bgSecondary border border-borderCool rounded-lg p-3">
                  <span className="text-textMuted font-medium">Questions</span>
                  <p className="font-bold text-textPrimary mt-0.5">{forms.quiz.questions.length} questions • {totalMarks} marks</p>
                </div>
                <div className="bg-bgSecondary border border-borderCool rounded-lg p-3">
                  <span className="text-textMuted font-medium">Proctoring</span>
                  <p className="font-bold text-textPrimary mt-0.5">
                    {[forms.quiz.requireWebcam && 'Webcam', forms.quiz.requireMic && 'Mic', forms.quiz.requireScreenshare && 'Screen'].filter(Boolean).join(', ') || 'None'}
                  </p>
                </div>
              </div>
              <div className="bg-bgSecondary border border-borderCool rounded-lg p-3 text-xs">
                <span className="text-textMuted font-medium">Target Batches</span>
                <p className="font-bold text-textPrimary mt-0.5">
                  {(forms.quiz.batches || []).map(bId => data.batches.find(b => b._id === bId)?.name || bId).join(', ') || 'None selected'}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Footer */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-borderCool">
            {wizardStep > 0 && (
              <button type="button" onClick={() => setWizardStep(s => s - 1)}
                className="flex items-center gap-1 text-xs font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-4 py-2.5 rounded-lg">
                <ChevronLeft size={14} /> Back
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <button type="button" onClick={() => setWizardStep(s => s + 1)}
                  className="flex items-center gap-1 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-lg shadow-sm">
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <button type="button" onClick={handleSaveDraft}
                  className="flex items-center gap-2 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-lg shadow-sm">
                  <Save size={14} /> {editingQuizId ? 'Save Changes' : 'Save as Draft'}
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
