import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { AttendanceSession, ClassItem } from '../../types';
import { StorageService } from '../../services/storageService';
import { X, Download } from 'lucide-react';

interface SessionQRModalProps {
  session: AttendanceSession;
  onClose: () => void;
}

export const SessionQRModal: React.FC<SessionQRModalProps> = ({ session, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const classItem: ClassItem | undefined = StorageService.getClassById(session.classId);
  
  const [presentCount, setPresentCount] = useState<number>(() => {
    return StorageService.getAttendanceForSession(session.sessionId).filter(r => r.status === 'PRESENT').length;
  });

  useEffect(() => {
    const handleUpdate = () => {
      const records = StorageService.getAttendanceForSession(session.sessionId);
      setPresentCount(records.filter(r => r.status === 'PRESENT').length);
    };

    window.addEventListener('qr_attendance_updated', handleUpdate);
    return () => window.removeEventListener('qr_attendance_updated', handleUpdate);
  }, [session.sessionId]);

  useEffect(() => {
    const payload = JSON.stringify({
      sessionId: session.sessionId,
      dailyCode: session.dailyCode,
      classId: session.classId,
      date: session.date,
      subject: session.subject
    });

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error(err));
  }, [session]);

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    const sanitizedClass = (classItem?.className || session.classId).replace(/[^a-zA-Z0-9]/g, '-');
    const sanitizedSubject = session.subject.replace(/[^a-zA-Z0-9]/g, '-');
    a.download = `attendance-${sanitizedClass}-${sanitizedSubject}-${session.date}.png`;
    a.click();
  };

  const handleEndSession = () => {
    StorageService.endSession(session.sessionId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg max-w-md w-full p-6 text-center relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Status & Title */}
        <div className="mb-4">
          <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-full uppercase tracking-wider mb-2">
            Attendance Active
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            {classItem?.className || 'Classroom'}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Subject: <span className="font-semibold text-slate-800">{session.subject}</span>
          </p>
        </div>

        {/* Main QR Display */}
        <div className="my-5 p-4 bg-white border border-slate-200 rounded-lg inline-block mx-auto">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Attendance QR Code"
              width={260}
              height={260}
              className="mx-auto"
            />
          ) : (
            <div className="w-[260px] h-[260px] bg-slate-100 animate-pulse rounded flex items-center justify-center text-xs text-slate-400">
              Generating QR Code...
            </div>
          )}
          <p className="text-xs text-slate-500 font-medium mt-3">
            Scan this QR to mark attendance
          </p>
          {session.dailyCode && (
            <p className="text-xs font-mono font-semibold text-slate-700 mt-1">
              Passcode: {session.dailyCode}
            </p>
          )}

          <div className="mt-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDownloadQR}
              disabled={!qrDataUrl}
              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>DOWNLOAD QR</span>
            </button>
          </div>
        </div>

        {/* Session Info */}
        <div className="py-3 border-t border-b border-slate-100 my-4 flex items-center justify-around text-xs font-medium text-slate-700">
          <div>
            Session Status: <span className="text-emerald-600 font-semibold">Active</span>
          </div>
          <div className="border-r border-slate-200 h-4"></div>
          <div>
            Students Present: <span className="text-blue-600 font-bold">{presentCount}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition cursor-pointer"
          >
            Keep Active
          </button>
          <button
            type="button"
            onClick={handleEndSession}
            className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition cursor-pointer"
          >
            END ATTENDANCE
          </button>
        </div>
      </div>
    </div>
  );
};

