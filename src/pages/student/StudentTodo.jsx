import React, { useState, useEffect } from 'react';
import { ClipboardCheck, BookOpen, Code2, CheckCircle, Circle, Plus, Trash2, Calendar, AlertTriangle, CheckSquare, Square, Info } from 'lucide-react';
import { Field, Select, SectionTitle, DataList } from '../../components/Shared';

export default function StudentTodo({ data, user }) {
  const [activeTab, setActiveTab] = useState('academic'); // 'academic' | 'personal'
  
  // Personal Todo States
  const [todos, setTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState('medium'); // 'high' | 'medium' | 'low'
  const [filterPriority, setFilterPriority] = useState('all'); // 'all' | 'high' | 'medium' | 'low'

  const storageKey = `mits_lms_todo_${user._id}`;

  // Load personal todos on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setTodos(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load personal todos:', err);
    }
  }, [storageKey]);

  // Save personal todos helper
  const saveTodos = (updatedTodos) => {
    setTodos(updatedTodos);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedTodos));
    } catch (err) {
      console.error('Failed to save personal todos:', err);
    }
  };

  // Add personal todo
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const newTodo = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      text: newTodoText.trim(),
      priority: newTodoPriority,
      completed: false,
      createdAt: new Date().toISOString()
    };

    saveTodos([newTodo, ...todos]);
    setNewTodoText('');
    setNewTodoPriority('medium');
  };

  // Toggle personal todo completion
  const handleToggleTodo = (id) => {
    const updated = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos(updated);
  };

  // Delete personal todo
  const handleDeleteTodo = (id) => {
    const updated = todos.filter(todo => todo.id !== id);
    saveTodos(updated);
  };

  // Academic Todos logic
  const tasks = data.tasks || [];
  const submissions = data.submissions || [];
  const leetcodeProblems = data.leetcodeProblems || [];

  // Map Tasks with completion status
  const academicTasks = tasks.map(task => {
    const isCompleted = submissions.some(sub => 
      String(sub.task?._id || sub.task) === String(task._id) && sub.status === 'accepted'
    );
    return {
      id: task._id,
      title: task.title,
      type: 'task',
      points: task.maxScore || 100,
      dueDate: task.dueDate,
      completed: isCompleted,
      rawItem: task
    };
  });

  // Map LeetCode Problems with completion status
  const academicLeetcode = leetcodeProblems.map(prob => {
    // Check problem.submission or fallback to search in data.leetcodeSubmissions
    const submission = prob.submission || (data.leetcodeSubmissions || []).find(sub => 
      String(sub.problem?._id || sub.problem) === String(prob._id)
    );
    const isCompleted = !!submission && submission.status !== 'rejected';

    return {
      id: prob._id,
      title: prob.title,
      type: 'leetcode',
      points: 10,
      dueDate: prob.dueDate,
      completed: isCompleted,
      rawItem: prob
    };
  });

  const allAcademicTodos = [...academicTasks, ...academicLeetcode].sort((a, b) => {
    // Sort uncompleted first, then by due date
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  // Filter personal todos
  const filteredPersonalTodos = todos.filter(todo => {
    if (filterPriority === 'all') return true;
    return todo.priority === filterPriority;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-borderCool">
        <div>
          <h2 className="font-title text-lg font-bold text-textPrimary flex items-center gap-2">
            <ClipboardCheck className="text-primary" size={20} /> My Todo Manager
          </h2>
          <p className="text-xs text-textMuted mt-1">
            Track and complete assigned academic coursework alongside your personal daily tasks.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-1.5 p-1 bg-bgSecondary border border-borderCool rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('academic')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
            activeTab === 'academic'
              ? 'bg-primary text-white shadow-sm'
              : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
          }`}
        >
          <BookOpen size={14} /> Academic Actions ({allAcademicTodos.filter(t => !t.completed).length} pending)
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
            activeTab === 'personal'
              ? 'bg-primary text-white shadow-sm'
              : 'text-textMuted hover:text-textPrimary hover:bg-bgHover/50'
          }`}
        >
          <ClipboardCheck size={14} /> Personal Tasks ({todos.filter(t => !t.completed).length} pending)
        </button>
      </div>

      {/* Academic Todos Tab */}
      {activeTab === 'academic' && (
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-borderCool/60">
            <SectionTitle icon={BookOpen} title="Auto-Synced Coursework Todos" />
            <span className="text-xs font-bold text-textMuted bg-bgPrimary border border-borderCool px-3 py-1 rounded-lg">
              Completed:{' '}
              <span className="text-success font-black">
                {allAcademicTodos.filter(t => t.completed).length}
              </span>{' '}
              / {allAcademicTodos.length}
            </span>
          </div>

          <p className="text-xs text-textMuted leading-relaxed flex items-start gap-1.5 bg-bgPrimary p-3.5 rounded-xl border border-borderCool/60 mb-2">
            <Info size={14} className="text-primary mt-0.5 shrink-0" />
            Academic tasks are automatically updated when you submit solutions. Task items are completed once approved/accepted by the instructor. Leetcode problems are completed upon code link submission.
          </p>

          <DataList emptyText="No assigned coursework or problems found. You're completely up to date!">
            <div className="flex flex-col gap-2.5">
              {allAcademicTodos.map(todo => {
                const isOverdue = todo.dueDate && !todo.completed && new Date() > new Date(todo.dueDate);

                return (
                  <div
                    key={todo.id + '-' + todo.type}
                    className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                      todo.completed
                        ? 'bg-bgPrimary/40 border-borderCool/45 opacity-60'
                        : 'bg-bgPrimary border-borderCool hover:border-primary/20 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Checkbox Visual */}
                      <div className="shrink-0">
                        {todo.completed ? (
                          <CheckCircle className="text-success fill-success/5" size={20} />
                        ) : (
                          <Circle className="text-textMuted" size={20} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0">
                        <strong
                          className={`text-sm font-semibold block truncate ${
                            todo.completed ? 'text-textMuted line-through' : 'text-textPrimary'
                          }`}
                        >
                          {todo.title}
                        </strong>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-textMuted mt-1">
                          {/* Type Badge */}
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              todo.type === 'leetcode'
                                ? 'bg-warning-light text-warning-text border border-warning/10'
                                : 'bg-primary/10 text-primary border border-primary/10'
                            }`}
                          >
                            {todo.type === 'leetcode' ? <Code2 size={10} /> : <BookOpen size={10} />}
                            {todo.type}
                          </span>

                          <span>•</span>

                          {/* Points */}
                          <span className="font-semibold text-textSecondary">
                            {todo.points} pts
                          </span>

                          {todo.dueDate && (
                            <>
                              <span>•</span>
                              <span
                                className={`flex items-center gap-1 font-medium ${
                                  isOverdue ? 'text-danger font-semibold' : ''
                                }`}
                              >
                                <Calendar size={11} />
                                Due: {new Date(todo.dueDate).toLocaleDateString()}
                                {isOverdue && ' (Overdue)'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Completion Info */}
                    <div className="shrink-0 text-right">
                      {todo.completed ? (
                        <span className="text-[11px] font-bold text-success uppercase tracking-wider bg-success-light border border-success/15 px-2.5 py-1 rounded-lg">
                          Completed
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider bg-bgSecondary border border-borderCool px-2.5 py-1 rounded-lg">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </DataList>
        </div>
      )}

      {/* Personal Todos Tab */}
      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Todo Sidebar Form */}
          <div className="lg:col-span-1 flex flex-col gap-4 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm self-start">
            <SectionTitle icon={Plus} title="Add Personal Todo" />
            
            <form onSubmit={handleAddTodo} className="flex flex-col gap-4">
              <Field
                placeholder="What needs to be done?"
                value={newTodoText}
                onChange={setNewTodoText}
                required
              />

              <Select
                label="Task Priority"
                value={newTodoPriority}
                onChange={setNewTodoPriority}
                options={[
                  ['high', '🔴 High Priority'],
                  ['medium', '🟡 Medium Priority'],
                  ['low', '🔵 Low Priority']
                ]}
              />

              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 w-full text-center text-sm font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm transition-colors"
              >
                <Plus size={16} /> Add Task
              </button>
            </form>
          </div>

          {/* Todos List Area */}
          <div className="lg:col-span-2 flex flex-col gap-4 bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-borderCool/60">
              <SectionTitle icon={ClipboardCheck} title="Personal Todo List" />
              
              {/* Priority Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-textMuted shrink-0">Filter:</span>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-bgPrimary border border-borderCool text-textPrimary text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">🔴 High Only</option>
                  <option value="medium">🟡 Medium Only</option>
                  <option value="low">🔵 Low Only</option>
                </select>
              </div>
            </div>

            <DataList emptyText="No personal tasks found. Add one on the left to organize your day.">
              <div className="flex flex-col gap-2">
                {filteredPersonalTodos.map(todo => {
                  const priorityColors = {
                    high: 'bg-danger/10 text-danger border border-danger/25',
                    medium: 'bg-warning-light text-warning-text border border-warning/20',
                    low: 'bg-primary/10 text-primary border border-primary/20'
                  };

                  return (
                    <div
                      key={todo.id}
                      className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                        todo.completed
                          ? 'bg-bgPrimary/40 border-borderCool/45 opacity-60'
                          : 'bg-bgPrimary border-borderCool hover:border-primary/20 shadow-sm'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleTodo(todo.id)}
                        className="flex items-center gap-3.5 min-w-0 flex-1 text-left"
                      >
                        {/* Interactive Checkbox */}
                        <div className="shrink-0">
                          {todo.completed ? (
                            <CheckSquare className="text-success fill-success/5" size={20} />
                          ) : (
                            <Square className="text-textMuted hover:text-primary transition-colors" size={20} />
                          )}
                        </div>

                        {/* Title text */}
                        <div className="min-w-0">
                          <span
                            className={`text-sm font-semibold block truncate ${
                              todo.completed ? 'text-textMuted line-through font-normal' : 'text-textPrimary'
                            }`}
                          >
                            {todo.text}
                          </span>
                          
                          {/* Priority badge */}
                          <span
                            className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1.5 ${
                              priorityColors[todo.priority]
                            }`}
                          >
                            {todo.priority} priority
                          </span>
                        </div>
                      </button>

                      {/* Delete Action button */}
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="p-2 rounded-lg text-textMuted hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </DataList>
          </div>
        </div>
      )}
    </div>
  );
}
