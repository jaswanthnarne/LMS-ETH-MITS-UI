import React from 'react';
import { Clock, RefreshCw, RotateCcw, ClipboardCheck, Award } from 'lucide-react';
import { Badge, Field, Select, SectionTitle } from '../../components/Shared';

export default function AdminCheckinLogs({ data, forms, setForm, api, action, refresh }) {
  const records = data.attendance || [];
  const selectedBatchId = forms.filters.batch;

  function calculatePoints(hours) {
    if (!hours || hours < 3) return 0;
    if (hours >= 7.5) return 10;
    return Math.round(((hours - 3) / 4.5) * 10);
  }

  async function handleResetCheckin(studentId) {
    if (!window.confirm("Are you sure you want to reset this student's check-in/out logs for this date?")) return;
    await action(
      () => api.post('/api/attendance/reset', {
        studentId,
        date: forms.filters.date
      }),
      'Check-in logs reset successfully'
    );
    refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        {/* Head Area */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-5 border-b border-borderCool">
          <div>
            <SectionTitle icon={Clock} title="Check-in & Check-out Logs" />
            <p className="text-xs text-textMuted mt-1">
              Monitor student login sessions, total hours, and calculated check-in points per cohort.
            </p>
          </div>

          {/* Controls / Filter toolbar */}
          <div className="flex flex-wrap items-end gap-3">
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
              <button 
                className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-lg shadow-sm"
                onClick={() => refresh()}
              >
                <RefreshCw size={14} /> Refresh Logs
              </button>
            )}
          </div>
        </div>

        {/* Responsive Table Area */}
        {!selectedBatchId ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-bgPrimary border border-dashed border-borderCool rounded-xl">
            <ClipboardCheck size={40} className="text-textMuted mb-3 animate-pulse" />
            <h4 className="text-sm font-bold text-textPrimary">No Batch Selected</h4>
            <p className="text-xs text-textMuted max-w-sm mt-1">
              Please choose a batch cohort from the dropdown list above to view check-in logs and check-out durations.
            </p>
          </div>
        ) : (
          <div className="border border-borderCool rounded-lg overflow-hidden">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[800px] divide-y divide-borderCool">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3.5 bg-bgPrimary text-xs font-bold text-textMuted uppercase tracking-wider">
                  <span className="col-span-4">Student Profile</span>
                  <span className="col-span-2">Checked In</span>
                  <span className="col-span-2">Checked Out</span>
                  <span className="col-span-2">Total Duration</span>
                  <span className="col-span-2 text-right pr-6">Check-in Points</span>
                </div>
                
                {/* Table Body */}
                {records.length === 0 ? (
                  <div className="text-center py-12 text-sm text-textMuted bg-bgPrimary">
                    No active student check-in records logged for this date.
                  </div>
                ) : (
                  records.map((item) => {
                    const record = item.attendance || item;
                    const student = item.student || {};
                    const studentId = student._id;

                    return (
                      <div 
                        className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-bgHover/20 transition-colors" 
                        key={`${studentId}-${record.date}`}
                      >
                        {/* Profile Column */}
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 border border-primary/20">
                            {student.name ? student.name[0].toUpperCase() : 'S'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <strong className="text-sm font-bold text-textPrimary truncate">{student.name}</strong>
                            <small className="text-xs text-textMuted truncate mt-0.5">Roll: {student.rollNumber || 'N/A'} | {student.email}</small>
                          </div>
                        </div>

                        {/* Checked In Time */}
                        <span className="col-span-2 text-xs text-textSecondary font-semibold">
                          {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>

                        {/* Checked Out Time */}
                        <span className="col-span-2 text-xs text-textSecondary font-semibold">
                          {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (record.checkIn ? 'Active Session' : '—')}
                        </span>

                        {/* Duration & Reset action */}
                        <div className="col-span-2 flex flex-col items-start justify-center min-w-0">
                          {record.checkIn ? (
                            <>
                              <strong className="text-sm font-bold text-textPrimary">
                                {record.totalHours ? `${record.totalHours.toFixed(2)} hrs` : 'Active'}
                              </strong>
                              <button
                                type="button"
                                className="flex items-center gap-1 mt-1 text-[10px] font-bold text-danger hover:underline shrink-0"
                                onClick={() => handleResetCheckin(studentId)}
                              >
                                <RotateCcw size={10} /> Reset
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-textMuted font-medium italic">No log</span>
                          )}
                        </div>

                        {/* Points Selector */}
                        <div className="col-span-2 flex justify-end items-center pr-2 gap-1.5 shrink-0">
                          {record.checkIn ? (
                            <>
                              <Award size={14} className="text-primary" />
                              <strong className="text-sm font-bold text-primary">
                                {calculatePoints(record.totalHours)} / 10
                              </strong>
                            </>
                          ) : (
                            <span className="text-xs text-textMuted font-semibold">0 / 10</span>
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
