import React, { useState } from 'react';
import { ClipboardList, Check, X, Calendar, User, Users } from 'lucide-react';
import { Badge, DataList, SectionTitle, Select } from '../../components/Shared';

export default function LeaveRequests({ data, api, action }) {
  const [batchFilter, setBatchFilter] = useState('');
  const batches = data.batches || [];

  const filteredLeaves = data.leaves.filter(leave => {
    if (!batchFilter) return true;
    const leaveBatchId = leave.batch?._id || leave.batch;
    const studentBatchId = leave.student?.batch?._id || leave.student?.batch;
    return String(leaveBatchId) === String(batchFilter) || String(studentBatchId) === String(batchFilter);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <div className="pb-5 mb-5 border-b border-borderCool flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <SectionTitle icon={ClipboardList} title="Student Leave Applications" />
            <p className="text-xs text-textMuted mt-1">
              Review, approve or reject leave requests submitted by students.
            </p>
          </div>
          {batches.length > 0 && (
            <Select
              value={batchFilter}
              onChange={setBatchFilter}
              options={[['', 'All Cohorts / Batches'], ...batches.map(b => [b._id, b.name])]}
              className="w-full sm:w-[220px]"
            />
          )}
        </div>

        <DataList emptyText="No student leave applications found.">
          <div className="grid grid-cols-1 gap-4">
            {filteredLeaves.map((leave) => (
              <div 
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bgPrimary border border-borderCool rounded-xl p-5 hover:border-primary/30 transition-all" 
                key={leave._id}
              >
                <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                  {/* Student Details Header */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <User size={16} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-title text-sm font-semibold text-textPrimary truncate">{leave.student?.name}</h3>
                      <small className="text-[11px] text-textMuted block truncate">
                        {leave.student?.email} | Roll: {leave.student?.rollNumber}
                      </small>
                    </div>
                  </div>

                  {/* Leave Duration/Details */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex text-[10px] font-bold uppercase tracking-wider bg-purple/10 text-purple px-2 py-0.5 rounded">
                      {leave.type}
                    </span>
                    <span className="flex items-center gap-1 text-textSecondary">
                      <Calendar size={13} className="text-textMuted" />
                      {new Date(leave.fromDate).toLocaleDateString()} 
                      {leave.toDate ? ` to ${new Date(leave.toDate).toLocaleDateString()}` : ''}
                      {leave.type === 'hourly' ? ` (${leave.hours} hours)` : ''}
                    </span>
                  </div>

                  {/* Reason Text */}
                  <p className="text-xs text-textSecondary italic bg-bgSecondary border border-borderCool/60 rounded-lg p-2.5 mt-1">
                    Reason: "{leave.reason}"
                  </p>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex flex-row md:flex-col items-center md:items-end gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-borderCool/60 shrink-0">
                  <Badge value={leave.status} />
                  
                  {leave.status === 'pending' && (
                    <div className="flex items-center gap-2 ml-auto md:ml-0">
                      <button
                        className="flex items-center gap-1 text-xs font-semibold bg-success hover:bg-success/90 text-white px-3.5 py-2 rounded-lg shadow-sm"
                        onClick={() => action(() => api.patch(`/api/leave/${leave._id}/review`, { status: 'approved' }), 'Leave approved')}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        className="flex items-center gap-1 text-xs font-semibold bg-danger hover:bg-danger/90 text-white px-3.5 py-2 rounded-lg shadow-sm"
                        onClick={() => action(() => api.patch(`/api/leave/${leave._id}/review`, { status: 'rejected' }), 'Leave rejected')}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DataList>
      </div>
    </div>
  );
}
