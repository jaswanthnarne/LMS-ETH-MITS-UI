import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Download, Shield, ShieldAlert, CheckCircle, Users, Award, PlayCircle, Clock, Copy, Trash2 } from 'lucide-react';
import { Row } from '../../components/Shared';

export default function ProctorDashboard({ quizId, goBack, api, action, socket }) {
  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchAttempts = async () => {
    try {
      const qData = await api.get(`/api/quiz/${quizId}`);
      setQuiz(qData);
      const aData = await api.get(`/api/quiz/${quizId}/attempts`);
      setAttempts(aData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
    
    if (!socket) return;
    
    // Join quiz host socket room to listen to live student activities
    socket.emit('join-quiz', quizId);

    const handleProgress = (payload) => {
      if (payload.quiz === quizId) {
        setAttempts(current => current.map(att => {
          if (att.student?._id === payload.studentId) {
            return { ...att, progress: payload.progress };
          }
          return att;
        }));
      }
    };

    const handleViolation = (payload) => {
      if (payload.quiz === quizId) {
        fetchAttempts(); // Reload attempts to get exact database counts
      }
    };

    const handleSubmit = (payload) => {
      if (payload.quiz === quizId) {
        fetchAttempts();
      }
    };

    socket.on('quiz-student-progress', handleProgress);
    socket.on('quiz-student-violation', handleViolation);
    socket.on('quiz-student-status', handleProgress); // Fallback progress
    
    return () => {
      socket.off('quiz-student-progress', handleProgress);
      socket.off('quiz-student-violation', handleViolation);
      socket.off('quiz-student-status', handleProgress);
    };
  }, [quizId, socket]);

  const handleResetAttempt = async (attemptId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete and reset the exam attempt for student "${studentName}"? This allows them to start the exam fresh.`)) return;
    
    await action(async () => {
      await api.delete(`/api/quiz/${quizId}/attempts/${attemptId}`);
      await fetchAttempts();
      if (socket) {
        // Emit reset signal to socket so student player clears local state if running
        socket.emit('quiz-student-reset', { quiz: quizId, attemptId });
      }
    }, 'Student attempt has been reset successfully');
  };

  const handleCopyAccessKey = () => {
    // Generate an access key based on title and batch code
    const baseCode = quiz?.batches?.[0]?.name || quiz?.batch?.name || 'MITS';
    const cleanBase = baseCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanTitle = (quiz?.title || 'EXAM').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const key = `MITS-EXAM-${cleanBase}-${cleanTitle}-${quizId.slice(-4).toUpperCase()}`;
    
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    try {
      const data = await api.get(`/api/quiz/${quizId}/export-results`);
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data.summary), 'Summary');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data.studentResults), 'Student Results');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data.questionAnalysis), 'Question Analysis');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data.detailedAnswers), 'Detailed Answers');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data.violationsLog), 'Violations Log');
      XLSX.writeFile(wb, `${data.quizTitle || 'proctor_exam'}_report.xlsx`);
    } catch (err) {
      alert('Export failed: ' + (err.message || 'Unknown error'));
    }
  };

  // Stats Calculations
  const totalJoined = attempts.length;
  const inProgress = attempts.filter(a => a.status === 'started').length;
  const submitted = attempts.filter(a => a.status === 'completed').length;
  const totalViolations = attempts.reduce((sum, a) => {
    const v = a.violations || {};
    return sum + (v.tabSwitches || 0) + (v.windowBlurs || 0) + (v.fullScreenExits || 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="animate-spin text-primary" size={24} />
        <span className="text-sm font-semibold text-textMuted">Loading live proctoring room...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 border border-borderCool bg-bgPrimary hover:bg-bgHover text-textPrimary rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-title text-lg font-bold text-textPrimary uppercase tracking-wider">{quiz?.title}</h1>
            <p className="text-xs text-textMuted mt-0.5">
              {quiz?.department ? `${quiz.department} • ` : ''} 
              Duration: {Math.floor((quiz?.durationSeconds || 0) / 60)} min • Passing: {quiz?.passingPercentage || 40}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchAttempts} className="flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-4 py-2.5 rounded-lg shadow-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-4 py-2.5 rounded-lg shadow-sm">
            <Download size={14} /> Export Results
          </button>
        </div>
      </div>

      {/* Access Key Indicator */}
      <div className="bg-[#0f172a] text-white border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">STUDENT ACCESS KEY</span>
          <p className="text-lg font-black text-white font-mono mt-1 tracking-wider">
            {quiz?.batches?.[0]?.name ? `MITS-EXAM-${(quiz.batches[0].name).toUpperCase().replace(/[^A-Z0-9]/g, '')}-${(quiz.title || 'EXAM').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)}-${quizId.slice(-4).toUpperCase()}` : `MITS-EXAM-ROOM-${quizId.slice(-4).toUpperCase()}`}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Share this exam link or token signature for students to enter the lobby.</p>
        </div>
        <button onClick={handleCopyAccessKey} className="flex items-center gap-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg shrink-0 border border-slate-700">
          <Copy size={14} /> {copied ? 'Copied!' : 'Copy Key'}
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-4 shadow-sm text-center">
          <Users className="mx-auto text-primary mb-2" size={20} />
          <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Total Joined</span>
          <h2 className="text-2xl font-black text-textPrimary mt-1">{totalJoined}</h2>
        </div>
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-4 shadow-sm text-center">
          <PlayCircle className="mx-auto text-warning mb-2" size={20} />
          <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">In Progress</span>
          <h2 className="text-2xl font-black text-textPrimary mt-1">{inProgress}</h2>
        </div>
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-4 shadow-sm text-center">
          <CheckCircle className="mx-auto text-success mb-2" size={20} />
          <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Submitted</span>
          <h2 className="text-2xl font-black text-textPrimary mt-1">{submitted}</h2>
        </div>
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-4 shadow-sm text-center">
          <ShieldAlert className="mx-auto text-danger mb-2" size={20} />
          <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Violations</span>
          <h2 className="text-2xl font-black text-textPrimary mt-1">{totalViolations}</h2>
        </div>
      </div>

      {/* Live Monitor Table */}
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <h3 className="font-title text-sm font-semibold text-textPrimary mb-4">Live Student Monitor</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-borderCool text-textMuted uppercase font-bold text-[10px]">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Roll / Mobile</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Progress / Score</th>
                <th className="py-3 px-4">Violations</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-textMuted italic">No students joined the live exam yet.</td>
                </tr>
              ) : (
                attempts.map((att, i) => {
                  const tv = (att.violations?.tabSwitches || 0) + (att.violations?.windowBlurs || 0) + (att.violations?.fullScreenExits || 0);
                  const pct = att.percentage || (att.totalMarks > 0 ? ((att.score / att.totalMarks) * 100).toFixed(1) : 0);
                  const isPassed = att.passed || pct >= (quiz?.passingPercentage || 40);
                  
                  return (
                    <tr key={att._id} className="border-b border-borderCool/60 hover:bg-bgPrimary transition-colors">
                      <td className="py-3 px-4 text-textMuted font-semibold">{i + 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-textPrimary">{att.student?.name}</span>
                        <div className="text-[10px] text-textMuted mt-0.5 font-medium">{att.student?.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-textPrimary">{att.student?.rollNumber || 'N/A'}</span>
                        <div className="text-[10px] text-textMuted mt-0.5 font-medium">{att.student?.phone || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4">
                        {att.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 bg-success/10 text-success px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px]">Completed</span>
                        ) : att.status === 'violated' ? (
                          <span className="inline-flex items-center gap-1 bg-danger/10 text-danger px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px]">Violated</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-warning/10 text-warning px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] animate-pulse">In Progress</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-textPrimary">
                        {att.status === 'completed' ? (
                          <div className="flex flex-col">
                            <span className={isPassed ? 'text-success' : 'text-danger'}>{pct}%</span>
                            <span className="text-[10px] text-textMuted font-normal">{att.score}/{att.totalMarks} pts</span>
                          </div>
                        ) : (
                          <span>{att.progress || 0}% answered</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {tv > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-danger font-bold">{tv} warnings</span>
                            <span className="text-[9px] text-textMuted font-medium">
                              T:{att.violations?.tabSwitches || 0} • W:{att.violations?.windowBlurs || 0} • F:{att.violations?.fullScreenExits || 0}
                            </span>
                          </div>
                        ) : (
                          <span className="text-success font-semibold">✓ Clean</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => handleResetAttempt(att._id, att.student?.name)} className="inline-flex items-center justify-center p-2 rounded-lg text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all" title="Reset/Delete Attempt">
                          <Trash2 size={14} />
                        </button>
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
  );
}
