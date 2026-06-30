import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayCircle, Clock, CheckSquare, AlertCircle, AlertTriangle, Shield, Camera, Mic, Monitor, Flag, ChevronLeft, ChevronRight, Download, Award, FileText, Eye, EyeOff } from 'lucide-react';
import { Badge, DataList, SectionTitle, Select } from '../../components/Shared';
import useCheatDetection from '../../hooks/useCheatDetection';

export default function LiveQuizPlayer({ data, forms, setForm, api, action, socket, user, forceActiveQuizId }) {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [warning, setWarning] = useState(null);
  const [isFullscreenBlock, setIsFullscreenBlock] = useState(false);
  const [launchPhase, setLaunchPhase] = useState('idle');
  const [countdown, setCountdown] = useState(3);
  const [markedQuestions, setMarkedQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [showReview, setShowReview] = useState(false);

  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const questionTimesRef = useRef({});
  const activeAttemptRef = useRef(null);
  
  // Keep camera and screen streams preserved in refs
  const webcamStreamRef = useRef(null);
  const screenshareStreamRef = useRef(null);
  const lastMouseMoveTime = useRef(Date.now());

  // ─── Real-time camera preview binder ───
  useEffect(() => {
    if (videoRef.current && webcamStreamRef.current) {
      videoRef.current.srcObject = webcamStreamRef.current;
    }
  }, [launchPhase, currentQuestion, isFullscreenBlock]);

  // ─── Listen for attempt resets from admin via socket ───
  useEffect(() => {
    if (!socket || !attempt) return;
    
    const handleReset = (payload) => {
      if (String(payload.attemptId) === String(attempt._id)) {
        alert('Your exam attempt has been reset by the instructor. You may now start the exam fresh.');
        cancelAttempt();
      }
    };
    
    socket.on('quiz-student-reset', handleReset);
    return () => {
      socket.off('quiz-student-reset', handleReset);
    };
  }, [socket, attempt]);

  // ─── Resume saved session ───
  useEffect(() => {
    const savedSession = localStorage.getItem('mits_quiz_session_id');
    if (savedSession) resumeSession(savedSession);
  }, []);

  // ─── Auto-launch from forceActiveQuizId ───
  useEffect(() => {
    if (forceActiveQuizId && data.quizzes && !attempt && !activeQuiz && launchPhase === 'idle') {
      const quiz = data.quizzes.find(q => q._id === forceActiveQuizId);
      if (quiz && !localStorage.getItem('mits_quiz_session_id')) {
        beginLaunchSequence(quiz);
      }
    }
  }, [forceActiveQuizId, data.quizzes, attempt, activeQuiz, launchPhase]);

  async function resumeSession(sessionId) {
    try {
      const res = await api.post(`/api/quiz/resume/${sessionId}`);
      if (res && res.quiz) {
        setAttempt(res);
        const quizObj = data.quizzes.find(q => q._id === (res.quiz._id || res.quiz));
        if (quizObj) {
          setActiveQuiz(quizObj);
          activeAttemptRef.current = res;
          setMarkedQuestions(res.markedForReview || []);
          const elapsed = Math.floor((Date.now() - new Date(res.startedAt || res.createdAt).getTime()) / 1000);
          setTimeLeft(Math.max(0, quizObj.durationSeconds - elapsed));
          res.answers?.forEach(ans => {
            const val = ans.submittedAnswer || String(ans.selectedIndex);
            setForm('answer', `${quizObj._id}-${ans.questionIndex}`, val);
          });
          setLaunchPhase('exam');
          enterFullscreen();
        }
      } else {
        localStorage.removeItem('mits_quiz_session_id');
      }
    } catch {
      localStorage.removeItem('mits_quiz_session_id');
    }
  }

  // ─── Launch Sequence (Cam/Mic -> Screenshare -> Fullscreen Prompt -> Countdown -> Exam) ───
  async function beginLaunchSequence(quiz) {
    setActiveQuiz(quiz);
    if (quiz.requireWebcam || quiz.requireMic) {
      setLaunchPhase('webcam');
    } else if (quiz.requireScreenshare) {
      setLaunchPhase('screenshare');
    } else {
      setLaunchPhase('fullscreen-prompt');
    }
  }

  async function handleWebcamGrant() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: activeQuiz?.requireWebcam ? { width: 320, height: 240 } : false,
        audio: activeQuiz?.requireMic || false
      });
      webcamStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Transition to next permission step
      if (activeQuiz?.requireScreenshare) {
        setLaunchPhase('screenshare');
      } else {
        setLaunchPhase('fullscreen-prompt');
      }
    } catch (err) {
      alert('Permissions (Camera/Microphone) are mandatory to participate in this exam. Please allow access.');
    }
  }

  async function handleScreenshareGrant() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenshareStreamRef.current = stream;
      stream.getVideoTracks()[0].onended = () => {
        handleViolationTriggered('screenshareStopped', 1);
      };
      setLaunchPhase('fullscreen-prompt');
    } catch (err) {
      alert('Screen sharing is required to join this examination room. Please share your entire screen.');
    }
  }

  async function handleFullscreenGrant() {
    try {
      const el = document.documentElement;
      await (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)?.call(el);
      setIsFullscreenBlock(false);
      startCountdown();
    } catch {
      alert('Fullscreen lock failed. Please enable fullscreen to start the exam.');
    }
  }

  function startCountdown() {
    setLaunchPhase('countdown');
    setCountdown(3);
    let c = 3;
    const iv = setInterval(() => {
      c--;
      if (c <= 0) {
        clearInterval(iv);
        actuallyStartExam();
      } else {
        setCountdown(c);
      }
    }, 1000);
  }

  async function actuallyStartExam() {
    try {
      const res = await api.post(`/api/quiz/${activeQuiz._id}/start-attempt`);
      const attemptData = res.attempt || res;
      const quizData = res.quiz || activeQuiz;

      setAttempt(attemptData);
      activeAttemptRef.current = attemptData;
      setActiveQuiz(prev => ({ ...prev, ...quizData }));
      setTimeLeft(quizData.durationSeconds || activeQuiz.durationSeconds);
      
      // Initialize mouse movement tracking
      lastMouseMoveTime.current = Date.now();
      
      setLaunchPhase('exam');
      localStorage.setItem('mits_quiz_session_id', attemptData.clientSessionId);

      if (socket) {
        socket.emit('quiz-student-join', {
          quiz: activeQuiz._id,
          studentId: user?._id,
          studentName: user?.name,
          rollNumber: user?.rollNumber
        });
      }
    } catch (error) {
      alert(error.message || 'Failed to start exam attempt.');
      cancelAttempt();
    }
  }

  // ─── Fullscreen ───
  function enterFullscreen() {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)?.call(el).catch(() => {});
    setIsFullscreenBlock(false);
  }

  useEffect(() => {
    if (launchPhase !== 'exam') return;
    const check = () => {
      if (!document.fullscreenElement) setIsFullscreenBlock(true);
      else setIsFullscreenBlock(false);
    };
    document.addEventListener('fullscreenchange', check);
    return () => document.removeEventListener('fullscreenchange', check);
  }, [launchPhase]);

  // ─── Cursor / Mouse Activity Tracking ───
  useEffect(() => {
    if (launchPhase !== 'exam') return;

    const trackMouse = () => {
      lastMouseMoveTime.current = Date.now();
    };

    window.addEventListener('mousemove', trackMouse);
    return () => window.removeEventListener('mousemove', trackMouse);
  }, [launchPhase]);

  // ─── Periodic cursor and idle checks ───
  useEffect(() => {
    if (launchPhase !== 'exam' || !attempt) return;

    const interval = setInterval(() => {
      const idleTime = Date.now() - lastMouseMoveTime.current;
      if (idleTime > 60000) {
        // Reset timestamp so student is not spammed instantly
        lastMouseMoveTime.current = Date.now();
        
        // Trigger idle alert warning
        const currentBlurs = attempt.violations?.windowBlurs || 0;
        handleViolationTriggered('windowBlur', currentBlurs + 1);
        
        alert('Security Alert: No cursor activity detected for over 1 minute! Please remain active and move your cursor.');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [launchPhase, attempt]);

  // ─── Laptop shutdown / tab close auto-submit ───
  useEffect(() => {
    if (launchPhase !== 'exam' || !activeQuiz || !attempt) return;

    const handleUnload = (e) => {
      const token = localStorage.getItem('mits_lms_token') || '';
      const url = `${api.getUri()}/api/quiz/${activeQuiz._id}/submit-attempt?token=${token}`;
      const answers = activeQuiz.questions.map((q, index) => {
        const formVal = forms.answer[`${activeQuiz._id}-${index}`] ?? '';
        const isMcq = q.type === 'single_correct' || q.type === 'true_false' || !q.type;
        return {
          questionIndex: index,
          selectedIndex: isMcq ? Number(formVal !== '' ? formVal : -1) : -1,
          submittedAnswer: !isMcq ? String(formVal) : '',
          timeSpent: questionTimesRef.current[index] || 0
        };
      });

      const payload = JSON.stringify({ answers, violations: attempt.violations });
      
      // Submit attempt reliably on exit / power-loss / reload
      navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      
      e.preventDefault();
      e.returnValue = 'Do you want to leave the exam? Your attempt will be submitted.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [launchPhase, activeQuiz, attempt, forms.answer]);

  // ─── Cheat Detection ───
  const handleViolationTriggered = useCallback(async (type, count) => {
    if (!attempt || !activeQuiz) return;

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

    const v = {
      tabSwitches: type === 'tabSwitch' ? count : (attempt.violations?.tabSwitches || 0),
      fullScreenExits: type === 'fullScreen' ? count : (attempt.violations?.fullScreenExits || 0),
      copyAttempts: type === 'copyPaste' ? count : (attempt.violations?.copyAttempts || 0),
      devToolsAttempts: type === 'devTools' ? count : (attempt.violations?.devToolsAttempts || 0),
      windowBlurs: type === 'windowBlur' ? count : (attempt.violations?.windowBlurs || 0),
      overlaysDetected: type === 'overlaysDetected' ? count : (attempt.violations?.overlaysDetected || 0),
      idleTimeouts: type === 'idleTimeouts' ? count : (attempt.violations?.idleTimeouts || 0),
      screenshareStopped: type === 'screenshareStopped' ? count : (attempt.violations?.screenshareStopped || 0)
    };

    try {
      await api.post(`/api/quiz/${activeQuiz._id}/update-violations`, { violations: v });
    } catch {}

    if ((type === 'tabSwitch' || type === 'fullScreen') && count >= 3) {
      alert('Too many security violations! Your exam has been submitted automatically.');
      autoSubmitAttempt();
    }
  }, [attempt, activeQuiz, socket, user]);

  const { warnings } = useCheatDetection(
    handleViolationTriggered, 3,
    !!(launchPhase === 'exam' && activeQuiz && attempt && !isFullscreenBlock)
  );

  // ─── Timer ───
  useEffect(() => {
    if (launchPhase !== 'exam' || timeLeft <= 0) {
      if (launchPhase === 'exam' && timeLeft === 0 && activeQuiz) autoSubmitAttempt();
      return;
    }
    timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [launchPhase, timeLeft]);

  // ─── Answer Selection ───
  async function selectAnswer(qi, selectedIndex, submittedAnswer = null) {
    if (!activeQuiz) return;
    const key = `${activeQuiz._id}-${qi}`;
    const value = submittedAnswer !== null ? submittedAnswer : String(selectedIndex);
    setForm('answer', key, value);
    questionTimesRef.current[qi] = (questionTimesRef.current[qi] || 0) + 1;

    try {
      await api.post(`/api/quiz/${activeQuiz._id}/update-progress`, {
        questionIndex: qi,
        selectedIndex: selectedIndex ?? -1,
        submittedAnswer: submittedAnswer ?? '',
        timeSpent: questionTimesRef.current[qi]
      });
      if (socket) {
        const total = activeQuiz.questions.length;
        const answered = activeQuiz.questions.filter((_, i) => forms.answer[`${activeQuiz._id}-${i}`] !== undefined).length;
        socket.emit('quiz-student-progress', { quiz: activeQuiz._id, studentId: user?._id, progress: Math.round((answered / total) * 100) });
      }
    } catch {}
  }

  function toggleMark(qi) {
    const next = markedQuestions.includes(qi) ? markedQuestions.filter(i => i !== qi) : [...markedQuestions, qi];
    setMarkedQuestions(next);
    try { api.post(`/api/quiz/${activeQuiz._id}/update-marked`, { markedForReview: next }); } catch {}
  }

  // ─── Submission ───
  function cleanupStreams() {
    webcamStreamRef.current?.getTracks().forEach(t => t.stop());
    screenshareStreamRef.current?.getTracks().forEach(t => t.stop());
    webcamStreamRef.current = null;
    screenshareStreamRef.current = null;
  }

  function cancelAttempt() {
    cleanupStreams();
    setActiveQuiz(null);
    setAttempt(null);
    setLaunchPhase('idle');
    localStorage.removeItem('mits_quiz_session_id');
  }

  async function submitAttempt() {
    // 1-minute minimum lock check
    const start = new Date(attempt?.startedAt || attempt?.createdAt || Date.now());
    const duration = Math.floor((Date.now() - start.getTime()) / 1000);
    if (duration < 60) {
      alert(`Submission Blocked: You must spend at least 1 minute (60 seconds) in the exam before submitting. Please review your answers.`);
      return;
    }

    if (!window.confirm('Are you sure you want to submit your exam answers?')) return;
    cleanupStreams();
    try {
      const res = await api.post(`/api/quiz/${activeQuiz._id}/submit-attempt`, { violations: attempt.violations });
      if (socket) socket.emit('quiz-student-submit', { quiz: activeQuiz._id, studentId: user?._id, studentName: user?.name });
      setResult(res);
      setLaunchPhase('submitted');
      localStorage.removeItem('mits_quiz_session_id');
    } catch (e) {
      alert('Submission failed: ' + (e.message || 'Unknown error'));
    }
  }

  async function autoSubmitAttempt() {
    if (!activeQuiz) return;
    cleanupStreams();
    try {
      const res = await api.post(`/api/quiz/${activeQuiz._id}/submit-attempt`, { violations: attempt?.violations });
      if (socket) socket.emit('quiz-student-submit', { quiz: activeQuiz._id, studentId: user?._id, studentName: user?.name });
      setResult(res);
    } catch {}
    setLaunchPhase('submitted');
    localStorage.removeItem('mits_quiz_session_id');
  }

  // ─── Certificate PNG Generator ───
  function downloadCertificate() {
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, '#0f172a'); grad.addColorStop(1, '#1e3a5f');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1200, 800);

    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 1140, 740);
    ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, 1120, 720);

    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
    ctx.fillText('ETHNOTECH ACADEMIC SOLUTIONS', 600, 100);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 44px Georgia';
    ctx.fillText('Certificate of Achievement', 600, 170);

    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(350, 200); ctx.lineTo(850, 200); ctx.stroke();

    ctx.fillStyle = '#94a3b8'; ctx.font = '18px Arial';
    ctx.fillText('This certifies that', 600, 260);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 36px Georgia';
    ctx.fillText(user?.name || 'Student', 600, 310);
    ctx.fillStyle = '#94a3b8'; ctx.font = '18px Arial';
    ctx.fillText('has successfully passed the examination', 600, 370);
    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 28px Georgia';
    ctx.fillText(result?.quizTitle || activeQuiz?.title || 'Exam', 600, 420);
    ctx.fillStyle = '#94a3b8'; ctx.font = '18px Arial';
    ctx.fillText(`with a score of ${result?.percentage || 0}%`, 600, 470);
    ctx.fillText(`Department: ${result?.quizDepartment || activeQuiz?.department || 'N/A'}`, 600, 510);

    ctx.fillStyle = '#64748b'; ctx.font = '14px Arial';
    ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 600, 600);
    ctx.fillText(`Roll Number: ${user?.rollNumber || 'N/A'}`, 600, 630);

    ctx.fillStyle = '#22c55e'; ctx.font = 'bold 20px Arial';
    ctx.fillText('✓ VERIFIED ASSESSMENT RESULT', 600, 700);

    const link = document.createElement('a');
    link.download = `Certificate_${(result?.quizTitle || 'Exam').replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // ─── Styled PDF Question Paper Generator ───
  function downloadPaper() {
    if (!result?.questions) return;
    
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      
      const img = new Image();
      img.src = '/ethnotech_academic_solutions_logo.jpg';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        
        generateStyledPDF(doc, dataUrl);
      };
      img.onerror = () => {
        generateStyledPDF(doc, null); // fallback if logo fails
      };
    });
  }

  function generateStyledPDF(doc, logoDataUrl) {
    let y = 20;

    // Header Borders & Styling
    doc.setDrawColor(15, 23, 42); // slate-900
    doc.setLineWidth(1);
    doc.rect(10, 10, 190, 277); // Outer page border

    // Draw logo if exists
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'JPEG', 15, 15, 20, 20);
    }

    // Header text
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('ETHNOTECH ACADEMIC SOLUTIONS', 40, 20);
    
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Real-Time Examination & Assessment Evaluation Report', 40, 26);
    doc.text(`Department: ${result?.quizDepartment || activeQuiz?.department || 'General'}`, 40, 31);

    // Header line
    doc.setDrawColor(203, 213, 225); // slate-200
    doc.setLineWidth(0.5);
    doc.line(12, 38, 198, 38);

    // Student Assessment Info Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(15, 42, 180, 42, 'F');
    doc.rect(15, 42, 180, 42); // border

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('EXAMINATION EVALUATION DETAILS', 20, 48);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Candidate Name: ${user?.name || 'Student'}`, 20, 56);
    doc.text(`Roll Number: ${user?.rollNumber || 'N/A'}`, 20, 62);
    doc.text(`Exam Title: ${result?.quizTitle || activeQuiz?.title || 'Exam'}`, 20, 68);
    doc.text(`Date Evaluated: ${new Date().toLocaleDateString()}`, 20, 74);

    doc.setFont('Helvetica', 'bold');
    doc.text(`Final Score: ${result?.score} / ${result?.totalMarks} (${result?.percentage}%)`, 120, 56);
    doc.text(`Passing Grade: ${result?.passingPercentage}%`, 120, 62);
    
    const isPassed = result?.passed || result?.percentage >= (result?.passingPercentage || 40);
    doc.setTextColor(isPassed ? 22 : 225, isPassed ? 163 : 29, isPassed ? 74 : 72); // Green vs Red
    doc.text(`RESULT STATUS: ${isPassed ? 'PASS' : 'FAIL'}`, 120, 68);

    doc.setTextColor(100, 116, 139);
    const totalViolations = (attempt?.violations?.tabSwitches || 0) + (attempt?.violations?.windowBlurs || 0) + (attempt?.violations?.fullScreenExits || 0);
    doc.text(`Security Warnings Triggered: ${totalViolations}`, 120, 74);

    // Reset styles
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('QUESTION PAPER & RESPONSES', 15, 96);
    doc.line(15, 98, 70, 98);

    y = 106;

    result.questions.forEach((q, idx) => {
      // Check page height limit to add page dynamically
      if (y > 250) {
        doc.addPage();
        doc.setDrawColor(15, 23, 42);
        doc.rect(10, 10, 190, 277); // Redraw page border
        y = 25;
      }

      const userAns = result.answers?.find(a => a.questionIndex === idx);
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      
      const qNumText = `Q${idx + 1}. `;
      const pointsText = ` [${q.points || 1} Marks]`;
      doc.text(qNumText, 15, y);
      
      // Wrap question statement
      const statementLines = doc.splitTextToSize(q.text, 160);
      doc.text(statementLines, 22, y);
      
      y += (statementLines.length * 5);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);

      // Render options list for MCQ
      if (q.type === 'single_correct' || !q.type) {
        q.options?.forEach((opt, oi) => {
          doc.text(`  ${String.fromCharCode(65 + oi)}) ${opt}`, 22, y);
          y += 5;
        });
        
        const correctOptText = `Correct Answer: Option ${String.fromCharCode(65 + q.correctIndex)} (${q.options?.[q.correctIndex]})`;
        const studentOptText = userAns?.selectedIndex !== -1 && userAns?.selectedIndex !== undefined
          ? `Your Answer: Option ${String.fromCharCode(65 + userAns.selectedIndex)} (${q.options?.[userAns.selectedIndex]})`
          : 'Your Answer: [Not Answered]';

        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(22, 163, 74); // green
        doc.text(correctOptText, 22, y);
        y += 5;

        doc.setTextColor(userAns?.isCorrect ? 22 : 225, userAns?.isCorrect ? 163 : 29, userAns?.isCorrect ? 74 : 72);
        doc.text(studentOptText, 22, y);
        y += 7;
      } else if (q.type === 'true_false') {
        const correctOptText = `Correct Answer: ${q.correctIndex === 0 ? 'True' : 'False'}`;
        const studentOptText = userAns?.selectedIndex !== -1 && userAns?.selectedIndex !== undefined
          ? `Your Answer: ${userAns.selectedIndex === 0 ? 'True' : 'False'}`
          : 'Your Answer: [Not Answered]';

        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(22, 163, 74);
        doc.text(correctOptText, 22, y);
        y += 5;

        doc.setTextColor(userAns?.isCorrect ? 22 : 225, userAns?.isCorrect ? 163 : 29, userAns?.isCorrect ? 74 : 72);
        doc.text(studentOptText, 22, y);
        y += 7;
      } else {
        // Text responses
        const correctOptText = `Correct Answer: ${q.correctAnswerText || 'N/A'}`;
        const studentOptText = `Your Answer: ${userAns?.submittedAnswer || '[Not Answered]'}`;

        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(22, 163, 74);
        doc.text(correctOptText, 22, y);
        y += 5;

        doc.setTextColor(userAns?.isCorrect ? 22 : 225, userAns?.isCorrect ? 163 : 29, userAns?.isCorrect ? 74 : 72);
        doc.text(studentOptText, 22, y);
        y += 7;
      }
      y += 3; // buffer gap between questions
    });

    doc.save(`${(result.quizTitle || 'Exam').replace(/\s+/g, '_')}_Paper.pdf`);
  }

  const timerColor = timeLeft > 120 ? 'text-emerald-500' : timeLeft > 60 ? 'text-amber-500' : 'text-rose-500 animate-pulse';

  // ═══════════════════════ RENDER PHASES ═══════════════════════

  // ─── Fullscreen Prompt Phase ───
  if (launchPhase === 'fullscreen-prompt') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white p-6 select-none animate-fadeIn">
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-10 max-w-lg w-full flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
            <Monitor size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Launch Secure Mode</h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            All devices set up. Click below to enter fullscreen lock mode and begin the countdown sequence.
          </p>
          <button onClick={handleFullscreenGrant}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg text-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
            Enter Fullscreen & Start Exam
          </button>
        </div>
      </div>
    );
  }

  // ─── Webcam Permission Phase ───
  if (launchPhase === 'webcam') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white p-6 select-none animate-fadeIn">
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-10 max-w-lg w-full flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
            <Camera size={40} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Camera & Mic Access</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            This exam requires webcam and audio capture. Confirm the browser permission pop-up to show your camera stream.
          </p>
          
          {/* Active local camera stream preview */}
          <div className="w-64 h-48 bg-slate-950 rounded-2xl mb-8 overflow-hidden border-2 border-slate-700 flex items-center justify-center relative shadow-inner">
            <video ref={videoRef} autoPlay playsInline muted className="object-cover w-full h-full" />
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded text-[9px] text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> PREVIEW
            </div>
          </div>

          <button onClick={handleWebcamGrant}
            className="w-full bg-emerald-55 hover:bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg text-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
            Allow & Start Camera
          </button>
        </div>
      </div>
    );
  }

  // ─── Screenshare Permission Phase ───
  if (launchPhase === 'screenshare') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white p-6 select-none animate-fadeIn">
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-10 max-w-lg w-full flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
            <Monitor size={40} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Share Entire Screen</h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Please choose <strong className="text-white">Entire Screen</strong> in the browser prompt. Selecting a single window or tab is a security violation.
          </p>
          <button onClick={handleScreenshareGrant}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg text-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
            Configure Screen Sharing
          </button>
        </div>
      </div>
    );
  }

  // ─── Countdown Phase ───
  if (launchPhase === 'countdown') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white p-6 select-none">
        <div className="flex flex-col items-center">
          <p className="text-lg text-slate-400 mb-4 font-semibold uppercase tracking-widest">Exam Starting In</p>
          <div className="w-40 h-40 rounded-full border-4 border-primary flex items-center justify-center animate-pulse">
            <span className="text-7xl font-black text-primary">{countdown}</span>
          </div>
          <p className="text-sm text-slate-500 mt-6">{activeQuiz?.title}</p>
        </div>
      </div>
    );
  }

  // ─── Submitted / Result Screen ───
  if (launchPhase === 'submitted') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center font-sans p-6 select-none overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-2xl w-full shadow-lg flex flex-col items-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${result?.passed ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
            {result?.passed ? <CheckSquare size={40} /> : <AlertCircle size={40} />}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">{result?.passed ? 'Congratulations!' : 'Exam Submitted'}</h2>
          <p className="text-sm text-slate-500 mb-6 font-medium">
            {result?.passed ? 'You have passed the exam!' : 'Better luck next time.'}
          </p>

          <div className="grid grid-cols-3 gap-4 w-full mb-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400 font-semibold">Score</p>
              <p className="text-2xl font-black text-slate-800">{result?.score || 0}/{result?.totalMarks || 0}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400 font-semibold">Percentage</p>
              <p className={`text-2xl font-black ${result?.passed ? 'text-emerald-600' : 'text-rose-600'}`}>{result?.percentage || 0}%</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400 font-semibold">Result</p>
              <p className={`text-2xl font-black ${result?.passed ? 'text-emerald-600' : 'text-rose-600'}`}>{result?.passed ? 'PASS' : 'FAIL'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full">
            {result?.enableCertificate && result?.passed && (
              <button onClick={downloadCertificate}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-5 rounded-xl text-xs flex-1 justify-center">
                <Award size={16} /> Download Certificate
              </button>
            )}
            {result?.allowPaperDownload && result?.questions && (
              <button onClick={downloadPaper}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-5 rounded-xl text-xs flex-1 justify-center">
                <FileText size={16} /> Download Paper (PDF)
              </button>
            )}
            {result?.showAnswers && result?.questions && (
              <button onClick={() => setShowReview(!showReview)}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-5 rounded-xl text-xs flex-1 justify-center">
                {showReview ? <EyeOff size={16} /> : <Eye size={16} />} {showReview ? 'Hide' : 'Review'} Answers
              </button>
            )}
          </div>

          {showReview && result?.questions && (
            <div className="w-full mt-6 flex flex-col gap-3 max-h-[50vh] overflow-y-auto">
              {result.questions.map((q, i) => {
                const ans = result.answers?.find(a => a.questionIndex === i);
                return (
                  <div key={i} className={`border rounded-xl p-4 text-left ${ans?.isCorrect ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-400">Q{i + 1}</span>
                      <p className="text-sm font-semibold text-slate-800 flex-1">{q.text}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ans?.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {ans?.isCorrect ? '✓ Correct' : '✗ Wrong'}
                      </span>
                    </div>
                    {(q.type === 'single_correct' || !q.type) && q.options?.map((opt, j) => (
                      <div key={j} className={`text-xs px-3 py-1.5 rounded-md mb-1 ${j === q.correctIndex ? 'bg-emerald-100 text-emerald-800 font-bold' : ans?.selectedIndex === j ? 'bg-rose-100 text-rose-700' : 'text-slate-600'}`}>
                        {String.fromCharCode(65 + j)}) {opt}
                      </div>
                    ))}
                    {q.type === 'true_false' && (
                      <p className="text-xs text-slate-600">Correct: <strong>{q.correctIndex === 0 ? 'True' : 'False'}</strong> | Your answer: <strong>{ans?.selectedIndex === 0 ? 'True' : 'False'}</strong></p>
                    )}
                    {(q.type === 'fill_blank' || q.type === 'numeric') && (
                      <p className="text-xs text-slate-600">Correct: <strong>{q.correctAnswerText}</strong> | Your answer: <strong>{ans?.submittedAnswer || 'N/A'}</strong></p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={() => window.close()}
            className="w-full mt-6 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-xl shadow-md text-xs tracking-wider uppercase">
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  // ─── Fullscreen block ───
  if (launchPhase === 'exam' && isFullscreenBlock) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <AlertTriangle size={60} className="text-warning mb-4 animate-bounce" />
        <h2 className="text-xl font-bold mb-2">Proctoring Guard Active</h2>
        <p className="text-sm text-slate-400 max-w-md text-center mb-6">
          Exiting fullscreen is a violation. Click below to resume.
        </p>
        <button onClick={enterFullscreen}
          className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg text-sm">
          Resume Fullscreen
        </button>
      </div>
    );
  }

  // ─── Active Exam Taker ───
  if (launchPhase === 'exam' && activeQuiz && attempt) {
    const q = activeQuiz.questions[currentQuestion];
    const selectedVal = forms.answer[`${activeQuiz._id}-${currentQuestion}`] ?? '';
    const isMarked = markedQuestions.includes(currentQuestion);

    return (
      <div className="fixed inset-0 z-45 bg-slate-50 flex flex-col font-sans overflow-hidden select-none"
        onCopy={e => e.preventDefault()} onPaste={e => e.preventDefault()} onCut={e => e.preventDefault()}>
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <Shield className="text-primary" size={18} />
            <h1 className="font-title text-xs font-bold text-slate-800 uppercase tracking-wider">{activeQuiz.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            
            {/* Live Camera Feed */}
            {webcamStreamRef.current && (
              <div className="relative w-16 h-12 bg-black rounded-lg overflow-hidden border-2 border-slate-200">
                <video ref={videoRef} autoPlay playsInline muted className="object-cover w-full h-full" />
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
            )}

            <div className={`flex items-center gap-2 bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-lg font-bold text-sm ${timerColor}`}>
              <Clock size={14} />
              <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
            </div>
          </div>
        </header>

        {/* Warning Bar */}
        {warning && (
          <div className="bg-rose-500 text-white font-semibold text-center text-xs py-2 animate-pulse flex items-center justify-center gap-2">
            <AlertCircle size={14} /> Security Violation: {warning.type} detected! Warning #{warning.count}/3
          </div>
        )}

        {/* Main Canvas */}
        <main className="flex-1 flex flex-col md:flex-row max-w-[1400px] w-full mx-auto p-4 gap-4 overflow-hidden">
          
          {/* Question Box */}
          <section className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                Question {currentQuestion + 1} of {activeQuiz.questions.length}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-semibold">{q?.points || 1} pts</span>
                <button onClick={() => toggleMark(currentQuestion)}
                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${isMarked ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  <Flag size={10} /> {isMarked ? 'Flagged' : 'Flag'}
                </button>
              </div>
            </div>

            <h2 className="text-base font-bold text-slate-800 leading-relaxed mb-5 break-words">{q?.text}</h2>

            <div className="grid gap-2.5 max-w-3xl">
              {(q?.type === 'single_correct' || !q?.type) && q?.options?.map((opt, idx) => {
                const isSel = selectedVal === String(idx);
                return (
                  <button key={idx} onClick={() => selectAnswer(currentQuestion, idx)}
                    className={`w-full flex items-center p-3.5 rounded-xl border-2 text-left transition-all font-medium ${isSel ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'}`}>
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center font-bold text-[10px] shrink-0 ${isSel ? 'bg-primary border-primary text-white' : 'border-slate-300 text-slate-500'}`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="ml-3 text-sm">{opt}</span>
                  </button>
                );
              })}

              {q?.type === 'true_false' && ['True', 'False'].map((opt, idx) => {
                const isSel = selectedVal === String(idx);
                return (
                  <button key={idx} onClick={() => selectAnswer(currentQuestion, idx)}
                    className={`w-full flex items-center p-3.5 rounded-xl border-2 text-left transition-all font-medium ${isSel ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'}`}>
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center font-bold text-[10px] shrink-0 ${isSel ? 'bg-primary border-primary text-white' : 'border-slate-300 text-slate-500'}`}>
                      {idx === 0 ? 'T' : 'F'}
                    </div>
                    <span className="ml-3 text-sm">{opt}</span>
                  </button>
                );
              })}

              {q?.type === 'fill_blank' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type Your Answer</label>
                  <input type="text" placeholder="Type answer here..." value={selectedVal}
                    onChange={e => selectAnswer(currentQuestion, null, e.target.value)}
                    className="w-full max-w-xl p-3.5 border-2 border-slate-200 hover:border-slate-300 focus:border-primary outline-none rounded-xl text-sm text-slate-700" />
                </div>
              )}

              {q?.type === 'numeric' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enter Numeric Answer</label>
                  <input type="number" step="any" placeholder="Enter number..." value={selectedVal}
                    onChange={e => selectAnswer(currentQuestion, null, e.target.value)}
                    className="w-full max-w-xl p-3.5 border-2 border-slate-200 hover:border-slate-300 focus:border-primary outline-none rounded-xl text-sm text-slate-700" />
                </div>
              )}
            </div>
          </section>

          {/* Sidebar Navigation */}
          <aside className="w-full md:w-[280px] bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-4 overflow-y-auto">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navigation</h3>
            <div className="grid grid-cols-5 gap-2">
              {activeQuiz.questions.map((_, idx) => {
                const isAns = forms.answer[`${activeQuiz._id}-${idx}`] !== undefined && forms.answer[`${activeQuiz._id}-${idx}`] !== '';
                const isCur = currentQuestion === idx;
                const isFlagged = markedQuestions.includes(idx);
                return (
                  <button key={idx} onClick={() => setCurrentQuestion(idx)}
                    className={`h-9 rounded-lg flex items-center justify-center font-bold text-[10px] transition-all border relative ${isCur ? 'bg-primary border-primary text-white' : isAns ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                    {idx + 1}
                    {isFlagged && <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2 text-[9px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-primary rounded" /> Current</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded" /> Answered</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-200 rounded" /> Unanswered</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full" /> Flagged</span>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex gap-2">
                <button onClick={() => setCurrentQuestion(p => Math.max(0, p - 1))} disabled={currentQuestion === 0}
                  className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-2 px-3 rounded-lg text-xs disabled:opacity-40">
                  <ChevronLeft size={12} className="inline" /> Prev
                </button>
                <button onClick={() => setCurrentQuestion(p => Math.min(activeQuiz.questions.length - 1, p + 1))} disabled={currentQuestion === activeQuiz.questions.length - 1}
                  className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-2 px-3 rounded-lg text-xs disabled:opacity-40">
                  Next <ChevronRight size={12} className="inline" />
                </button>
              </div>
              <button onClick={submitAttempt}
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-2.5 px-4 rounded-xl shadow-md text-xs tracking-wider uppercase mt-1">
                Submit Exam
              </button>
            </div>
          </aside>
        </main>
      </div>
    );
  }

  // ─── Quiz Listing View ───
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <div className="pb-5 mb-5 border-b border-borderCool">
          <SectionTitle icon={PlayCircle} title="Examination Portal" />
          <p className="text-xs text-textMuted mt-1">Take live proctored examinations launched by your instructor.</p>
        </div>

        <DataList emptyText="No examinations available.">
          <div className="grid grid-cols-1 gap-5">
            {data.quizzes.map((quiz) => {
              const status = quiz.status || (quiz.isLive ? 'live' : 'draft');
              const isLive = status === 'live';
              return (
                <div className="bg-bgPrimary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4" key={quiz._id}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <h3 className="font-title text-sm font-semibold text-textPrimary">{quiz.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-textMuted mt-1">
                        {quiz.department && <span className="font-bold bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] uppercase">{quiz.department}</span>}
                        <span>{quiz.questions?.length || 0} Questions</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {Math.floor((quiz.durationSeconds || 0) / 60)}m</span>
                        <span>Pass: {quiz.passingPercentage || 40}%</span>
                        {(quiz.requireWebcam || quiz.requireMic || quiz.requireScreenshare) && (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 font-bold border border-rose-100 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
                            <Shield size={10} /> Proctored
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`self-start inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${isLive ? 'bg-success/10 text-success' : 'bg-textMuted/10 text-textMuted'}`}>
                      {isLive ? 'Live' : status === 'ended' ? 'Ended' : 'Not Started'}
                    </span>
                  </div>

                  {isLive ? (
                    <div className="flex flex-col gap-4 pt-3 border-t border-borderCool/60">
                      {quiz.instructions && (
                        <p className="text-xs text-textMuted bg-bgSecondary border border-borderCool/60 rounded-lg p-3 leading-relaxed">{quiz.instructions}</p>
                      )}
                      <div className="flex items-center gap-2 p-3 bg-warning/5 border border-warning/10 rounded-lg text-[11px] text-textMuted leading-relaxed font-medium">
                        <Shield size={13} className="shrink-0 text-warning" />
                        <span>This is a proctored exam. Tab switches, copy/paste, and screenshare stops are monitored. Opens in a secure fullscreen tab.</span>
                      </div>
                      <button className="flex items-center justify-center gap-2 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-lg shadow-sm self-start animate-pulse"
                        onClick={() => window.open(window.location.origin + `?quizTaker=true&quizId=${quiz._id}`, '_blank')}>
                        <PlayCircle size={14} /> Launch Exam
                      </button>
                    </div>
                  ) : status === 'ended' ? (
                    <div className="flex items-center gap-2 p-4 bg-bgSecondary border border-borderCool/60 rounded-xl text-xs text-textMuted pt-3 border-t font-medium">
                      <CheckSquare size={14} /> This exam has ended. Contact your instructor for results.
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-4 bg-bgSecondary border border-borderCool/60 rounded-xl text-xs text-textMuted italic pt-3 border-t font-light">
                      <AlertCircle size={14} /> Waiting for the instructor to start the exam.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DataList>
      </div>
    </div>
  );
}
