import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, Clock, CheckSquare, AlertCircle, AlertTriangle, Shield, Camera, Mic, Monitor } from 'lucide-react';
import { Badge, DataList, SectionTitle, Select } from '../../components/Shared';
import useCheatDetection from '../../hooks/useCheatDetection';

export default function LiveQuizPlayer({ data, forms, setForm, api, action, socket, user, forceActiveQuizId }) {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [webcamStream, setWebcamStream] = useState(null);
  const [screenshareStream, setScreenshareStream] = useState(null);
  const [warning, setWarning] = useState(null);
  const [isFullscreenBlock, setIsFullscreenBlock] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const questionTimesRef = useRef({});
  const activeAttemptRef = useRef(null);

  // Resume active session from localStorage if present
  useEffect(() => {
    const savedSession = localStorage.getItem('mits_quiz_session_id');
    if (savedSession) {
      resumeSession(savedSession);
    }
  }, []);

  // Handle auto-launching from forceActiveQuizId prop (when opened in new tab)
  useEffect(() => {
    if (forceActiveQuizId && data.quizzes && !attempt && !activeQuiz && !isSubmitted) {
      const quiz = data.quizzes.find(q => q._id === forceActiveQuizId);
      if (quiz) {
        const savedSession = localStorage.getItem('mits_quiz_session_id');
        if (!savedSession) {
          launchAttempt(quiz);
        }
      }
    }
  }, [forceActiveQuizId, data.quizzes, attempt, activeQuiz, isSubmitted]);

  async function resumeSession(sessionId) {
    try {
      const res = await api.post(`/api/quiz/resume/${sessionId}`);
      if (res && res.quiz) {
        setAttempt(res);
        const quizObj = data.quizzes.find(q => q._id === res.quiz._id || q._id === res.quiz);
        if (quizObj) {
          setActiveQuiz(quizObj);
          activeAttemptRef.current = res;
          // Calculate remaining time
          const elapsed = Math.floor((Date.now() - new Date(res.startedAt || res.createdAt).getTime()) / 1000);
          const remaining = Math.max(0, quizObj.durationSeconds - elapsed);
          setTimeLeft(remaining);
          
          // Re-populate answers into forms
          res.answers.forEach(ans => {
            const val = ans.submittedAnswer || String(ans.selectedIndex);
            setForm('answer', `${quizObj._id}-${ans.questionIndex}`, val);
          });
          
          // Request permissions and go fullscreen if required
          startProctoringDevices(quizObj);
        }
      } else {
        localStorage.removeItem('mits_quiz_session_id');
      }
    } catch (err) {
      localStorage.removeItem('mits_quiz_session_id');
    }
  }

  // Handle Proctoring Permission Prompts & Fullscreen
  async function startProctoringDevices(quiz) {
    try {
      if (quiz.requireWebcam) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: quiz.requireMic });
        setWebcamStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      }
      if (quiz.requireScreenshare) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenshareStream(screenStream);
      }
      
      // Request fullscreen
      enterFullscreen();
    } catch (error) {
      alert('Proctoring permissions (Webcam/Mic/Screenshare) are required to take this quiz.');
      cancelAttempt();
    }
  }

  function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) { /* Safari */
      elem.webkitRequestFullscreen().catch(() => {});
    } else if (elem.msRequestFullscreen) { /* IE11 */
      elem.msRequestFullscreen().catch(() => {});
    }
    setIsFullscreenBlock(false);
  }

  // Fullscreen tracking
  useEffect(() => {
    if (!activeQuiz) return;
    const checkFullscreen = () => {
      if (!document.fullscreenElement) {
        setIsFullscreenBlock(true);
      } else {
        setIsFullscreenBlock(false);
      }
    };
    document.addEventListener('fullscreenchange', checkFullscreen);
    return () => document.removeEventListener('fullscreenchange', checkFullscreen);
  }, [activeQuiz]);

  // Hook up cheat detection
  const handleViolationTriggered = async (type, count) => {
    if (!attempt || !activeQuiz) return;
    
    // Update socket alert
    if (socket) {
      socket.emit('quiz-student-violation', {
        quiz: activeQuiz._id,
        studentId: user?._id,
        studentName: user?.name,
        violationType: type,
        count
      });
    }

    setWarning({ type, count });
    setTimeout(() => setWarning(null), 3000);

    // Update database violations
    const violationsData = {
      tabSwitches: type === 'tabSwitch' ? count : (attempt.violations?.tabSwitches || 0),
      fullScreenExits: type === 'fullScreen' ? count : (attempt.violations?.fullScreenExits || 0),
      copyAttempts: type === 'copyPaste' ? count : (attempt.violations?.copyAttempts || 0),
      devToolsAttempts: type === 'devTools' ? count : (attempt.violations?.devToolsAttempts || 0),
      windowBlurs: type === 'windowBlur' ? count : (attempt.violations?.windowBlurs || 0),
      overlaysDetected: type === 'overlaysDetected' ? count : (attempt.violations?.overlaysDetected || 0),
      idleTimeouts: type === 'idleTimeouts' ? count : (attempt.violations?.idleTimeouts || 0)
    };

    try {
      await api.post(`/api/quiz/${activeQuiz._id}/update-violations`, { violations: violationsData });
    } catch (e) {
      console.error(e);
    }

    // Auto submit if student accumulates 3 tab switches or window blurs
    if ((type === 'tabSwitch' || type === 'windowBlur' || type === 'fullScreen') && count >= 3) {
      alert('Security Threshold Exceeded: Too many tab switches, blur, or exit events detected. Your attempt is auto-submitting.');
      autoSubmitAttempt();
    }
  };

  const { warnings } = useCheatDetection(
    handleViolationTriggered,
    3,
    !!(activeQuiz && attempt && !isFullscreenBlock)
  );

  // Time tracker effect
  useEffect(() => {
    if (!activeQuiz || timeLeft <= 0) {
      if (activeQuiz && timeLeft === 0) {
        autoSubmitAttempt();
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [activeQuiz, timeLeft]);

  // Handle launching the attempt
  async function launchAttempt(quiz) {
    if (!window.confirm('Starting this quiz will lock the interface in proctored mode. Ensure your camera/mic permissions are enabled. Continue?')) return;
    try {
      const res = await api.post(`/api/quiz/${quiz._id}/start-attempt`);
      setAttempt(res);
      setActiveQuiz(quiz);
      activeAttemptRef.current = res;
      setTimeLeft(quiz.durationSeconds);
      localStorage.setItem('mits_quiz_session_id', res.clientSessionId);

      // Join socket session
      if (socket) {
        socket.emit('quiz-student-join', {
          quiz: quiz._id,
          studentId: user?._id,
          studentName: user?.name,
          rollNumber: user?.rollNumber
        });
      }

      await startProctoringDevices(quiz);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start quiz attempt.');
    }
  }

  function cancelAttempt() {
    cleanupStreams();
    setActiveQuiz(null);
    setAttempt(null);
    localStorage.removeItem('mits_quiz_session_id');
  }

  function cleanupStreams() {
    if (webcamStream) webcamStream.getTracks().forEach(t => t.stop());
    if (screenshareStream) screenshareStream.getTracks().forEach(t => t.stop());
    setWebcamStream(null);
    setScreenshareStream(null);
  }

  async function submitAttempt(quiz) {
    if (!window.confirm('Are you sure you want to finalize and submit your assessment answers?')) return;
    cleanupStreams();
    
    const answers = quiz.questions.map((q, index) => {
      const formVal = forms.answer[`${quiz._id}-${index}`] ?? '';
      const isMcqOrTf = q.type === 'single_correct' || q.type === 'true_false' || !q.type;
      return {
        questionIndex: index,
        selectedIndex: isMcqOrTf ? Number(formVal !== '' ? formVal : -1) : -1,
        submittedAnswer: !isMcqOrTf ? String(formVal) : '',
        timeSpent: questionTimesRef.current[index] || 0
      };
    });

    await action(async () => {
      const res = await api.post(`/api/quiz/${quiz._id}/submit-attempt`, { answers, violations: attempt.violations });
      
      if (socket) {
        socket.emit('quiz-student-submit', {
          quiz: quiz._id,
          studentId: user?._id,
          studentName: user?.name
        });
      }

      cancelAttempt();
      setIsSubmitted(true);
      return res;
    }, 'Quiz answers graded and submitted');
  }

  async function autoSubmitAttempt() {
    if (!activeQuiz) return;
    cleanupStreams();
    
    const quiz = activeQuiz;
    const answers = quiz.questions.map((q, index) => {
      const formVal = forms.answer[`${quiz._id}-${index}`] ?? '';
      const isMcqOrTf = q.type === 'single_correct' || q.type === 'true_false' || !q.type;
      return {
        questionIndex: index,
        selectedIndex: isMcqOrTf ? Number(formVal !== '' ? formVal : -1) : -1,
        submittedAnswer: !isMcqOrTf ? String(formVal) : '',
        timeSpent: questionTimesRef.current[index] || 0
      };
    });

    try {
      await api.post(`/api/quiz/${quiz._id}/submit-attempt`, { answers, violations: attempt.violations });
      if (socket) {
        socket.emit('quiz-student-submit', {
          quiz: quiz._id,
          studentId: user?._id,
          studentName: user?.name
        });
      }
    } catch (e) {
      console.error(e);
    }
    cancelAttempt();
    setIsSubmitted(true);
    alert('Time limit reached or security violation: Attempt submitted automatically.');
  }

  // Answer selected
  async function selectAnswer(questionIndex, selectedIndex, submittedAnswer = null) {
    if (!activeQuiz) return;
    const key = `${activeQuiz._id}-${questionIndex}`;
    const value = submittedAnswer !== null ? submittedAnswer : String(selectedIndex);
    setForm('answer', key, value);
    
    // Increment timespent tracking
    const currentSpent = questionTimesRef.current[questionIndex] || 0;
    questionTimesRef.current[questionIndex] = currentSpent + 1;

    try {
      await api.post(`/api/quiz/${activeQuiz._id}/update-progress`, {
        questionIndex,
        selectedIndex: selectedIndex !== null ? selectedIndex : -1,
        submittedAnswer: submittedAnswer !== null ? submittedAnswer : '',
        timeSpent: questionTimesRef.current[questionIndex]
      });

      if (socket) {
        // Emit live progress
        const totalQs = activeQuiz.questions.length;
        const answeredCount = activeQuiz.questions.filter((_, idx) => forms.answer[`${activeQuiz._id}-${idx}`] !== undefined).length;
        socket.emit('quiz-student-progress', {
          quiz: activeQuiz._id,
          studentId: user?._id,
          progress: Math.round((answeredCount / totalQs) * 100)
        });
      }
    } catch (e) {
      console.error('Failed to sync progress:', e);
    }
  }

  // Submitted complete screen
  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center font-sans p-6 text-center select-none">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-lg flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
            <CheckSquare size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Assessment Submitted</h2>
          <p className="text-sm text-slate-500 mb-6 font-medium">
            Your quiz response has been successfully graded and recorded. You can safely close this tab now.
          </p>
          <button 
            onClick={() => window.close()}
            className="w-full bg-slate-850 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-xl shadow-md text-xs tracking-wider uppercase"
          >
            Close Assessment Tab
          </button>
        </div>
      </div>
    );
  }

  // Fullscreen block view
  if (activeQuiz && isFullscreenBlock) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <AlertTriangle size={60} className="text-warning mb-4 animate-bounce" />
        <h2 className="text-xl font-bold mb-2">Proctoring Guard Active</h2>
        <p className="text-sm text-slate-400 max-w-md text-center mb-6">
          Exiting fullscreen mode violates security terms. Please click the button below to resume.
        </p>
        <button 
          onClick={enterFullscreen}
          className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg text-sm"
        >
          Resume Fullscreen Mode
        </button>
      </div>
    );
  }

  // Active exam taker view
  if (activeQuiz && attempt) {
    const q = activeQuiz.questions[currentQuestion];
    const selectedVal = forms.answer[`${activeQuiz._id}-${currentQuestion}`] ?? '';

    return (
      <div className="fixed inset-0 z-45 bg-slate-50 flex flex-col font-sans overflow-hidden select-none">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <Shield className="text-primary animate-pulse" size={20} />
            <h1 className="font-title text-sm font-semibold text-slate-800 uppercase tracking-wider">{activeQuiz.title}</h1>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Live Camera Feed Preview */}
            {activeQuiz.requireWebcam && (
              <div className="relative w-20 h-14 bg-black rounded-lg overflow-hidden border-2 border-slate-200 shadow-inner">
                <video ref={videoRef} autoPlay playsInline muted className="object-cover w-full h-full" />
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
            )}

            {/* Timer */}
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200/80 px-4 py-2 rounded-xl text-slate-700 font-bold text-sm">
              <Clock size={16} className="text-slate-500 animate-spin" />
              <span>{Math.floor(timeLeft / 60)}m {timeLeft % 60}s left</span>
            </div>
          </div>
        </header>

        {/* Violations Warning Bar */}
        {warning && (
          <div className="bg-rose-500 text-white font-semibold text-center text-xs py-2 animate-pulse flex items-center justify-center gap-2">
            <AlertCircle size={14} /> Security Alert: Tab change, blur, or exit event detected! Warning #{warning.count}/3
          </div>
        )}

        {/* Main Taker Canvas */}
        <main className="flex-1 flex flex-col md:flex-row max-w-[1400px] w-full mx-auto p-6 gap-6 overflow-hidden">
          {/* Question Box */}
          <section className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Question {currentQuestion + 1} of {activeQuiz.questions.length}</span>
              <span className="text-xs text-slate-400 font-semibold">{q.points || 1} points</span>
            </div>
            
            <h2 className="text-lg font-bold text-slate-800 leading-relaxed mb-6 break-words">{q.text}</h2>
            
            <div className="grid gap-3 max-w-3xl">
              {/* Render inputs conditionally based on question type */}
              {(q.type === 'single_correct' || !q.type) && (
                q.options.map((option, idx) => {
                  const isSelected = selectedVal === String(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => selectAnswer(currentQuestion, idx)}
                      className={`w-full flex items-center p-4.5 rounded-xl border-2 text-left transition-all duration-200 font-medium ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary shadow-[0_2px_12px_rgba(59,130,246,0.06)]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center font-bold text-[10px] uppercase transition-all shrink-0 ${
                        isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300 text-slate-500'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="ml-4 text-sm">{option}</span>
                    </button>
                  );
                })
              )}

              {q.type === 'true_false' && (
                ['True', 'False'].map((option, idx) => {
                  const isSelected = selectedVal === String(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => selectAnswer(currentQuestion, idx)}
                      className={`w-full flex items-center p-4.5 rounded-xl border-2 text-left transition-all duration-200 font-medium ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary shadow-[0_2px_12px_rgba(59,130,246,0.06)]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center font-bold text-[10px] uppercase transition-all shrink-0 ${
                        isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300 text-slate-500'
                      }`}>
                        {idx === 0 ? 'T' : 'F'}
                      </div>
                      <span className="ml-4 text-sm">{option}</span>
                    </button>
                  );
                })
              )}

              {q.type === 'fill_blank' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type Your Text Response</label>
                  <input
                    type="text"
                    placeholder="Type your answer here..."
                    value={selectedVal}
                    onChange={(e) => selectAnswer(currentQuestion, null, e.target.value)}
                    className="w-full max-w-xl p-4 border-2 border-slate-200 hover:border-slate-300 focus:border-primary outline-none rounded-xl text-sm transition-all text-slate-700"
                  />
                </div>
              )}

              {q.type === 'numeric' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type Numerical Response</label>
                  <input
                    type="number"
                    placeholder="Type number answer..."
                    value={selectedVal}
                    onChange={(e) => selectAnswer(currentQuestion, null, e.target.value)}
                    className="w-full max-w-xl p-4 border-2 border-slate-200 hover:border-slate-300 focus:border-primary outline-none rounded-xl text-sm transition-all text-slate-700"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Navigation Sidebar */}
          <aside className="w-full md:w-[320px] bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-6 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question Selector</h3>
            
            <div className="grid grid-cols-5 gap-2.5">
              {activeQuiz.questions.map((_, idx) => {
                const isAnswered = forms.answer[`${activeQuiz._id}-${idx}`] !== undefined && forms.answer[`${activeQuiz._id}-${idx}`] !== '';
                const isCurrent = currentQuestion === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`h-10 rounded-lg flex items-center justify-center font-bold text-xs transition-all border ${
                      isCurrent
                        ? 'bg-primary border-primary text-white'
                        : isAnswered
                        ? 'bg-emerald-55 border-emerald-200 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-2.5 px-4 rounded-lg text-xs disabled:opacity-40 disabled:hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentQuestion(prev => Math.min(activeQuiz.questions.length - 1, prev + 1))}
                  disabled={currentQuestion === activeQuiz.questions.length - 1}
                  className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-2.5 px-4 rounded-lg text-xs disabled:opacity-40 disabled:hover:bg-slate-50"
                >
                  Next
                </button>
              </div>

              <button
                onClick={() => submitAttempt(activeQuiz)}
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3 px-4 rounded-xl shadow-md text-xs tracking-wider uppercase mt-2"
              >
                Submit Assessment
              </button>
            </div>
          </aside>
        </main>
      </div>
    );
  }

  // Quiz listing view
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <div className="pb-5 mb-5 border-b border-borderCool">
          <SectionTitle icon={PlayCircle} title="Live Assessment & Quiz Room" />
          <p className="text-xs text-textMuted mt-1">
            Complete real-time classroom assessments launched by your instructor.
          </p>
        </div>
 
        <DataList emptyText="No assessments currently available.">
          <div className="grid grid-cols-1 gap-5">
            {data.quizzes.map((quiz) => (
              <div 
                className="bg-bgPrimary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4" 
                key={quiz._id}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h3 className="font-title text-sm font-semibold text-textPrimary">{quiz.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-textMuted mt-1 col-gap-2">
                      <span className="font-medium bg-bgSecondary border border-borderCool/60 px-2 py-0.5 rounded text-[10px]">
                        {quiz.batch ? `${quiz.batch.name}` : 'Batch'}
                      </span>
                      <span>{quiz.questions?.length || 0} Questions</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {quiz.durationSeconds}s limit
                      </span>
                      
                      {/* Proctoring Badges */}
                      {(quiz.requireWebcam || quiz.requireMic || quiz.requireScreenshare) && (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 font-bold border border-rose-100 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
                          <Shield size={10} /> Proctored
                        </span>
                      )}
                    </div>
                  </div>
 
                  <span className={`self-start inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    quiz.isLive 
                      ? 'bg-success/10 text-success' 
                      : 'bg-textMuted/10 text-textMuted'
                  }`}>
                    {quiz.isLive ? 'Active (Live)' : 'Draft'}
                  </span>
                </div>
                
                {/* Body details */}
                {quiz.isLive ? (
                  <div className="flex flex-col gap-4 pt-3 border-t border-borderCool/60">
                    <div className="flex items-center gap-2 p-3 bg-warning/5 border border-warning/10 rounded-lg text-[11px] text-textMuted leading-relaxed font-medium">
                      <Clock size={13} className="shrink-0 text-warning" />
                      <span>This assessment is proctored. tab switches, blurs, copy/paste, and devtools exits are monitored. It will open in a secure new tab.</span>
                    </div>
 
                    <button 
                      className="flex items-center justify-center gap-2 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-lg shadow-sm self-start animate-pulse"
                      onClick={() => {
                        window.open(window.location.origin + `?quizTaker=true&quizId=${quiz._id}`, '_blank');
                      }}
                    >
                      <PlayCircle size={14} /> Start Quiz Assessment
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-4 bg-bgSecondary border border-borderCool/60 rounded-xl text-xs text-textMuted italic pt-3 border-t font-light">
                    <AlertCircle size={14} /> Wait for the instructor/host to make this test live to begin.
                  </div>
                )}
              </div>
            ))}
          </div>
        </DataList>
      </div>
    </div>
  );
}
