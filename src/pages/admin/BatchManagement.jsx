import React, { useState, useEffect } from 'react';
import { Users, Plus, Award, ArrowLeft, Upload, UserPlus, List, Edit2, Trash2, Save, X, Key, GraduationCap, Eye, Briefcase, BookOpen } from 'lucide-react';
import { Field, TextArea, Select, DataList, SectionTitle, Modal } from '../../components/Shared';

export default function BatchManagement({ data, forms, setForm, api, action }) {
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [selectedStudentForView, setSelectedStudentForView] = useState(null);
  const [manualStudent, setManualStudent] = useState({ name: '', email: '', rollNumber: '', phone: '' });
  const [bulkText, setBulkText] = useState('');
  const [importNotice, setImportNotice] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('mits@3!');
  const [validatedStudents, setValidatedStudents] = useState([]);
  const [leaderboardStats, setLeaderboardStats] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    async function loadLeaderboard() {
      if (!selectedBatchId) {
        setLeaderboardStats([]);
        return;
      }
      setLoadingLeaderboard(true);
      try {
        const res = await api.get(`/api/analytics/leaderboard?batchId=${selectedBatchId}`);
        if (res && res.leaderboard) {
          setLeaderboardStats(res.leaderboard);
        }
      } catch (err) {
        console.error('Error fetching leaderboard inside BatchManagement:', err);
      } finally {
        setLoadingLeaderboard(false);
      }
    }
    loadLeaderboard();
  }, [selectedBatchId, api]);

  const selectedStudentStats = selectedStudentForView
    ? leaderboardStats.find(x => String(x.student?._id) === String(selectedStudentForView._id))
    : null;
  
  // Modals Open State
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);
  const [isCreateCollegeOpen, setIsCreateCollegeOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Editing Batch State
  const [isEditingBatch, setIsEditingBatch] = useState(false);
  const [editBatchData, setEditBatchData] = useState({ name: '', mentor: '', startDate: '', description: '', college: '' });

  const selectedBatch = data.batches.find((b) => b._id === selectedBatchId);

  function startEditingBatch() {
    if (!selectedBatch) return;
    setEditBatchData({
      name: selectedBatch.name || '',
      mentor: selectedBatch.mentor || '',
      startDate: selectedBatch.startDate ? selectedBatch.startDate.slice(0, 10) : '',
      description: selectedBatch.description || '',
      college: selectedBatch.college?._id || selectedBatch.college || ''
    });
    setIsEditingBatch(true);
  }

  async function handleSaveBatchEdit(event) {
    event.preventDefault();
    await action(
      () => api.patch(`/api/batches/${selectedBatchId}`, editBatchData),
      'Cohort metadata updated successfully'
    );
    setIsEditingBatch(false);
  }

  async function handleDeleteBatch() {
    if (!window.confirm(`Are you sure you want to permanently delete the cohort "${selectedBatch.name}"? This cannot be undone.`)) return;
    await action(
      () => api.delete(`/api/batches/${selectedBatchId}`),
      'Cohort permanently removed'
    );
    setSelectedBatchId(null);
    setIsEditingBatch(false);
  }

  async function handleRemoveStudent(studentId, studentName) {
    if (!window.confirm(`Remove ${studentName} from this cohort?`)) return;
    await action(
      () => api.delete(`/api/batches/${selectedBatchId}/students/${studentId}`),
      'Student removed from batch successfully'
    );
  }

  async function handleResetPassword(studentId, studentName) {
    const newPassword = window.prompt(`Enter new password for ${studentName}:`, 'mits123');
    if (newPassword === null) return; // User cancelled
    if (newPassword.trim().length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    await action(
      () => api.post(`/api/auth/reset-password/${studentId}`, { newPassword: newPassword.trim() }),
      `Password reset successfully for ${studentName}`
    );
  }

  async function handleAddStudent(event) {
    event.preventDefault();
    if (!selectedBatchId) return;
    await action(
      () => api.post(`/api/batches/${selectedBatchId}/students`, manualStudent),
      'Student added manually successfully'
    );
    setManualStudent({ name: '', email: '', rollNumber: '', phone: '' });
    setIsAddStudentOpen(false);
  }

  function downloadCSVTemplate() {
    const headers = "Name,Email,RollNumber,Phone\nSaran,saran@mits.edu,22MITS02,9876543211\n";
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "mits_student_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    setImportNotice('Reading file...');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const parsedStudents = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        parsedStudents.push({
          name: parts[0]?.trim() || '',
          email: parts[1]?.trim() || '',
          rollNumber: parts[2]?.trim() || '',
          phone: parts[3]?.trim() || ''
        });
      }
      
      if (parsedStudents.length === 0) {
        setImportNotice('No student records found in the uploaded file.');
        return;
      }
      
      setImportNotice(`Validating ${parsedStudents.length} records with database...`);
      try {
        const validationResult = await api.post(`/api/batches/${selectedBatchId}/students/validate-import`, {
          students: parsedStudents
        });
        setValidatedStudents(validationResult);
        setImportNotice('');
      } catch (err) {
        setImportNotice(`Validation failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  async function handleConfirmImport(event) {
    event.preventDefault();
    const validStudents = validatedStudents.filter(s => s.isValid);
    if (validStudents.length === 0) return;
    
    setImportNotice(`Importing ${validStudents.length} students...`);
    await action(
      () => api.post(`/api/batches/${selectedBatchId}/students/bulk`, {
        students: validStudents,
        defaultPassword
      }),
      `Successfully imported ${validStudents.length} students`
    );
    setValidatedStudents([]);
    setImportNotice('');
    setIsBulkImportOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. MAIN BATCHES LIST VIEW */}
      {!selectedBatch ? (
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-borderCool">
            <div>
              <SectionTitle icon={Award} title="Active Learning Cohorts" />
              <p className="text-xs text-textMuted mt-1">
                Configure your active learning batches and onboard students.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-textMuted text-textPrimary px-3 py-2 rounded-lg hover:bg-bgHover transition-colors" 
                onClick={() => setIsCreateCollegeOpen(true)}
              >
                <Plus size={15} /> Create College
              </button>
              <button 
                className="flex items-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-3.5 py-2 rounded-lg shadow-sm"
                onClick={() => setIsCreateBatchOpen(true)}
              >
                <Plus size={15} /> Create Batch
              </button>
            </div>
          </div>
          
          <DataList emptyText="No cohorts configured yet. Set up the first batch to start onboarding.">
            <div className="grid grid-cols-1 gap-3">
              {data.batches.map((batch) => (
                <div
                  className="flex items-center justify-between gap-4 bg-bgPrimary border border-borderCool hover:border-primary/30 rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all"
                  key={batch._id}
                  onClick={() => setSelectedBatchId(batch._id)}
                >
                  <div className="min-w-0 flex-1">
                    <strong className="text-sm font-semibold text-textPrimary block truncate">{batch.name}</strong>
                    <small className="text-[11px] text-textMuted block mt-1 truncate">
                      Code: <code className="bg-bgSecondary px-1.5 py-0.5 rounded border border-borderCool/60 text-textSecondary font-mono">{batch.code}</code>
                      <span className="mx-2">•</span> Mentor: {batch.mentor}
                      {batch.college && (
                        <>
                          <span className="mx-2">•</span> College: {batch.college.name}
                        </>
                      )}
                    </small>
                  </div>
                  <div className="text-right shrink-0">
                    <strong className="text-xs font-bold text-textPrimary bg-bgSecondary border border-borderCool px-2.5 py-1 rounded-full">{batch.students?.length || 0} students</strong>
                    <span className="block text-[10px] font-bold text-primary mt-1.5 hover:underline">
                      Manage Students →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </DataList>
        </div>
      ) : (
        /* 2. COHORT TRACKER / STUDENTS VIEW */
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
          {/* Header Action Row */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 mb-5 border-b border-borderCool">
            <div>
              <button 
                className="flex items-center gap-1 text-xs font-semibold text-textMuted hover:text-textPrimary mb-2 transition-colors"
                onClick={() => { setSelectedBatchId(null); setIsEditingBatch(false); }}
              >
                <ArrowLeft size={14} /> Back to Cohorts
              </button>
              <SectionTitle icon={GraduationCap} title={`Cohort Tracker: ${selectedBatch.name}`} />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button 
                className="flex items-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-3.5 py-2.5 rounded-lg shadow-sm"
                onClick={() => setIsAddStudentOpen(true)}
              >
                <UserPlus size={15} /> Add Student
              </button>
              <button 
                className="flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-3 py-2.5 rounded-lg"
                onClick={downloadCSVTemplate}
                title="Download CSV Template for Bulk Student Onboarding"
              >
                <Upload size={15} className="rotate-180" /> Template
              </button>
              <button 
                className="flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-3 py-2.5 rounded-lg"
                onClick={() => setIsBulkImportOpen(true)}
              >
                <Upload size={15} /> Bulk Import
              </button>
              <button 
                className="flex items-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-3 py-2.5 rounded-lg"
                onClick={startEditingBatch}
                title="Edit Batch Info"
              >
                <Edit2 size={14} /> Edit Details
              </button>
              <button 
                className="flex items-center gap-1.5 text-xs font-semibold bg-danger-light text-danger hover:bg-danger/10 px-3 py-2.5 rounded-lg transition-colors"
                onClick={handleDeleteBatch}
                title="Delete Cohort"
              >
                <Trash2 size={14} /> Delete Batch
              </button>
            </div>
          </div>

          {/* Student Table */}
          <div className="border border-borderCool rounded-lg overflow-hidden">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[750px] divide-y divide-borderCool">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3.5 bg-bgPrimary text-xs font-bold text-textMuted uppercase tracking-wider">
                  <span className="col-span-2">Name</span>
                  <span className="col-span-3">Email</span>
                  <span className="col-span-2">Roll Number</span>
                  <span className="col-span-2">Overall Score</span>
                  <span className="col-span-2">Present Days</span>
                  <span className="col-span-1 text-right">Actions</span>
                </div>
                
                {/* Table Body */}
                {(!selectedBatch.students || selectedBatch.students.length === 0) ? (
                  <div className="text-center py-12 text-sm text-textMuted">
                    No students enrolled in this batch yet. Click "+ Add Student" or "Bulk Import" to start.
                  </div>
                ) : (
                  selectedBatch.students.map((student) => {
                    const stats = leaderboardStats.find(x => String(x.student?._id) === String(student._id));
                    const score = stats ? stats.overallScore : 0;
                    const presentDays = stats ? (stats.attendanceMarks / 10) : 0;

                    return (
                      <div 
                        key={student._id} 
                        className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-bgHover/40 transition-colors"
                      >
                        <strong className="col-span-2 text-sm font-semibold text-textPrimary truncate">{student.name}</strong>
                        <span className="col-span-3 text-sm text-textSecondary truncate">{student.email}</span>
                        <span className="col-span-2 text-sm text-textSecondary font-mono">{student.rollNumber || '-'}</span>
                        <span className="col-span-2 text-sm font-bold text-primary">
                          {loadingLeaderboard ? (
                            <span className="inline-block w-8 h-4 bg-borderCool/60 animate-pulse rounded" />
                          ) : (
                            `${score} pts`
                          )}
                        </span>
                        <span className="col-span-2 text-sm font-bold text-success">
                          {loadingLeaderboard ? (
                            <span className="inline-block w-8 h-4 bg-borderCool/60 animate-pulse rounded" />
                          ) : (
                            `${presentDays} days`
                          )}
                        </span>
                        <div className="col-span-1 flex items-center justify-end gap-3">
                          <button
                            className="p-1 rounded-lg text-textMuted hover:text-primary hover:bg-primary/5 transition-colors"
                            onClick={() => setSelectedStudentForView(student)}
                            title="View Student Profile Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="p-1 rounded-lg text-primary hover:bg-primary/5 transition-colors"
                            onClick={() => handleResetPassword(student._id, student.name)}
                            title="Reset Student Password"
                          >
                            <Key size={14} />
                          </button>
                          <button
                            className="p-1 rounded-lg text-danger hover:bg-danger/5 transition-colors"
                            onClick={() => handleRemoveStudent(student._id, student.name)}
                            title="Remove Student from Batch"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODALS OVERLAYS */}
      
      {/* Create Batch Modal */}
      <Modal isOpen={isCreateBatchOpen} onClose={() => setIsCreateBatchOpen(false)} title="Create New Cohort Batch">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            action(() => api.post('/api/batches', forms.batch), 'Batch created successfully');
            setIsCreateBatchOpen(false);
          }}
        >
          <Field placeholder="Cohort Name" value={forms.batch.name} onChange={(value) => setForm('batch', 'name', value)} required />
          <Field placeholder="Batch Access Code" value={forms.batch.code} onChange={(value) => setForm('batch', 'code', value.toUpperCase())} required />
          <Field placeholder="Assign Mentor" value={forms.batch.mentor} onChange={(value) => setForm('batch', 'mentor', value)} />
          <Field label="Start Date" type="date" value={forms.batch.startDate} onChange={(value) => setForm('batch', 'startDate', value)} />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-textMuted">Select College</span>
            <Select 
              value={forms.batch.college || ''} 
              onChange={(value) => setForm('batch', 'college', value)} 
              options={[['', 'Select College'], ...(data.colleges || []).map(c => [c._id, `${c.name} (${c.code})`])]} 
            />
          </div>
          <TextArea placeholder="Provide a brief cohort description..." value={forms.batch.description} onChange={(value) => setForm('batch', 'description', value)} />
          <button className="flex items-center justify-center gap-2 w-full text-center text-sm font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm">
            <Users size={16} /> Register Cohort
          </button>
        </form>
      </Modal>

      {/* Create College Modal */}
      <Modal isOpen={isCreateCollegeOpen} onClose={() => setIsCreateCollegeOpen(false)} title="Create New College">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            action(() => api.post('/api/colleges', forms.college), 'College created successfully');
            setIsCreateCollegeOpen(false);
          }}
        >
          <Field placeholder="College Name" value={forms.college.name} onChange={(value) => setForm('college', 'name', value)} required />
          <Field placeholder="College Code (e.g. MITS)" value={forms.college.code} onChange={(value) => setForm('college', 'code', value.toUpperCase())} required />
          <button className="flex items-center justify-center gap-2 w-full text-center text-sm font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm">
            <Plus size={16} /> Create College
          </button>
        </form>
      </Modal>

      {/* Edit Batch Modal */}
      <Modal isOpen={isEditingBatch} onClose={() => setIsEditingBatch(false)} title="Update Cohort Details">
        <form onSubmit={handleSaveBatchEdit} className="flex flex-col gap-4">
          <Field label="Batch Name" value={editBatchData.name} onChange={(val) => setEditBatchData(prev => ({ ...prev, name: val }))} required />
          <Field label="Mentor Name" value={editBatchData.mentor} onChange={(val) => setEditBatchData(prev => ({ ...prev, mentor: val }))} />
          <Field label="Start Date" type="date" value={editBatchData.startDate} onChange={(val) => setEditBatchData(prev => ({ ...prev, startDate: val }))} />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-textMuted">Select College</span>
            <Select 
              value={editBatchData.college || ''} 
              onChange={(val) => setEditBatchData(prev => ({ ...prev, college: val }))} 
              options={[['', 'Select College'], ...(data.colleges || []).map(c => [c._id, `${c.name} (${c.code})`])]} 
            />
          </div>
          <TextArea label="Description" value={editBatchData.description} onChange={(val) => setEditBatchData(prev => ({ ...prev, description: val }))} />
          <button className="flex items-center justify-center gap-2 w-full text-center text-sm font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm">
            <Save size={14} /> Save Details
          </button>
        </form>
      </Modal>

      {/* Add Student Manually Modal */}
      <Modal isOpen={isAddStudentOpen} onClose={() => setIsAddStudentOpen(false)} title="Add Student Manually">
        <form className="flex flex-col gap-4" onSubmit={handleAddStudent}>
          <Field placeholder="Full Name" value={manualStudent.name} onChange={(val) => setManualStudent(prev => ({ ...prev, name: val }))} required />
          <Field type="email" placeholder="Email Address" value={manualStudent.email} onChange={(val) => setManualStudent(prev => ({ ...prev, email: val }))} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field placeholder="Roll Number" value={manualStudent.rollNumber} onChange={(val) => setManualStudent(prev => ({ ...prev, rollNumber: val }))} />
            <Field placeholder="Phone Number" value={manualStudent.phone} onChange={(val) => setManualStudent(prev => ({ ...prev, phone: val }))} />
          </div>
          <button className="flex items-center justify-center gap-2 w-full text-center text-sm font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm">
            <UserPlus size={16} /> Add to Cohort
          </button>
        </form>
      </Modal>

      {/* Bulk Import Students Modal */}
      <Modal 
        isOpen={isBulkImportOpen} 
        onClose={() => { setIsBulkImportOpen(false); setValidatedStudents([]); setImportNotice(''); }} 
        title="Bulk Import Students via CSV"
      >
        <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-textSecondary">1. Download Template</span>
            <button 
              type="button" 
              onClick={downloadCSVTemplate}
              className="flex items-center justify-center gap-1.5 w-full text-center text-xs font-semibold bg-bgSecondary border border-borderCool hover:border-textMuted text-textPrimary py-2 rounded-lg transition-colors animate-all"
            >
              <Upload size={14} className="rotate-180" /> Download CSV Template
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-textSecondary">2. Upload CSV File</span>
            <label className="flex flex-col items-center justify-center border border-dashed border-borderCool rounded-xl p-4 bg-bgPrimary hover:bg-bgHover/20 cursor-pointer transition-colors">
              <Upload size={20} className="text-textMuted mb-1" />
              <span className="text-xs font-semibold text-textPrimary">Select CSV File</span>
              <span className="text-[10px] text-textMuted mt-0.5">Name, Email, RollNumber, Phone</span>
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </label>
          </div>

          {importNotice && (
            <p className="text-xs text-warning bg-warning/10 border border-warning/20 p-2.5 rounded-lg font-medium text-center">
              {importNotice}
            </p>
          )}

          {validatedStudents.length > 0 && (
            <form onSubmit={handleConfirmImport} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-textSecondary">3. Set Default Password</label>
                <Field 
                  placeholder="Password for new students" 
                  value={defaultPassword} 
                  onChange={setDefaultPassword} 
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-textSecondary">
                  4. Preview Records ({validatedStudents.filter(s => s.isValid).length} valid, {validatedStudents.filter(s => !s.isValid).length} invalid)
                </span>
                
                <div className="border border-borderCool rounded-lg overflow-hidden max-h-[250px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-bgPrimary text-textMuted font-bold border-b border-borderCool">
                        <th className="p-2 w-12 text-center">Status</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Roll</th>
                        <th className="p-2">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderCool">
                      {validatedStudents.map((s, idx) => (
                        <tr 
                          key={idx} 
                          className={s.isValid ? "hover:bg-bgHover/20" : "bg-danger-light/10 text-danger hover:bg-danger-light/20"}
                        >
                          <td className="p-2 text-center font-bold">
                            {s.isValid ? (
                              <span className="text-success">✓</span>
                            ) : (
                              <span className="text-danger" title={s.error}>✗</span>
                            )}
                          </td>
                          <td className="p-2 font-semibold truncate max-w-[80px]" title={s.name}>{s.name}</td>
                          <td className="p-2 truncate max-w-[120px]" title={s.email}>{s.email}</td>
                          <td className="p-2 font-mono">{s.rollNumber || '—'}</td>
                          <td className="p-2">{s.phone || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {validatedStudents.filter(s => !s.isValid).length > 0 && (
                <div className="text-[11px] text-danger bg-danger/10 border border-danger/20 p-2.5 rounded-lg leading-relaxed">
                  <strong>Validation Warnings:</strong> Some records are invalid and will be skipped during import:
                  <ul className="list-disc pl-4 mt-1">
                    {Array.from(new Set(validatedStudents.filter(s => !s.isValid).map(s => s.error))).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button 
                type="submit"
                disabled={validatedStudents.filter(s => s.isValid).length === 0}
                className="flex items-center justify-center gap-2 w-full text-center text-sm font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm disabled:opacity-50"
              >
                <Upload size={16} /> Onboard {validatedStudents.filter(s => s.isValid).length} Valid Students
              </button>
            </form>
          )}
        </div>
      </Modal>

      {/* View Student Profile Modal */}
      <Modal 
        isOpen={!!selectedStudentForView} 
        onClose={() => setSelectedStudentForView(null)} 
        title={`Student Profile: ${selectedStudentForView?.name || ''}`}
      >
        {selectedStudentForView && (
          <div className="flex flex-col gap-5 text-sm max-h-[75vh] overflow-y-auto pr-1">
            {/* Score & Streak Summary Cards */}
            {selectedStudentStats && (
              <div className="bg-bgPrimary border border-borderCool rounded-xl p-4">
                <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider mb-3">
                  <Award size={15} /> Attendance & Score Dashboard
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-1">
                  <div className="bg-bgSecondary border border-borderCool/60 p-2.5 rounded-lg text-center flex flex-col justify-center">
                    <span className="text-textMuted block mb-0.5 font-medium">Overall Score</span>
                    <strong className="text-lg font-black text-primary">{selectedStudentStats.overallScore} pts</strong>
                  </div>
                  <div className="bg-bgSecondary border border-borderCool/60 p-2.5 rounded-lg text-center flex flex-col justify-center">
                    <span className="text-textMuted block mb-0.5 font-medium">LeetCode Score</span>
                    <strong className="text-sm font-bold text-textPrimary">{selectedStudentStats.leetcodeScore} pts</strong>
                    <span className="text-[10px] text-warning font-semibold">({selectedStudentStats.leetcodeStreak}d streak)</span>
                  </div>
                  <div className="bg-bgSecondary border border-borderCool/60 p-2.5 rounded-lg text-center flex flex-col justify-center">
                    <span className="text-textMuted block mb-0.5 font-medium">Task Score</span>
                    <strong className="text-sm font-bold text-textPrimary">{selectedStudentStats.taskScore} pts</strong>
                    <span className="text-[10px] text-warning font-semibold">({selectedStudentStats.taskStreak}d streak)</span>
                  </div>
                  <div className="bg-bgSecondary border border-borderCool/60 p-2.5 rounded-lg text-center flex flex-col justify-center">
                    <span className="text-textMuted block mb-0.5 font-medium">Attendance & Check-in</span>
                    <strong className="text-sm font-bold text-textPrimary">{selectedStudentStats.attendanceMarks + selectedStudentStats.checkInMarks} pts</strong>
                    <span className="text-[10px] text-success font-semibold">({selectedStudentStats.attendanceMarks / 10} days P)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Academic Details */}
            <div className="bg-bgPrimary border border-borderCool rounded-xl p-4">
              <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider mb-3">
                <GraduationCap size={15} /> Academic Details
              </h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                <div>
                  <span className="text-textMuted block mb-0.5">Degree</span>
                  <strong className="text-textPrimary">{selectedStudentForView.academicDetails?.degree || 'Not Provided'}</strong>
                </div>
                <div>
                  <span className="text-textMuted block mb-0.5">Stream / Branch</span>
                  <strong className="text-textPrimary">{selectedStudentForView.academicDetails?.stream || 'Not Provided'}</strong>
                </div>
                <div>
                  <span className="text-textMuted block mb-0.5">Year of Passing</span>
                  <strong className="text-textPrimary">{selectedStudentForView.academicDetails?.passingYear || 'Not Provided'}</strong>
                </div>
                <div>
                  <span className="text-textMuted block mb-0.5">CGPA / Percentage</span>
                  <strong className="text-textPrimary">{selectedStudentForView.academicDetails?.cgpa || 'Not Provided'}</strong>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-bgPrimary border border-borderCool rounded-xl p-4">
              <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider mb-2.5">
                <Award size={15} /> Technical Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedStudentForView.skills ? (
                  selectedStudentForView.skills.split(',').map((skill, idx) => (
                    <span key={idx} className="text-[10px] font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                      {skill.trim()}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-textMuted italic">No skills listed yet</span>
                )}
              </div>
            </div>

            {/* Job Preference */}
            <div className="bg-bgPrimary border border-borderCool rounded-xl p-4">
              <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider mb-3">
                <Briefcase size={15} /> Job Preference
              </h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="col-span-2">
                  <span className="text-textMuted block mb-0.5">Preferred Roles</span>
                  <strong className="text-textPrimary">{selectedStudentForView.jobPreference?.preferredRoles || 'Not Provided'}</strong>
                </div>
                <div>
                  <span className="text-textMuted block mb-0.5">Expected CTC</span>
                  <strong className="text-textPrimary">{selectedStudentForView.jobPreference?.expectedCtc || 'Not Provided'}</strong>
                </div>
                <div className="col-span-3">
                  <span className="text-textMuted block mb-0.5">Preferred Locations</span>
                  <strong className="text-textPrimary">{selectedStudentForView.jobPreference?.preferredLocations || 'Not Provided'}</strong>
                </div>
              </div>
            </div>

            {/* Projects & Certifications */}
            <div className="bg-bgPrimary border border-borderCool rounded-xl p-4 flex flex-col gap-3">
              <div>
                <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider mb-1.5">
                  <BookOpen size={15} /> Projects
                </h4>
                <p className="text-xs text-textSecondary whitespace-pre-line leading-relaxed">
                  {selectedStudentForView.otherDetails?.projects || 'No projects listed'}
                </p>
              </div>
              <div className="border-t border-borderCool/60 pt-3">
                <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider mb-1.5">
                  <Award size={15} /> Certifications & Achievements
                </h4>
                <p className="text-xs text-textSecondary whitespace-pre-line leading-relaxed">
                  {selectedStudentForView.otherDetails?.certifications || 'No certifications listed'}
                </p>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={() => setSelectedStudentForView(null)}
              className="w-full bg-primary text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-primary/95 transition-all mt-1"
            >
              Close Profile
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
