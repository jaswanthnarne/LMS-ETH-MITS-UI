import React from 'react';
import { Clock, CheckCircle, LogOut, Hourglass, Award, AlertCircle, Play } from 'lucide-react';
import { Badge, SectionTitle } from '../../components/Shared';

export default function StudentCheckin({ data, api, action, loading }) {
  const records = data.attendance || [];
  const currentAttendance = records[0] || null;

  const [checkingIn, setCheckingIn] = React.useState(false);
  const [checkingOut, setCheckingOut] = React.useState(false);

  // Find if today's check-in exists (date is today's string in local date)
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const todayRecord = records.find(r => r.date === todayStr);
  const hasCheckedInToday = !!(todayRecord && todayRecord.checkIn);

  const [elapsedTime, setElapsedTime] = React.useState('00:00:00');

  React.useEffect(() => {
    if (!hasCheckedInToday || !todayRecord?.checkIn || todayRecord.checkOut) {
      setElapsedTime('00:00:00');
      return;
    }

    const checkInTime = new Date(todayRecord.checkIn).getTime();

    const updateTimer = () => {
      const diffMs = Date.now() - checkInTime;
      if (diffMs < 0) {
        setElapsedTime('00:00:00');
        return;
      }
      const diffSecs = Math.floor(diffMs / 1000);
      const hrs = Math.floor(diffSecs / 3600);
      const mins = Math.floor((diffSecs % 3600) / 60);
      const secs = diffSecs % 60;
      setElapsedTime(
        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [hasCheckedInToday, todayRecord?.checkIn, todayRecord?.checkOut]);

  const getTargetCheckoutTime = () => {
    if (!hasCheckedInToday || !todayRecord?.checkIn) return null;
    const checkInTime = new Date(todayRecord.checkIn);
    const target = new Date(checkInTime.getTime() + 7.5 * 60 * 60 * 1000);
    return target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  function calculatePoints(hours) {
    if (!hours || hours < 3) return 0;
    if (hours >= 7.5) return 10;
    return Math.round(((hours - 3) / 4.5) * 10);
  }

  // Calculate points for active ticking duration
  const getActiveSessionPoints = () => {
    if (!hasCheckedInToday || !todayRecord?.checkIn || todayRecord.checkOut) return 0;
    const diffMs = Date.now() - new Date(todayRecord.checkIn).getTime();
    const hours = Math.max(0, diffMs / 36e5);
    return calculatePoints(hours);
  };

  const [activePoints, setActivePoints] = React.useState(0);

  React.useEffect(() => {
    if (hasCheckedInToday && !todayRecord.checkOut) {
      const interval = setInterval(() => {
        setActivePoints(getActiveSessionPoints());
      }, 10000); // update points estimate every 10 seconds
      setActivePoints(getActiveSessionPoints());
      return () => clearInterval(interval);
    }
  }, [hasCheckedInToday, todayRecord?.checkIn, todayRecord?.checkOut]);

  return (
    <div className="flex flex-col gap-6">
      {/* Timer & Buttons Banner */}
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <div className="pb-5 mb-5 border-b border-borderCool">
          <SectionTitle icon={Clock} title="Daily Check-in & Check-out Panel" />
          <p className="text-xs text-textMuted mt-1">
            Log your training session hours daily. Check-in is allowed between 9:00 AM and 5:00 PM IST. 
            Auto check-out is applied if you cross the day. Earn points based on duration: &ge;7.5 hrs = 10 pts, &lt;3 hrs = 0 pts, in-between proportional.
          </p>
        </div>

        {/* Current status display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center bg-bgPrimary border border-borderCool rounded-xl p-6 mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Today's Check-in State</span>
            <strong className="text-lg font-black text-textPrimary mt-1 uppercase">
              {hasCheckedInToday ? (todayRecord.checkOut ? 'Checked Out' : 'Active') : 'Not Checked In'}
            </strong>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">
              {hasCheckedInToday && !todayRecord.checkOut ? 'Elapsed Time (Active Session)' : 'Logged Hours'}
            </span>
            <strong className="text-lg font-black text-textPrimary mt-1">
              {hasCheckedInToday && !todayRecord.checkOut ? (
                <span className="text-primary font-mono">{elapsedTime}</span>
              ) : hasCheckedInToday && todayRecord?.totalHours ? (
                `${todayRecord.totalHours.toFixed(2)} hrs`
              ) : (
                '0.00 hrs'
              )}
            </strong>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Today's Points Earned</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Award size={18} className="text-primary" />
              <strong className="text-lg font-black text-primary">
                {hasCheckedInToday && !todayRecord.checkOut ? (
                  `${activePoints} / 10 pts`
                ) : hasCheckedInToday && todayRecord?.totalHours ? (
                  `${calculatePoints(todayRecord.totalHours)} / 10 pts`
                ) : (
                  '0 / 10 pts'
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* Target Checkout Warning */}
        {hasCheckedInToday && !todayRecord.checkOut && (
          <div className="flex items-center gap-2.5 p-4 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary font-medium mb-6 leading-relaxed">
            <Hourglass size={15} className="shrink-0 animate-spin text-primary" />
            <span>
              Your session started at <strong>{new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>. 
              To earn the full 10 check-in points (minimum 7.5 hours required), you should stay checked in until at least <strong>{getTargetCheckoutTime()}</strong>.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-5 py-3 rounded-lg shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            onClick={async () => {
              setCheckingIn(true);
              await action(() => api.post('/api/attendance/check-in', {}), 'Checked in successfully');
              setCheckingIn(false);
            }}
            disabled={hasCheckedInToday || checkingIn || loading}
          >
            <Play size={14} className="fill-white/20" /> 
            {checkingIn ? 'Checking In...' : 'Check In Session'}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 text-xs font-semibold bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary px-5 py-3 rounded-lg disabled:opacity-50 disabled:pointer-events-none"
            onClick={async () => {
              setCheckingOut(true);
              await action(() => api.post('/api/attendance/check-out', {}), 'Checked out successfully');
              setCheckingOut(false);
            }}
            disabled={!hasCheckedInToday || !!todayRecord?.checkOut || checkingOut || loading}
          >
            <LogOut size={14} /> 
            {checkingOut ? 'Checking Out...' : 'Check Out Session'}
          </button>
        </div>
      </div>

      {/* Checkin History Log */}
      <div className="bg-bgSecondary border border-borderCool rounded-xl p-5 shadow-sm">
        <div className="pb-5 mb-5 border-b border-borderCool">
          <SectionTitle icon={Clock} title="Check-in & Check-out Historical Logs" />
          <p className="text-xs text-textMuted mt-1">
            Browse through your daily check-in sessions, total duration, and earned check-in points.
          </p>
        </div>

        <div className="border border-borderCool rounded-lg overflow-hidden">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[700px] divide-y divide-borderCool">
              {/* Table Head */}
              <div className="grid grid-cols-5 gap-4 px-5 py-3.5 bg-bgPrimary text-xs font-bold text-textMuted uppercase tracking-wider">
                <span>Date</span>
                <span>Checked In</span>
                <span>Checked Out</span>
                <span>Duration</span>
                <span className="text-right pr-6">Check-in Points</span>
              </div>

              {/* Table Body */}
              {records.filter(r => r.checkIn).length === 0 ? (
                <div className="text-center py-12 text-sm text-textMuted bg-bgPrimary">
                  You have not logged any check-in sessions yet.
                </div>
              ) : (
                records
                  .filter(r => r.checkIn)
                  .map((record) => (
                    <div 
                      className="grid grid-cols-5 gap-4 px-5 py-4 items-center hover:bg-bgHover/20 transition-colors" 
                      key={record._id || record.date}
                    >
                      <span className="text-sm font-bold text-textPrimary">{record.date}</span>
                      <span className="text-xs text-textSecondary font-medium">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                      <span className="text-xs text-textSecondary font-medium">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                      <span className="text-sm font-bold text-textPrimary">
                        {record.totalHours ? `${record.totalHours.toFixed(2)} hrs` : '-'}
                      </span>
                      <div className="flex justify-end items-center pr-2 gap-1.5">
                        <Award size={14} className="text-primary" />
                        <span className="text-xs font-bold text-textPrimary">
                          {record.totalHours ? `${calculatePoints(record.totalHours)} / 10 pts` : '0 / 10 pts'}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
