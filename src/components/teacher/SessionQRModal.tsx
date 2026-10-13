import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { AttendanceSession, ClassItem } from '../../types';
import { StorageService } from '../../services/storageService';
import { X, Download, Clock, Play, Pause, Timer, CheckCircle2, RefreshCw } from 'lucide-react';

interface SessionQRModalProps {
  session: AttendanceSession;
  onClose: () => void;
}

export const SessionQRModal: React.FC<SessionQRModalProps> = ({ session, onClose }) => {
  const [currentSession, setCurrentSession] = useState<AttendanceSession>(session);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const classItem: ClassItem | undefined = StorageService.getClassById(currentSession.classId);
  
  const [presentCount, setPresentCount] = useState<number>(() => {
    return StorageService.getAttendanceForSession(currentSession.sessionId).filter(r => r.status === 'PRESENT').length;
  });

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activationNonce, setActivationNonce] = useState<string>(() => Math.random().toString(36).substring(2, 10) + '-' + Date.now());
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [showTimerModal, setShowTimerModal] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<string>('10');

  useEffect(() => {
    const handleUpdate = () => {
      const records = StorageService.getAttendanceForSession(currentSession.sessionId);
      setPresentCount(records.filter(r => r.status === 'PRESENT').length);
    };

    window.addEventListener('qr_attendance_updated', handleUpdate);
    return () => window.removeEventListener('qr_attendance_updated', handleUpdate);
  }, [currentSession.sessionId]);

  // Timer countdown effect
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0 || isPaused) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, isPaused]);

  // Generate new activation nonce and refresh passcode each time activated
  const handleTogglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    if (!nextPaused) {
      setActivationNonce(Math.random().toString(36).substring(2, 10) + '-' + Date.now());
      const updated = StorageService.refreshSessionCode(currentSession.sessionId);
      if (updated) {
        setCurrentSession(updated);
      }
    }
  };

  const handleRefreshQR = () => {
    setActivationNonce(Math.random().toString(36).substring(2, 10) + '-' + Date.now());
    const updated = StorageService.refreshSessionCode(currentSession.sessionId);
    if (updated) {
      setCurrentSession(updated);
    }
  };

  useEffect(() => {
    if (isPaused) return;
    const payload = JSON.stringify({
      sessionId: currentSession.sessionId,
      dailyCode: currentSession.dailyCode,
      classId: currentSession.classId,
      date: currentSession.date,
      subject: currentSession.subject,
      activationNonce: activationNonce
    });

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error(err));
  }, [currentSession, isPaused, activationNonce]);

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    const sanitizedClass = (classItem?.className || currentSession.classId).replace(/[^a-zA-Z0-9]/g, '-');
    const sanitizedSubject = currentSession.subject.replace(/[^a-zA-Z0-9]/g, '-');
    a.download = `attendance-${sanitizedClass}-${sanitizedSubject}-${currentSession.date}.png`;
    a.click();
  };

  const handleEndSession = () => {
    StorageService.endSession(currentSession.sessionId);
    onClose();
  };

  const handleSetTimer = (mins: number) => {
    setTimerMinutes(mins);
    setSecondsRemaining(mins * 60);
    setShowTimerModal(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg max-w-md w-full p-4 sm:p-6 text-center relative max-h-[96vh] my-auto flex flex-col overflow-y-auto box-border">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg z-10 bg-slate-50 hover:bg-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Status & Title */}
        <div className="mb-2 shrink-0">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className={`inline-block px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold rounded-full uppercase tracking-wider ${
              isPaused ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800 animate-pulse'
            }`}>
              {isPaused ? 'Paused (QR Inactive)' : 'Attendance Active'}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {classItem?.className || 'Classroom'}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
            Subject: <span className="font-semibold text-slate-800">{currentSession.subject}</span>
          </p>
        </div>

        {/* Main QR Display */}
        <div className="my-2 p-2.5 sm:p-4 bg-white border border-slate-200 rounded-lg w-full max-w-[280px] sm:max-w-md mx-auto relative box-border shrink-0">
          {isPaused ? (
            <div className="w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] bg-slate-100 rounded flex flex-col items-center justify-center text-xs text-slate-500 p-3 mx-auto">
              <Pause className="w-8 h-8 text-amber-500 mb-1.5" />
              <p className="font-bold text-slate-700 text-xs sm:text-sm">QR Code Paused</p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Activate session to resume scanning</p>
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Attendance QR Code"
              className="mx-auto w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] object-contain"
            />
          ) : (
            <div className="w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] bg-slate-100 animate-pulse rounded flex items-center justify-center text-xs text-slate-400 mx-auto">
              Generating...
            </div>
          )}
          
          {/* Timer overlay / badge if active */}
          {secondsRemaining !== null && secondsRemaining > 0 && !isPaused && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md px-2.5 py-1 flex items-center justify-center gap-1.5 text-blue-800 font-mono text-[11px] sm:text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Time Remaining: {formatTime(secondsRemaining)}</span>
            </div>
          )}

          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1.5">
            {isPaused ? 'Scanning disabled' : 'Scan this QR to mark attendance'}
          </p>
          {currentSession.dailyCode && !isPaused && (
            <p className="text-[11px] sm:text-xs font-mono font-semibold text-slate-700 mt-0.5">
              Passcode: {currentSession.dailyCode}
            </p>
          )}

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleDownloadQR}
              disabled={!qrDataUrl || isPaused}
              className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-semibold text-[11px] sm:text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={handleRefreshQR}
              disabled={isPaused}
              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-semibold text-[11px] sm:text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
              title="Refresh Barcode Data"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTimerModal(true)}
              className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] sm:text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-1 border border-blue-200"
            >
              <Timer className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{secondsRemaining !== null && secondsRemaining > 0 ? 'Edit Timer' : 'Set Timer'}</span>
            </button>
          </div>
        </div>

        {/* Session Info & Direct Switch (Activate/Deactivate) */}
        <div className="py-2.5 border-t border-b border-slate-100 my-2 flex items-center justify-between text-xs font-medium text-slate-700 px-2 shrink-0">
          <div>
            Present: <span className="text-blue-600 font-bold">{presentCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">Switch:</span>
            <button
              type="button"
              onClick={handleTogglePause}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                isPaused 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              <span>{isPaused ? 'Activate' : 'Deactivate'}</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 shrink-0 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition cursor-pointer"
          >
            Close / Keep Active
          </button>
        </div>

        {/* Timer Setup Modal */}
        {showTimerModal && (
          <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xs w-full p-5 text-left">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-blue-600" /> Set Attendance Timer
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                QR code remains active for the selected duration.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => handleSetTimer(5)}
                  className="py-2 px-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-bold text-slate-800 transition"
                >
                  5 Minutes
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTimer(10)}
                  className="py-2 px-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-bold text-slate-800 transition"
                >
                  10 Minutes
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTimer(15)}
                  className="py-2 px-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-bold text-slate-800 transition"
                >
                  15 Minutes
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTimer(30)}
                  className="py-2 px-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-bold text-slate-800 transition"
                >
                  30 Minutes
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Custom Duration (Minutes)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={customMinutes}
                    onChange={e => setCustomMinutes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleSetTimer(parseInt(customMinutes) || 10)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shrink-0"
                  >
                    Set
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setTimerMinutes(null);
                    setSecondsRemaining(null);
                    setShowTimerModal(false);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Clear Timer
                </button>
                <button
                  type="button"
                  onClick={() => setShowTimerModal(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


