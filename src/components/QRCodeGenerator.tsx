import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { User } from '../types';
import { StorageService } from '../services/storageService';
import { Download, Printer, QrCode as QrIcon, CheckCircle, ShieldCheck } from 'lucide-react';

interface QRCodeGeneratorProps {
  student: User;
  size?: number;
  showCard?: boolean;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  student,
  size = 200,
  showCard = true,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const studentClass = StorageService.getClassById(student.classId || '');

  const qrPayload = JSON.stringify({
    qrId: student.qrId || `QR_${student.userId}`,
    userId: student.userId,
    rollNo: student.rollNo,
    name: student.name,
    classId: student.classId,
    verifiedBy: 'IT_ENGG_ATTENDANCE_SYS_2026',
  });

  useEffect(() => {
    QRCode.toDataURL(qrPayload, {
      width: size,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR Code:', err));
  }, [qrPayload, size]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_Attendance_${student.rollNo}_${student.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Student QR ID Card - ${student.name}</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f8fafc; margin: 0; }
            .card { background: white; border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; text-align: center; width: 320px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
            .header { background: #1e3a8a; color: white; margin: -24px -24px 20px -24px; padding: 16px; border-radius: 14px 14px 0 0; }
            .dept { font-size: 11px; text-transform: uppercase; opacity: 0.9; }
            .title { font-size: 16px; font-weight: bold; margin-top: 4px; }
            .qr { border: 1px solid #cbd5e1; border-radius: 12px; padding: 8px; display: inline-block; background: white; margin: 12px 0; }
            .name { font-size: 18px; font-weight: bold; color: #0f172a; }
            .details { font-size: 13px; color: #475569; margin-top: 6px; line-height: 1.5; }
            .footer { font-size: 10px; color: #94a3b8; margin-top: 16px; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="dept">Department of IT Engineering</div>
              <div class="title">Digital Student ID</div>
            </div>
            <div class="name">${student.name}</div>
            <div class="details">
              <strong>Roll No:</strong> ${student.rollNo || 'N/A'}<br/>
              <strong>Class:</strong> ${studentClass?.className || 'N/A'}<br/>
              <strong>ID:</strong> ${student.userId}
            </div>
            <div class="qr">
              <img src="${qrDataUrl}" width="180" height="180" alt="Student QR Code" />
            </div>
            <div class="footer">
              Valid for Digital Attendance Verification<br/>
              Mini Project 2026
            </div>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyQRId = () => {
    navigator.clipboard.writeText(student.qrId || student.userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!showCard) {
    return qrDataUrl ? (
      <img src={qrDataUrl} alt="QR Code" width={size} height={size} className="rounded-lg shadow-sm border border-slate-200" />
    ) : (
      <div className="w-32 h-32 bg-slate-100 flex items-center justify-center rounded-lg text-slate-400">Loading...</div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-md max-w-sm mx-auto text-center relative overflow-hidden transition-colors">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white -mx-6 -mt-6 p-4 mb-4 flex items-center justify-between">
        <div className="text-left">
          <p className="text-[10px] font-semibold tracking-wider text-blue-200 uppercase">IT Engineering Department</p>
          <h3 className="font-bold text-sm tracking-wide">DIGITAL STUDENT PASS</h3>
        </div>
        <ShieldCheck className="w-6 h-6 text-blue-200" />
      </div>

      <div className="my-2">
        <h4 className="font-bold text-lg text-slate-800 dark:text-white">{student.name}</h4>
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">
          <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            Roll: {student.rollNo || 'N/A'}
          </span>
          <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
            {studentClass?.className || 'Class Unassigned'}
          </span>
        </div>
      </div>

      <div className="my-4 inline-block p-3 bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-inner group relative">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="Student QR Code" width={size} height={size} className="mx-auto rounded-md" />
        ) : (
          <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-md flex items-center justify-center">
            <QrIcon className="w-10 h-10 text-slate-300" />
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-center gap-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={handleCopyQRId}>
        <span>QR Key: {student.qrId}</span>
        {copied ? <CheckCircle className="w-3 h-3 text-emerald-600 inline" /> : null}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[40px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[40px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Printer className="w-3.5 h-3.5" /> Print Card
        </button>
      </div>
    </div>
  );
};
