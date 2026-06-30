import React, { useState } from 'react';
import { PlayCircle, Plus, Trash2, Shield, Eye, BarChart3, Edit2, X, Save, Clock, HelpCircle, Award } from 'lucide-react';
import { Field, Select, DataList, Row, SectionTitle, Modal } from '../../components/Shared';

export default function QuizManagement({ data, forms, setForm, api, action, setState, socket }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [batchFilter, setBatchFilter] = useState('');

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
      if (quiz.isLive) {
        socket.emit('join-quiz', quiz._id);
      }
    });

    socket.on('quiz-student-status', handleQuizStudentStatus);
    return () => {
      socket.off('quiz-student-status', handleQuizStudentStatus);
    };
  }, [socket, data.quizzes]);

  const filteredQuizzes = data.quizzes.filter((quiz) => {
    if (!batchFilter) return true;
    const quizBatchId = quiz.batch?._id || quiz.batch;
    const quizBatches = quiz.batches || [];
    return String(quizBatchId) === String(batchFilter) || quizBatches.some(b => String(b?._id || b) === String(batchFilter));
  });

  function downloadExcelTemplate() {
    import('xlsx').then((XLSX) => {
      const headers = [
        ['Question Text', 'Question Type', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Points', 'Difficulty'],
        ['What is the capital of India?', 'single_correct', 'New Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'New Delhi', '5', 'easy'],
        ['React is a backend framework.', 'true_false', '', '', '', '', 'False', '5', 'medium'],
        ['Write the capital of France.', 'fill_blank', '', '', '', '', 'Paris', '5', 'easy'],
        ['What is 5 + 10?', 'numeric', '', '', '', '', '15', '5', 'easy']
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(headers);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Questions Template');
      XLSX.writeFile(wb, 'quiz_questions_import_template.xlsx');
    });
  }

  function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    import('xlsx').then((XLSX) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const parsedQuestions = [];
          
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const text = String(row[0] || '').trim();
            const rawType = String(row[1] || '').trim().toLowerCase();
            const optA = String(row[2] || '').trim();
            const optB = String(row[3] || '').trim();
            const optC = String(row[4] || '').trim();
            const optD = String(row[5] || '').trim();
            const correctAnswer = String(row[6] || '').trim();
            const points = Number(row[7]) || 1;

            if (!text) continue;

            // Normalize type
            let type = 'single_correct';
            if (['true_false', 'true/false', 'tf'].includes(rawType)) {
              type = 'true_false';
            } else if (['fill_blank', 'fill', 'fib'].includes(rawType)) {
              type = 'fill_blank';
            } else if (['numeric', 'number'].includes(rawType)) {
              type = 'numeric';
            }

            let options = [];
            let correctIndex = 0;
            let correctAnswerText = '';

            if (type === 'single_correct') {
              options = [optA, optB, optC, optD].filter(Boolean);
              if (options.length < 2) continue; // Skip invalid
              
              // Find matching correctIndex
              const normAns = correctAnswer.toUpperCase();
              if (normAns === 'A' || normAns === 'OPTION A') correctIndex = 0;
              else if (normAns === 'B' || normAns === 'OPTION B') correctIndex = 1;
              else if (normAns === 'C' || normAns === 'OPTION C') correctIndex = 2;
              else if (normAns === 'D' || normAns === 'OPTION D') correctIndex = 3;
              else {
                const matchedIdx = options.findIndex(opt => opt.toLowerCase() === correctAnswer.toLowerCase());
                correctIndex = matchedIdx !== -1 ? matchedIdx : 0;
              }
            } else if (type === 'true_false') {
              options = ['True', 'False'];
              const normTF = correctAnswer.toLowerCase();
              if (normTF === 'true' || normTF === 't' || normTF === 'yes' || normTF === 'y' || normTF === 'a') {
                correctIndex = 0;
              } else {
                correctIndex = 1;
              }
            } else {
              correctAnswerText = correctAnswer;
            }

            parsedQuestions.push({
              text,
              type,
              options,
              correctIndex,
              correctAnswerText,
              points
            });
          }

          if (parsedQuestions.length === 0) {
            alert('No valid questions could be parsed from the file.');
            return;
          }

          // Populate quiz form
          setForm('quiz', 'questions', parsedQuestions);
          alert(`Successfully parsed and loaded ${parsedQuestions.length} questions from Excel!`);
        } catch (err) {
          alert('Failed to parse Excel file: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function startCreateQuiz() {
    setForm('quiz', 'title', '');
    setForm('quiz', 'department', '');
    setForm('quiz', 'batch', '');
    setForm('quiz', 'batches', []);
    setForm('quiz', 'durationSeconds', 60);
    setForm('quiz', 'questions', [{ text: '', options: ['', '', '', ''], correctIndex: 0, points: 1 }]);
    setForm('quiz', 'requireWebcam', false);
    setForm('quiz', 'requireMic', false);
    setForm('quiz', 'requireScreenshare', false);
    setForm('quiz', 'shuffleQuestions', false);
    setEditingQuizId(null);
    setIsModalOpen(true);
  }

  function startEditingQuiz(quiz) {
    setForm('quiz', 'title', quiz.title);
    setForm('quiz', 'department', quiz.department || '');
    setForm('quiz', 'batch', quiz.batch?._id || quiz.batch);
    setForm('quiz', 'batches', quiz.batches || (quiz.batch ? [quiz.batch?._id || quiz.batch] : []));
    setForm('quiz', 'durationSeconds', quiz.durationSeconds || 60);
    setForm('quiz', 'questions', quiz.questions || [{ text: '', options: ['', '', '', ''], correctIndex: 0, points: 1 }]);
    setForm('quiz', 'requireWebcam', quiz.requireWebcam || false);
    setForm('quiz', 'requireMic', quiz.requireMic || false);
    setForm('quiz', 'requireScreenshare', quiz.requireScreenshare || false);
    setForm('quiz', 'shuffleQuestions', quiz.shuffleQuestions || false);
    setEditingQuizId(quiz._id);
    setIsModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (editingQuizId) {
      await action(
        () => api.patch(`/api/quiz/${editingQuizId}`, forms.quiz),
        'Quiz updated successfully'
      );
    } else {
      await action(
        () => api.post('/api/quiz', forms.quiz),
        'Quiz assessment created'
      );
    }
    setIsModalOpen(false);
  }

  async function handleDeleteQuiz(quizId, quizTitle) {
    if (!window.confirm(`Are you sure you want to permanently delete the quiz "${quizTitle}" and all student attempt logs?`)) return;
    await action(
      () => api.delete(`/api/quiz/${quizId}`),
      'Quiz assessment removed'
    );
  }

  function updateQuestion(index, key, value) {
    const questions = forms.quiz.questions.map((question, questionIndex) => (
      questionIndex === index ? { ...question, [key]: value } : question
    ));
    setForm('quiz', 'questions', questions);
  }

  function updateOption(index, value) {
    return (questionIndex) => {
      const question = forms.quiz.questions[questionIndex];
      const options = [...question.options];
      options[index] = value;
      updateQuestion(questionIndex, 'options', options);
    };
  }

  function addQuestion() {
    setForm('quiz', 'questions', [
      ...forms.quiz.questions,
      { text: '', options: ['', '', '', ''], correctIndex: 0, points: 1 }
    ]);
  }

  function removeQuestion(index) {
    if (forms.quiz.questions.length === 1) return;
    setForm('quiz', 'questions', forms.quiz.questions.filter((_, questionIndex) => questionIndex !== index));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-borderCool">
          <div>
            <SectionTitle icon={Shield} title="Live Assessment Control Room" />
            <p className="text-xs text-textMuted mt-1">
              Create and manage live MCQ quizzes and view student real-time scoreboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data.batches?.length > 0 && (
              <Select
                value={batchFilter}
                onChange={setBatchFilter}
                options={[['', 'All Cohorts / Batches'], ...data.batches.map(b => [b._id, b.name])]}
                className="w-full sm:w-[200px]"
              />
            )}
            <button 
              className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-4 py-2.5 rounded-lg shadow-sm"
              onClick={downloadExcelTemplate}
              type="button"
            >
              Download Template
            </button>
            <label className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-4 py-2.5 rounded-lg shadow-sm cursor-pointer">
              Import Paper
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                onChange={handleExcelImport} 
              />
            </label>
            <button 
              className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-lg shadow-sm shrink-0"
              onClick={startCreateQuiz}
            >
              <Plus size={15} /> Create Quiz
            </button>
          </div>
        </div>

        <DataList emptyText="No assessments configured. Click 'Create Quiz' to compile your first live quiz.">
          <div className="grid grid-cols-1 gap-4">
            {filteredQuizzes.map((quiz) => (
              <div 
                className="bg-bgPrimary border border-borderCool hover:border-primary/20 rounded-xl p-5 shadow-sm flex flex-col gap-4 transition-colors" 
                key={quiz._id}
              >
                {/* Quiz Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-title text-sm font-semibold text-textPrimary truncate">{quiz.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-textMuted mt-1">
                      <span className="font-medium bg-bgSecondary border border-borderCool/60 px-2 py-0.5 rounded text-[10px]">
                        {quiz.batches && quiz.batches.length > 0 
                          ? quiz.batches.map(b => b.name).join(', ') 
                          : quiz.batch ? `${quiz.batch.name}` : 'All'}
                      </span>
                      {quiz.department && (
                        <span className="font-bold bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] uppercase">
                          Dept: {quiz.department}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <HelpCircle size={13} /> {quiz.questions?.length || 0} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {quiz.durationSeconds}s duration
                      </span>
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

                {/* Control Actions Row */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-borderCool/60">
                  <button
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all ${
                      quiz.isLive 
                        ? 'bg-warning text-white hover:bg-warning/90' 
                        : 'bg-primary text-white hover:bg-primary/95 shadow-sm'
                    }`}
                    onClick={() => action(async () => {
                      const updated = await api.patch(`/api/quiz/${quiz._id}/live`, { isLive: !quiz.isLive });
                      socket.emit('quiz-host-update', { batch: quiz.batch?._id || quiz.batch, title: updated.title, isLive: updated.isLive });
                    }, `Quiz is now ${quiz.isLive ? 'Draft' : 'Live'}`)}
                  >
                    <Eye size={13} /> {quiz.isLive ? 'Stop Test' : 'Launch Test'}
                  </button>

                  <button
                    className="flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-3.5 py-2 rounded-lg"
                    onClick={async () => {
                      const attempts = await api.get(`/api/quiz/${quiz._id}/attempts`);
                      setState((current) => ({ ...current, quizAttempts: { ...current.quizAttempts, [quiz._id]: attempts } }));
                    }}
                  >
                    <BarChart3 size={13} /> View Scores
                  </button>

                  <button
                    className="flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-3.5 py-2 rounded-lg"
                    onClick={() => startEditingQuiz(quiz)}
                    title="Edit Quiz details"
                  >
                    <Edit2 size={13} /> Edit
                  </button>

                  <button
                    className="flex items-center gap-1.5 text-xs font-semibold bg-danger-light text-danger hover:bg-danger/10 px-3.5 py-2 rounded-lg ml-auto"
                    onClick={() => handleDeleteQuiz(quiz._id, quiz.title)}
                    title="Delete Quiz"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>

                {/* Optional Scoreboard Results */}
                {(data.quizAttempts[quiz._id] || []).length > 0 && (
                  <div className="bg-bgSecondary border border-borderCool/60 rounded-xl p-4 mt-2">
                    <h4 className="font-title text-xs font-bold text-textPrimary flex items-center gap-1.5 mb-3">
                      <Award size={14} className="text-warning" /> Student Scoreboard
                    </h4>
                    <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {(data.quizAttempts[quiz._id] || []).map((attempt) => {
                        const totalViolations = (attempt.violations?.tabSwitches || 0) + 
                                                (attempt.violations?.windowBlurs || 0) + 
                                                (attempt.violations?.fullScreenExits || 0);
                        const isViolated = attempt.status === 'violated' || totalViolations >= 3;
                        return (
                          <Row 
                            key={attempt._id} 
                            title={attempt.student?.name} 
                            meta={`Score: ${attempt.score} pts`}
                          >
                            <div className="flex items-center gap-2 text-[10px]">
                              {totalViolations > 0 && (
                                <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                  isViolated ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                                }`}>
                                  {totalViolations} Warnings
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
            ))}
          </div>
        </DataList>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingQuizId ? 'Update Assessment Details' : 'Compile Live MCQ Quiz'}>
        <form className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1.5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Assessment Title" placeholder="Assessment Title" value={forms.quiz.title} onChange={(value) => setForm('quiz', 'title', value)} required />
            <Field label="Department / Division" placeholder="Department (e.g. CSE, ECE)" value={forms.quiz.department || ''} onChange={(value) => setForm('quiz', 'department', value)} required />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-textMuted">Assign Batches / Cohorts</span>
            <div className="grid grid-cols-2 gap-2 border border-borderCool p-3 rounded-lg max-h-[120px] overflow-y-auto bg-bgPrimary">
              {data.batches.map((batch) => {
                const isChecked = (forms.quiz.batches || []).includes(batch._id);
                return (
                  <label key={batch._id} className="flex items-center gap-2 text-xs text-textPrimary cursor-pointer hover:text-primary transition-colors">
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const current = forms.quiz.batches || [];
                        const next = e.target.checked 
                          ? [...current, batch._id]
                          : current.filter(id => id !== batch._id);
                        setForm('quiz', 'batches', next);
                        setForm('quiz', 'batch', next[0] || '');
                      }}
                      className="rounded border-borderCool text-primary focus:ring-primary"
                    />
                    {batch.name}
                  </label>
                );
              })}
            </div>
          </div>
          
          <Field label="Duration (seconds)" type="number" value={forms.quiz.durationSeconds} onChange={(value) => setForm('quiz', 'durationSeconds', Number(value))} />
          
          {/* Proctoring Configuration */}
          <div className="flex flex-col gap-3 p-4 bg-bgSecondary border border-borderCool rounded-lg">
            <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} className="text-primary" /> Proctoring & Integrity Config
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-textPrimary cursor-pointer">
                <input 
                  type="checkbox"
                  checked={forms.quiz.requireWebcam || false}
                  onChange={(e) => setForm('quiz', 'requireWebcam', e.target.checked)}
                  className="rounded border-borderCool text-primary focus:ring-primary"
                />
                Require Webcam
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-textPrimary cursor-pointer">
                <input 
                  type="checkbox"
                  checked={forms.quiz.requireMic || false}
                  onChange={(e) => setForm('quiz', 'requireMic', e.target.checked)}
                  className="rounded border-borderCool text-primary focus:ring-primary"
                />
                Require Microphone
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-textPrimary cursor-pointer">
                <input 
                  type="checkbox"
                  checked={forms.quiz.requireScreenshare || false}
                  onChange={(e) => setForm('quiz', 'requireScreenshare', e.target.checked)}
                  className="rounded border-borderCool text-primary focus:ring-primary"
                />
                Require Screenshare
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-textPrimary cursor-pointer">
                <input 
                  type="checkbox"
                  checked={forms.quiz.shuffleQuestions || false}
                  onChange={(e) => setForm('quiz', 'shuffleQuestions', e.target.checked)}
                  className="rounded border-borderCool text-primary focus:ring-primary"
                />
                Shuffle Questions
              </label>
            </div>
          </div>

          {/* Question Editor Section */}
          <div className="flex flex-col gap-3 mt-2">
            <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider">Questions Config</h4>
            
            {forms.quiz.questions.map((question, questionIndex) => (
              <div 
                className="flex flex-col gap-3 border border-borderCool bg-bgPrimary p-4 rounded-lg relative" 
                key={questionIndex}
              >
                <div className="flex justify-between items-center pb-2 border-b border-borderCool/60">
                  <strong className="text-xs font-bold text-textPrimary">Question #{questionIndex + 1}</strong>
                  {forms.quiz.questions.length > 1 && (
                    <button 
                      type="button" 
                      className="text-[11px] font-semibold text-danger hover:underline" 
                      onClick={() => removeQuestion(questionIndex)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <Field 
                  placeholder="Question statement..." 
                  value={question.text} 
                  onChange={(value) => updateQuestion(questionIndex, 'text', value)} 
                  required 
                />
                
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <span className="text-xs font-medium text-textMuted">Question Type</span>
                    <Select
                      value={question.type || 'single_correct'}
                      onChange={(value) => updateQuestion(questionIndex, 'type', value)}
                      options={[
                        ['single_correct', 'MCQ / Single Correct'],
                        ['true_false', 'True / False'],
                        ['fill_blank', 'Fill in the Blank'],
                        ['numeric', 'Numeric / Value']
                      ]}
                    />
                  </div>
                  <Field 
                    label="Points Allocation" 
                    type="number" 
                    min="1" 
                    value={question.points} 
                    onChange={(value) => updateQuestion(questionIndex, 'points', Number(value))} 
                  />
                </div>

                {/* Conditional Inputs based on Question Type */}
                {(question.type === 'single_correct' || !question.type) && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-1">
                      {question.options?.map((option, optionIndex) => (
                        <Field
                          key={optionIndex}
                          placeholder={`Option ${optionIndex + 1}`}
                          value={option}
                          onChange={(value) => updateOption(optionIndex, value)(questionIndex)}
                          required
                        />
                      )) || (
                        ['', '', '', ''].map((option, optionIndex) => (
                          <Field
                            key={optionIndex}
                            placeholder={`Option ${optionIndex + 1}`}
                            value={option}
                            onChange={(value) => updateOption(optionIndex, value)(questionIndex)}
                            required
                          />
                        ))
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-textMuted">Correct Option</span>
                      <Select
                        value={question.correctIndex}
                        onChange={(value) => updateQuestion(questionIndex, 'correctIndex', Number(value))}
                        options={[
                          [0, 'Option A / 1'],
                          [1, 'Option B / 2'],
                          [2, 'Option C / 3'],
                          [3, 'Option D / 4']
                        ]}
                      />
                    </div>
                  </>
                )}

                {question.type === 'true_false' && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-textMuted">Correct Answer</span>
                    <Select
                      value={question.correctIndex}
                      onChange={(value) => updateQuestion(questionIndex, 'correctIndex', Number(value))}
                      options={[
                        [0, 'True'],
                        [1, 'False']
                      ]}
                    />
                  </div>
                )}

                {(question.type === 'fill_blank' || question.type === 'numeric') && (
                  <Field
                    label="Expected Correct Answer"
                    placeholder="Type the exact expected answer..."
                    value={question.correctAnswerText || ''}
                    onChange={(value) => updateQuestion(questionIndex, 'correctAnswerText', value)}
                    required
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-borderCool">
            <button 
              type="button" 
              className="w-full text-center text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-textMuted text-textPrimary py-2 rounded-lg hover:bg-bgHover transition-colors" 
              onClick={addQuestion}
            >
              + Add Another Question
            </button>
            <button className="flex items-center justify-center gap-2 w-full text-center text-sm font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm">
              <PlayCircle size={16} /> {editingQuizId ? 'Save Assessment Details' : 'Compile Assessment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
