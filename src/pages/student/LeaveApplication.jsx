import React, { useState } from 'react';
import { ClipboardList, Send, Plus } from 'lucide-react';
import { Field, TextArea, Select, DataList, SectionTitle, Badge, Modal } from '../../components/Shared';

export default function LeaveApplication({ data, forms, setForm, api, action }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState(null);

  function startLeaveApplication() {
    setForm('leave', 'type', 'single-day');
    setForm('leave', 'fromDate', '');
    setForm('leave', 'toDate', '');
    setForm('leave', 'hours', 1);
    setForm('leave', 'reason', '');
    setEditingLeaveId(null);
    setIsModalOpen(true);
  }

  function startLeaveEdit(leave) {
    const fromDateStr = leave.fromDate ? new Date(leave.fromDate).toISOString().slice(0, 10) : '';
    const toDateStr = leave.toDate ? new Date(leave.toDate).toISOString().slice(0, 10) : '';
    
    setForm('leave', 'type', leave.type || 'single-day');
    setForm('leave', 'fromDate', fromDateStr);
    setForm('leave', 'toDate', toDateStr);
    setForm('leave', 'hours', leave.hours || 1);
    setForm('leave', 'reason', leave.reason || '');
    setEditingLeaveId(leave._id);
    setIsModalOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-borderCool">
          <div>
            <SectionTitle icon={ClipboardList} title="My Leave History" />
            <p className="text-xs text-textMuted mt-1">
              Apply for leave and monitor status of your submitted applications.
            </p>
          </div>
          <button 
            className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-lg shadow-sm"
            onClick={startLeaveApplication}
          >
            <Plus size={15} /> Request Leave
          </button>
        </div>

        <DataList emptyText="No leaves requested yet. Click 'Request Leave' to apply.">
          <div className="grid grid-cols-1 gap-3">
            {data.leaves.map((leave) => (
              <div 
                className="flex items-center justify-between gap-4 bg-bgPrimary border border-borderCool rounded-xl px-5 py-4 hover:border-primary/20 transition-colors"
                key={leave._id}
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-textPrimary block truncate">
                    {leave.type === 'hourly' ? `Hourly Leave (${leave.hours} hrs)` : `${leave.type} Leave`}
                  </span>
                  <small className="text-[11px] text-textMuted block mt-1 leading-normal">
                    <strong>Dates:</strong> {new Date(leave.fromDate).toLocaleDateString()} 
                    {leave.toDate ? ` to ${new Date(leave.toDate).toLocaleDateString()}` : ''}
                    <span className="mx-2 font-light">|</span>
                    <strong>Reason:</strong> "{leave.reason}"
                  </small>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge value={leave.status} />
                  {leave.status === 'pending' && (
                    <div className="flex items-center gap-3">
                      <button
                        className="text-xs font-semibold text-primary hover:underline"
                        onClick={() => startLeaveEdit(leave)}
                        title="Edit Request"
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs font-semibold text-danger hover:underline"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to cancel this leave request?')) {
                            action(() => api.delete(`/api/leave/${leave._id}`), 'Leave request cancelled successfully');
                          }
                        }}
                        title="Cancel Request"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DataList>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingLeaveId ? 'Edit Leave Request' : 'Request Leave / Time Off'}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (editingLeaveId) {
              action(() => api.patch(`/api/leave/${editingLeaveId}`, forms.leave), 'Leave request updated successfully');
            } else {
              action(() => api.post('/api/leave', forms.leave), 'Leave application submitted successfully');
            }
            setIsModalOpen(false);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-textMuted">Leave Duration Type</span>
            <Select
              value={forms.leave.type}
              onChange={(value) => setForm('leave', 'type', value)}
              options={[
                ['single-day', 'Single Full Day'],
                ['multi-day', 'Multi-day Period'],
                ['hourly', 'Hourly Partial Leave']
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Start Date" type="date" value={forms.leave.fromDate} onChange={(value) => setForm('leave', 'fromDate', value)} required />
            {forms.leave.type === 'multi-day' && (
              <Field label="End Date" type="date" value={forms.leave.toDate} onChange={(value) => setForm('leave', 'toDate', value)} required />
            )}
          </div>

          {forms.leave.type === 'hourly' && (
            <Field label="Leave Hours duration" type="number" min="1" max="8" value={forms.leave.hours} onChange={(value) => setForm('leave', 'hours', Number(value))} required />
          )}

          <TextArea placeholder="Provide a detailed explanation for your leave request..." value={forms.leave.reason} onChange={(value) => setForm('leave', 'reason', value)} required />
          
          <button className="flex items-center justify-center gap-2 w-full text-center text-sm font-semibold bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg shadow-sm">
            <Send size={16} /> {editingLeaveId ? 'Save Changes' : 'Submit Application'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
