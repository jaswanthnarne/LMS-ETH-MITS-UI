import React, { useState } from 'react';
import { PlayCircle, Plus, Trash2, Shield, Eye, BarChart3, Edit2, X, Save, Clock, HelpCircle, Award } from 'lucide-react';
import { Field, Select, DataList, Row, SectionTitle, Modal } from '../../components/Shared';

export default function QuizManagement({ data, forms, setForm, api, action, setState, socket }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [batchFilter, setBatchFilter] = useState('');

  const filteredQuizzes = data.quizzes.filter((quiz) => {
    if (!batchFilter) return true;
    const quizBatchId = quiz.batch?._id || quiz.batch;
    return String(quizBatchId) === String(batchFilter);
  });

  function startCreateQuiz() {
    setForm('quiz', 'title', '');
    setForm('quiz', 'batch', '');
    setForm('quiz', 'durationSeconds', 60);
    setForm('quiz', 'questions', [{ text: '', options: ['', '', '', ''], correctIndex: 0, points: 1 }]);
    setEditingTaskId(null); // Wait, setEditingQuizId is the correct one.
    setEditingQuizId(null);
    setIsModalOpen(true);
  }

  function startEditingQuiz(quiz) {
    setForm('quiz', 'title', quiz.title);
    setForm('quiz', 'batch', quiz.batch?._id || quiz.batch);
    setForm('quiz', 'durationSeconds', quiz.durationSeconds || 60);
    setForm('quiz', 'questions', quiz.questions || [{ text: '', options: ['', '', '', ''], correctIndex: 0, points: 1 }]);
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
                        {quiz.batch ? `${quiz.batch.name}` : 'All'}
                      </span>
                      <span className="flex items-center gap-1">
                        <HelpCircle size={13} /> {quiz.questions?.length || 0} MCQ Questions
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
                      {(data.quizAttempts[quiz._id] || []).map((attempt) => (
                        <Row key={attempt._id} title={attempt.student?.name} meta={`Score: ${attempt.score} points`}>
                          <span className="text-[10px] text-textMuted font-medium">{new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </Row>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DataList>
      </div>

      {/* Quiz editor overlay modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingQuizId ? 'Update Assessment Details' : 'Compile Live MCQ Quiz'}>
        <form className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1.5" onSubmit={handleSubmit}>
          <Field placeholder="Assessment Title" value={forms.quiz.title} onChange={(value) => setForm('quiz', 'title', value)} required />
          
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-textMuted">Assign Batch / Cohort</span>
            <Select
              value={forms.quiz.batch}
              onChange={(value) => setForm('quiz', 'batch', value)}
              options={[['', 'Assign Batch / Cohort'], ...data.batches.map((batch) => [batch._id, batch.name])]}
              required
            />
          </div>
          
          <Field label="Duration (seconds)" type="number" value={forms.quiz.durationSeconds} onChange={(value) => setForm('quiz', 'durationSeconds', Number(value))} />

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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-1">
                  {question.options.map((option, optionIndex) => (
                    <Field
                      key={optionIndex}
                      placeholder={`Option ${optionIndex + 1}`}
                      value={option}
                      onChange={(value) => updateOption(optionIndex, value)(questionIndex)}
                      required
                    />
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-textMuted">Correct Option</span>
                    <Select
                      value={question.correctIndex}
                      onChange={(value) => updateQuestion(questionIndex, 'correctIndex', Number(value))}
                      options={[
                        [0, 'Option 1'],
                        [1, 'Option 2'],
                        [2, 'Option 3'],
                        [3, 'Option 4']
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
