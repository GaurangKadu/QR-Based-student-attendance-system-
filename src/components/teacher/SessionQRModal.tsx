import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { AttendanceSession, ClassItem } from '../../types';
import { StorageService } from '../../services/storageService';
import { QrCode, X, MapPin, Users, Copy, Check, Hash, Sparkles } from 'lucide-react';

interface SessionQRModalProps {
  session: AttendanceSession;
  onClose: () => void;
}

export const SessionQRModal: React.FC<SessionQRModalProps> = ({ session, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const classItem: ClassItem | undefined = StorageService.getClassById(session.classId);
  const sessionRecords = StorageService.getAttendanceForSession(session.sessionId);
  const presentCount = sessionRecords.filter(r => r.status === 'PRESENT').length;

  const dailyCode = session.dailyCode || '849201';
  // Formatted as 3-3 e.g., "849 201"
  const formattedCode = dailyCode.length === 6 
    ? `${dailyCode.slice(0, 3)} ${dailyCode.slice(3)}`
    : dailyCode;

  useEffect(() => {
    // Generate QR payload containing JSON and fallback ID
    const payload = JSON.stringify({
      sessionId: session.sessionId,
      dailyCode: dailyCode,
      classId: session.classId,
      date: session.date,
      subject: session.subject
    });

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: { dark: '#090d16', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error(err));
  }, [session, dailyCode]);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(dailyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEndSession = () => {
    StorageService.endSession(session.sessionId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 text-center relative transition-colors max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 shrink-0">
          <div className="flex items-center gap-2 text-left">
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-inner">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Active Classroom QR Code</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {classItem?.className} • <span className="text-blue-600 dark:text-blue-400 font-bold">{session.subject}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* DAILY ATTENDANCE CODE BANNER */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Today's Daily QR Passcode
              </span>
              <span className="text-[10px] font-semibold text-blue-100">Unique for {session.date}</span>
            </div>

            <div className="flex items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/20 mt-2">
              <div className="text-left">
                <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider flex items-center gap-1">
                  <Hash className="w-3 h-3" /> 6-Digit Type-In Code:
                </p>
                <p className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-white mt-0.5 drop-shadow-sm">
                  {formattedCode}
                </p>
              </div>

              <button
                onClick={handleCopyCode}
                className="px-3.5 py-2 bg-white text-blue-900 hover:bg-blue-50 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-blue-600" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-blue-100 mt-2 text-left">
              💡 Students unable to scan camera QR can directly type this <strong>{dailyCode}</strong> on their portal to mark attendance.
            </p>
          </div>

          {/* QR Code Render Card */}
          <div className="p-4 bg-white rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-inner inline-block mx-auto">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Session QR Code"
                width={240}
                height={240}
                className="mx-auto rounded-xl"
              />
            ) : (
              <div className="w-[240px] h-[240px] bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400">
                Generating Session QR...
              </div>
            )}
            <p className="text-[11px] text-slate-500 font-bold mt-2 font-mono">
              Scan with Student Camera Scanner
            </p>
          </div>

          {/* Live Present Counter & Geofence Badge */}
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <Users className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Marked Present</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{presentCount} Students</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Geofence Radius</p>
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{classItem?.radius || 50}m Radius</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Share Button */}
          <button
            onClick={() => {
              const msg = `📢 *Attendance Passcode for ${classItem?.className || 'Class'} (${session.subject})*\n\n👉 *Daily Passcode*: *${dailyCode}*\n👉 *Session ID*: ${session.sessionId}\n\nPlease open your Student Portal, scan the QR or type this 6-digit code to check in.`;
              const text = encodeURIComponent(msg);
              window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
            }}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>💬 Share Passcode on WhatsApp Group</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition cursor-pointer"
          >
            Hide QR Code
          </button>
          <button
            onClick={handleEndSession}
            className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition cursor-pointer"
          >
            End Attendance Session
          </button>
        </div>
      </div>
    </div>
  );
};
