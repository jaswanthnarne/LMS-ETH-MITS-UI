import React, { useState } from 'react';
import { BookOpen, Plus, Send, Link2, Edit2, Trash2, X, Calendar } from 'lucide-react';
import { Field, TextArea, Select, DataList, SectionTitle, Modal } from '../../components/Shared';

export default function TaskManagement({ data, forms, setForm, api, action }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [batchFilter, setBatchFilter] = useState('');

  function startCreateTask() {
    setForm('task', 'title', '');
    setForm('task', 'batch', '');
    setForm('task', 'dueDate', '');
    setForm('task', 'maxScore', 100);
    setForm('task', 'leetcodeUrl', '');
    setForm('task', 'description', '');
    setEditingTaskId(null);
    setIsModalOpen(true);
  }

  function startEditingTask(task) {
    setForm('task', 'title', task.title);
    setForm('task', 'batch', task.batch?._id || task.batch);
    setForm('task', 'dueDate', task.dueDate ? task.dueDate.slice(0, 10) : '');
    setForm('task', 'maxScore', task.maxScore || 100);
    setForm('task', 'leetcodeUrl', task.leetcodeUrl || '');
    setForm('task', 'description', task.description);
    setEditingTaskId(task._id);
    setIsModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (editingTaskId) {
      await action(
        () => api.patch(`/api/tasks/${editingTaskId}`, forms.task),
        'Task updated successfully'
      );
    } else {
      await action(
        () => api.post('/api/tasks', forms.task),
        'Task published successfully'
      );
    }
    setIsModalOpen(false);
  }

  async function handleDeleteTask(taskId, taskTitle) {
    if (!window.confirm(`Are you sure you want to permanently delete the assignment "${taskTitle}" and all student submissions?`)) return;
    await action(
      () => api.delete(`/api/tasks/${taskId}`),
      'Assignment removed'
    );
  }

  const filteredTasks = data.tasks.filter((task) => {
    if (!batchFilter) return true;
    const taskBatchId = task.batch?._id || task.batch;
    return String(taskBatchId) === String(batchFilter);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-borderCool">
          <div>
            <SectionTitle icon={BookOpen} title="Published Assignment Logs" />
            <p className="text-xs text-textMuted mt-1">
              Create, review and manage assignments for student batches.
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
              className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-lg shadow-sm"
              onClick={startCreateTask}
            >
              <Plus size={15} /> Publish Task
            </button>
          </div>
        </div>

        <DataList emptyText="No tasks published yet. Click 'Publish Task' to assign one to student batches.">
          <div className="grid grid-cols-1 gap-3.5">
            {filteredTasks.map((task) => (
              <div 
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bgPrimary border border-borderCool hover:border-primary/30 rounded-xl p-5 transition-all shadow-sm" 
                key={task._id}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">
                      {task.batch ? `${task.batch.name}` : 'Cohort'}
                    </span>
                    {task.batch?.college && (
                      <span className="text-[10px] font-medium text-textMuted">
                        ({task.batch.college.name})
                      </span>
                    )}
                  </div>
                  <strong className="font-title text-sm font-semibold text-textPrimary block truncate mb-1">{task.title}</strong>
                  <p className="text-xs text-textMuted truncate">{task.description}</p>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end gap-3.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-borderCool/60 w-full md:w-auto">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-textSecondary md:text-right">
                    <span className="font-bold text-textPrimary">{task.maxScore} pts</span>
                    {task.leetcodeUrl && (
                      <a
                        href={task.leetcodeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Link2 size={13} /> LeetCode
                      </a>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={13} className="text-textMuted" />
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Open'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto md:ml-0">
                    <button 
                      className="p-1.5 rounded-lg text-textSecondary hover:bg-bgHover transition-colors"
                      onClick={() => startEditingTask(task)} 
                      title="Edit Assignment"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className="p-1.5 rounded-lg text-danger hover:bg-danger/5 transition-colors"
                      onClick={() => handleDeleteTask(task._id, task.title)} 
                      title="Delete Assignment"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DataList>
      </div>

      {/* Task overlay form modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTaskId ? 'Update Task Details' : 'Publish Learning Assignment'}>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Field placeholder="Task Title" value={forms.task.title} onChange={(value) => setForm('task', 'title', value)} required />
          
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-textMuted">Select Batch / Cohort</span>
            <Select
              value={forms.task.batch}
              onChange={(value) => setForm('task', 'batch', value)}
              options={[['', 'Select Batch / Cohort'], ...data.batches.map((batch) => [batch._id, batch.name])]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Due Date" type="date" value={forms.task.dueDate} onChange={(value) => setForm('task', 'dueDate', value)} />
            <Field label="Max Points" type="number" value={forms.task.maxScore} onChange={(value) => setForm('task', 'maxScore', Number(value))} />
          </div>

          <Field
            placeholder="Leetcode Problem URL (optional)"
            value={forms.task.leetcodeUrl || ''}
            onChange={(value) => setForm('task', 'leetcodeUrl', value)}
          />

          <TextArea placeholder="Outline clear instructions, resources, and expectations..." value={forms.task.description} onChange={(value) => setForm('task', 'description', value)} required />
          
          <button className="flex items-center justify-center gap-2 w-full text-center text-sm font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm">
            <Send size={16} /> {editingTaskId ? 'Save Assignment' : 'Publish Assignment'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
