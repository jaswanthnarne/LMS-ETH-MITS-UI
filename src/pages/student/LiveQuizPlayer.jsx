import React from 'react';
import { PlayCircle, Clock, CheckSquare, AlertCircle } from 'lucide-react';
import { Badge, DataList, SectionTitle, Select } from '../../components/Shared';

export default function LiveQuizPlayer({ data, forms, setForm, api, action }) {
  async function submitAttempt(quiz) {
    const answers = quiz.questions.map((_, index) => ({
      questionIndex: index,
      selectedIndex: Number(forms.answer[`${quiz._id}-${index}`] ?? -1)
    }));
    await action(() => api.post(`/api/quiz/${quiz._id}/attempt`, { answers }), 'Quiz answers submitted');
  }

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
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-textMuted mt-1">
                      <span className="font-medium bg-bgSecondary border border-borderCool/60 px-2 py-0.5 rounded text-[10px]">
                        {quiz.batch ? `${quiz.batch.name}` : 'Batch'}
                      </span>
                      <span>{quiz.questions?.length || 0} MCQ Questions</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {quiz.durationSeconds}s limit
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
                
                {/* Body details */}
                {quiz.isLive ? (
                  <div className="flex flex-col gap-5 pt-3 border-t border-borderCool/60">
                    <div className="flex items-center gap-2 p-3.5 bg-warning/10 border border-warning/20 rounded-lg text-xs text-warning-text font-medium leading-relaxed">
                      <Clock size={15} className="shrink-0" />
                      <span>Complete the questions and click submit before the host terminates the test.</span>
                    </div>

                    <div className="flex flex-col gap-4">
                      {quiz.questions.map((item, index) => (
                        <div key={index} className="flex flex-col gap-2 p-4 bg-bgSecondary border border-borderCool/80 rounded-lg">
                          <strong className="text-xs font-semibold text-textPrimary">Q{index + 1}: {item.text}</strong>
                          <Select
                            value={forms.answer[`${quiz._id}-${index}`] ?? ''}
                            onChange={(value) => setForm('answer', `${quiz._id}-${index}`, value)}
                            options={[['', 'Choose Option'], ...item.options.map((option, optionIndex) => [String(optionIndex), option])]}
                            className="max-w-md"
                          />
                        </div>
                      ))}
                    </div>

                    <button 
                      className="flex items-center justify-center gap-2 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-lg shadow-sm self-start mt-2"
                      onClick={() => submitAttempt(quiz)}
                    >
                      <CheckSquare size={14} /> Submit Answers
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-4 bg-bgSecondary border border-borderCool/60 rounded-xl text-xs text-textMuted italic pt-3 border-t">
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
