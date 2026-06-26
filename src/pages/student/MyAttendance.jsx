import React from 'react';
import { CalendarCheck, Award, AlertCircle, Bookmark, CheckCircle } from 'lucide-react';
import { Badge, SectionTitle } from '../../components/Shared';

export default function MyAttendance({ data }) {
  const records = data.attendance || [];

  // Calculate statistics
  const presentDays = records.filter(r => ['P', 'present', 'L', 'leave'].includes(r.status)).length;
  const absentDays = records.filter(r => ['Ab', 'absent'].includes(r.status)).length;
  
  // Calculate approved leave days directly from leaves data
  const leavesList = data.leaves || [];
  const approvedLeaves = leavesList.filter(l => l.status === 'approved');
  const leaveDays = approvedLeaves.reduce((acc, l) => {
    if (l.type === 'hourly') return acc;
    if (l.type === 'single-day') return acc + 1;
    const start = new Date(l.fromDate);
    const end = new Date(l.toDate || l.fromDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - start.getTime();
    const days = diffTime >= 0 ? Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1 : 0;
    return acc + days;
  }, 0);

  // Attendance percentage = present / total (or present + leave / total)
  // Let's use present / total for direct percentage, and display it beautifully
  const markedCount = records.filter(r => ['P', 'present', 'L', 'leave', 'Ab', 'absent'].includes(r.status)).length;
  const totalDays = markedCount;
  const attendancePercentage = markedCount > 0 
    ? ((presentDays / markedCount) * 100).toFixed(1) 
    : '100.0';

  return (
    <div className="flex flex-col gap-6">
      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Overall Percentage Card */}
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <Award size={24} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Attendance Rate</span>
            <strong className="text-2xl font-black text-textPrimary mt-0.5">{attendancePercentage}%</strong>
          </div>
        </div>

        {/* Present Days Card */}
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-success/10 text-success shrink-0">
            <CheckCircle size={24} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Present Days</span>
            <strong className="text-2xl font-black text-textPrimary mt-0.5">{presentDays} days</strong>
          </div>
        </div>

        {/* Absent Days Card */}
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-danger/10 text-danger shrink-0">
            <AlertCircle size={24} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Absent Days</span>
            <strong className="text-2xl font-black text-textPrimary mt-0.5">{absentDays} days</strong>
          </div>
        </div>

        {/* Leave Days Card */}
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-warning/10 text-warning shrink-0">
            <Bookmark size={24} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Approved Leaves</span>
            <strong className="text-2xl font-black text-textPrimary mt-0.5">{leaveDays} days</strong>
          </div>
        </div>

        {/* Total Class Days Card */}
        <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-purple/10 text-purple shrink-0">
            <CalendarCheck size={24} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Total Records</span>
            <strong className="text-2xl font-black text-textPrimary mt-0.5">{totalDays} sheets</strong>
          </div>
        </div>
      </div>

      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <div className="pb-5 mb-5 border-b border-borderCool">
          <SectionTitle icon={CalendarCheck} title="My Official Attendance Sheet" />
          <p className="text-xs text-textMuted mt-1">
            Review your daily attendance logs marked by your cohort mentors.
          </p>
        </div>

        <div className="border border-borderCool rounded-lg overflow-hidden">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[400px] divide-y divide-borderCool">
              {/* Table Head */}
              <div className="grid grid-cols-2 gap-4 px-5 py-3.5 bg-bgPrimary text-xs font-bold text-textMuted uppercase tracking-wider">
                <span>Date</span>
                <span className="text-right pr-6">Attendance Grade</span>
              </div>
              
              {/* Table Body */}
              {records.length === 0 ? (
                <div className="text-center py-12 text-sm text-textMuted bg-bgPrimary">
                  You do not have any logged attendance history.
                </div>
              ) : (
                records.map((record) => (
                  <div 
                    className="grid grid-cols-2 gap-4 px-5 py-4 items-center hover:bg-bgHover/20 transition-colors" 
                    key={record._id || record.date}
                  >
                    <span className="text-sm font-bold text-textPrimary">{record.date}</span>
                    
                    <div className="flex justify-end items-center pr-2">
                      {(record.status === 'P' || record.status === 'present') && (
                        <span className="text-[10px] font-bold px-3 py-1 bg-success/15 text-success rounded-full border border-success/10 uppercase tracking-wider">
                          Present
                        </span>
                      )}
                      {(record.status === 'Ab' || record.status === 'absent') && (
                        <span className="text-[10px] font-bold px-3 py-1 bg-danger/15 text-danger rounded-full border border-danger/10 uppercase tracking-wider">
                          Absent
                        </span>
                      )}
                      {(record.status === 'L' || record.status === 'leave') && (
                        <span className="text-[10px] font-bold px-3 py-1 bg-success/15 text-success rounded-full border border-success/10 uppercase tracking-wider">
                          Leave Approved
                        </span>
                      )}
                      {!record.status && (
                        <span className="text-[10px] font-bold px-3 py-1 bg-textMuted/15 text-textMuted rounded-full border border-borderCool uppercase tracking-wider">
                          Not Marked
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approved Leaves List */}
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <div className="pb-5 mb-5 border-b border-borderCool">
          <SectionTitle icon={Bookmark} title="My Approved Leaves" />
          <p className="text-xs text-textMuted mt-1">
            Details of leave requests that have been approved by the administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {approvedLeaves.length === 0 ? (
            <div className="text-center py-8 text-sm text-textMuted bg-bgPrimary border border-borderCool rounded-lg">
              No approved leaves found.
            </div>
          ) : (
            approvedLeaves.map((leave) => (
              <div 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bgPrimary border border-borderCool rounded-xl px-5 py-4 hover:border-primary/20 transition-colors"
                key={leave._id}
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-textPrimary block truncate">
                    {leave.type === 'hourly' ? `Hourly Leave (${leave.hours} hrs)` : `${leave.type === 'single-day' ? 'Single Day' : 'Multi-day'} Leave`}
                  </span>
                  <small className="text-[11px] text-textMuted block mt-1 leading-normal">
                    <strong>Duration:</strong> {new Date(leave.fromDate).toLocaleDateString()} 
                    {leave.toDate ? ` to ${new Date(leave.toDate).toLocaleDateString()}` : ''}
                    <span className="mx-2 font-light">|</span>
                    <strong>Reason:</strong> "{leave.reason}"
                  </small>
                </div>
                <div className="shrink-0">
                  <span className="text-[10px] font-bold px-3 py-1 bg-success/15 text-success rounded-full border border-success/10 uppercase tracking-wider">
                    Approved
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
