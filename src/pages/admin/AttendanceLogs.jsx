import React, { useState, useEffect } from 'react';
import { CalendarCheck, RefreshCw, Edit3, Save, X, ClipboardCheck, Eye, ChevronLeft } from 'lucide-react';
import { Badge, Field, Select, SectionTitle } from '../../components/Shared';

export default function AttendanceLogs({ data, forms, setForm, api, action, refresh }) {
  const records = data.attendance || [];
  
  const [actionMode, setActionMode] = useState(''); // '' | 'view' | 'take' | 'edit'
  const [isEditing, setIsEditing] = useState(false);
  const [editRecords, setEditRecords] = useState({}); // studentId -> status

  // Sync editRecords when data changes and we are in take/edit mode
  useEffect(() => {
    const selectedBatchId = forms.filters.batch;
    if (!selectedBatchId) return;

    if (actionMode === 'take') {
      const initial = {};
      records.forEach((item) => {
        const studentId = item.student?._id;
        // Default unmarked ('') students to 'Ab' when taking attendance
        const status = item.attendance?.status || 'Ab';
        initial[studentId] = status;
      });
      setEditRecords(initial);
      setIsEditing(true);
    } else if (actionMode === 'edit') {
      const initial = {};
      records.forEach((item) => {
        const studentId = item.student?._id;
        // Preserve unmarked ('') students as-is when editing attendance
        const status = item.attendance?.status || '';
        initial[studentId] = status;
      });
      setEditRecords(initial);
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [data.attendance, actionMode, forms.filters.batch]);

  function handleStatusChange(studentId, status) {
    setEditRecords((prev) => ({ ...prev, [studentId]: status }));
  }

  async function saveAttendance() {
    const payloadRecords = Object.entries(editRecords).map(([studentId, status]) => ({
      studentId,
      status
    }));

    await action(
      () => api.post('/api/attendance/bulk', {
        date: forms.filters.date,
        batchId: forms.filters.batch,
        records: payloadRecords
      }),
      'Batch attendance updated successfully'
    );
    setActionMode('view');
  }

  const selectedBatchId = forms.filters.batch;

  // Choice Hub Screen when no mode is selected
  if (!actionMode) {
    return (
      <div className="flex flex-col gap-6 items-center justify-center py-12 max-w-4xl mx-auto">
        <div className="text-center max-w-md mb-8">
          <SectionTitle icon={CalendarCheck} title="Cohort Attendance Hub" className="justify-center text-xl" />
          <p className="text-xs text-textMuted mt-2">
            Select an action pathway below to start managing, marking, or reviewing daily student attendance sheets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Card 1: View Logs */}
          <button
            onClick={() => setActionMode('view')}
            className="flex flex-col gap-4 bg-bgSecondary border border-borderCool hover:border-primary/40 p-6 rounded-2xl text-left shadow-sm hover:shadow-md hover:bg-bgHover/20 transition-all group"
          >
            <div className="p-3.5 rounded-xl bg-primary/10 text-primary w-fit group-hover:scale-110 transition-transform">
              <Eye size={24} />
            </div>
            <div>
              <h3 className="font-title font-bold text-sm text-textPrimary mb-1.5">View Logs</h3>
              <p className="text-xs text-textMuted leading-relaxed font-light">
                Browse through historical student attendance logs, session durations, and checked-in logs.
              </p>
            </div>
          </button>

          {/* Card 2: Take Attendance */}
          <button
            onClick={() => setActionMode('take')}
            className="flex flex-col gap-4 bg-bgSecondary border border-borderCool hover:border-success/40 p-6 rounded-2xl text-left shadow-sm hover:shadow-md hover:bg-bgHover/20 transition-all group"
          >
            <div className="p-3.5 rounded-xl bg-success/10 text-success w-fit group-hover:scale-110 transition-transform">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h3 className="font-title font-bold text-sm text-textPrimary mb-1.5">Take Attendance</h3>
              <p className="text-xs text-textMuted leading-relaxed font-light">
                Mark attendance for today. Students without checks will default to Absent (`Ab`) automatically.
              </p>
            </div>
          </button>

          {/* Card 3: Edit Attendance */}
          <button
            onClick={() => setActionMode('edit')}
            className="flex flex-col gap-4 bg-bgSecondary border border-borderCool hover:border-warning/40 p-6 rounded-2xl text-left shadow-sm hover:shadow-md hover:bg-bgHover/20 transition-all group"
          >
            <div className="p-3.5 rounded-xl bg-warning/10 text-warning w-fit group-hover:scale-110 transition-transform">
              <Edit3 size={24} />
            </div>
            <div>
              <h3 className="font-title font-bold text-sm text-textPrimary mb-1.5">Edit Attendance</h3>
              <p className="text-xs text-textMuted leading-relaxed font-light">
                Modify or correct past attendance records. Keeps unmarked states (`Not Marked`) intact.
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        {/* Head Area */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-5 border-b border-borderCool">
          <div>
            <button
              onClick={() => setActionMode('')}
              className="flex items-center gap-1 text-xs font-semibold text-textMuted hover:text-textPrimary mb-2 transition-colors"
            >
              <ChevronLeft size={14} /> Back to Hub Menu
            </button>
            <SectionTitle 
              icon={actionMode === 'take' ? ClipboardCheck : actionMode === 'edit' ? Edit3 : Eye} 
              title={
                actionMode === 'take' ? 'Take Attendance' : 
                actionMode === 'edit' ? 'Edit Attendance Sheet' : 
                'View Attendance Logs'
              } 
            />
            <p className="text-xs text-textMuted mt-1">
              {actionMode === 'take' && 'Select cohort and date to start marking attendance logs. Unmarked defaults to Absent.'}
              {actionMode === 'edit' && 'Select cohort and date to edit attendance. Unmarked states will be preserved.'}
              {actionMode === 'view' && 'Select cohort and date to view student attendance history records.'}
            </p>
          </div>

          {/* Controls / Filter toolbar */}
          <div className="flex flex-col sm:flex-row flex-nowrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Date</label>
              <Field 
                type="date" 
                value={forms.filters.date} 
                onChange={(value) => setForm('filters', 'date', value)} 
                className="w-full sm:w-[150px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Batch Cohort</label>
              <Select
                value={forms.filters.batch}
                onChange={(value) => setForm('filters', 'batch', value)}
                options={[['', 'Select Batch Cohort'], ...data.batches.map((batch) => [batch._id, batch.name])]}
                className="w-full sm:w-[220px]"
              />
            </div>
            
            {selectedBatchId && (
              <div className="flex gap-2 w-full sm:w-auto">
                {!isEditing ? (
                  <button 
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-lg shadow-sm"
                    onClick={() => refresh()}
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                ) : (
                  <>
                    <button 
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-lg shadow-sm" 
                      onClick={saveAttendance}
                    >
                      <Save size={14} /> Save Logs
                    </button>
                    <button 
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-4 py-2.5 rounded-lg" 
                      onClick={() => setActionMode('view')}
                    >
                      <X size={14} /> Cancel
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Responsive Table Area */}
        {!selectedBatchId ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-bgPrimary border border-dashed border-borderCool rounded-xl">
            <ClipboardCheck size={40} className="text-textMuted mb-3 animate-pulse" />
            <h4 className="text-sm font-bold text-textPrimary">No Cohort Selected</h4>
            <p className="text-xs text-textMuted max-w-sm mt-1">
              Please choose a batch cohort from the dropdown list above to fetch the active student roster.
            </p>
          </div>
        ) : (
          <div className="border border-borderCool rounded-lg overflow-hidden">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[600px] divide-y divide-borderCool">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 px-5 py-3.5 bg-bgPrimary text-xs font-bold text-textMuted uppercase tracking-wider items-center">
                  <span className="col-span-3">Student Profile</span>
                  <span className="col-span-1 text-center">Attendance %</span>
                  <span className="col-span-2 text-right pr-6">{forms.filters.date}</span>
                </div>
                
                {/* Table Body */}
                {records.length === 0 ? (
                  <div className="text-center py-12 text-sm text-textMuted bg-bgPrimary">
                    No student records found or registered in this cohort yet.
                  </div>
                ) : (
                  records.map((item) => {
                    const record = item.attendance || item;
                    const student = item.student || {};
                    const studentId = student._id;
 
                    return (
                      <div 
                        className="grid grid-cols-6 gap-4 px-5 py-4 items-center hover:bg-bgHover/20 transition-colors" 
                        key={`${studentId}-${record.date}`}
                      >
                        {/* Profile Column */}
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 border border-primary/20">
                            {student.name ? student.name[0].toUpperCase() : 'S'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <strong className="text-sm font-bold text-textPrimary truncate">{student.name}</strong>
                            <small className="text-xs text-textMuted truncate mt-0.5">Roll: {student.rollNumber || 'N/A'} | {student.email}</small>
                          </div>
                        </div>

                        {/* Attendance % Column */}
                        <div className="col-span-1 text-center">
                          <span className="text-sm font-semibold text-textPrimary">
                            {record.summary ? `${record.summary.percentage}%` : '100.0%'}
                          </span>
                        </div>

                        {/* Status / Selector Column */}
                        <div className="col-span-2 flex justify-end items-center pr-2">
                          {isEditing && record.status !== 'L' ? (
                            <div className="inline-flex rounded-lg border border-borderCool p-0.5 bg-bgPrimary shadow-sm">
                              <button
                                type="button"
                                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md transition-all ${
                                  (editRecords[studentId] || '') === 'P'
                                    ? 'bg-success text-white shadow-xs'
                                    : 'text-textSecondary hover:bg-bgHover'
                                }`}
                                onClick={() => handleStatusChange(studentId, 'P')}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md transition-all ${
                                  (editRecords[studentId] || '') === 'Ab'
                                    ? 'bg-danger text-white shadow-xs'
                                    : 'text-textSecondary hover:bg-bgHover'
                                }`}
                                onClick={() => handleStatusChange(studentId, 'Ab')}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md transition-all ${
                                  (editRecords[studentId] || '') === 'L'
                                    ? 'bg-warning text-white shadow-xs'
                                    : 'text-textSecondary hover:bg-bgHover'
                                }`}
                                onClick={() => handleStatusChange(studentId, 'L')}
                              >
                                Leave
                              </button>
                              <button
                                type="button"
                                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md transition-all ${
                                  (editRecords[studentId] || '') === ''
                                    ? 'bg-textMuted text-white shadow-xs'
                                    : 'text-textSecondary hover:bg-bgHover'
                                }`}
                                onClick={() => handleStatusChange(studentId, '')}
                              >
                                Reset
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {record.status === 'P' && (
                                <span className="text-[10px] font-bold px-3 py-1 bg-success/15 text-success rounded-full border border-success/10 uppercase tracking-wider">
                                  Present
                                </span>
                              )}
                              {record.status === 'Ab' && (
                                <span className="text-[10px] font-bold px-3 py-1 bg-danger/15 text-danger rounded-full border border-danger/10 uppercase tracking-wider">
                                  Absent
                                </span>
                              )}
                              {record.status === 'L' && (
                                <span className="text-[10px] font-bold px-3 py-1 bg-warning/15 text-warning rounded-full border border-warning/10 uppercase tracking-wider">
                                  Leave (L)
                                </span>
                              )}
                              {!record.status && (
                                <span className="text-[10px] font-bold px-3 py-1 bg-textMuted/15 text-textMuted rounded-full border border-borderCool uppercase tracking-wider">
                                  Not Marked
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
