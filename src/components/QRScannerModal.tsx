import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import { StorageService } from '../services/storageService';
import { AttendanceSession, User } from '../types';
import {
  playBigSuccessSound,
  playDuplicateWarningSound,
  playErrorSound
} from '../utils/audioAlert';
import {
  Camera,
  X,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Users,
  RefreshCw,
  QrCode,
  Upload,
  KeyRound,
  Sparkles,
  Search,
  Check,
  ShieldCheck,
  HelpCircle,
  FlipHorizontal,
  VideoOff,
  Volume2
} from 'lucide-react';

interface QRScannerModalProps {
  session: AttendanceSession;
  onClose: () => void;
  onScanSuccess: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  session,
  onClose,
  onScanSuccess,
}) => {
  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'error' | 'duplicate';
    message: string;
    studentName?: string;
    rollNo?: string;
    time?: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'camera' | 'roster' | 'upload' | 'manual'>('camera');
  const [selectedSimStudentId, setSelectedSimStudentId] = useState<string>('');
  const [manualQrKey, setManualQrKey] = useState<string>('');
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraPermissionState, setCameraPermissionState] = useState<'loading' | 'granted' | 'denied' | 'unsupported'>('loading');
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string | null>(null);
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [successFlash, setSuccessFlash] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedTextRef = useRef<string>('');
  const isScanningActiveRef = useRef<boolean>(false);

  const activeClass = StorageService.getClassById(session.classId);
  const classStudents = StorageService.getStudents().filter(
    s => s.classId === session.classId && s.status === 'active'
  );

  const sessionAttendance = StorageService.getAttendanceForSession(session.sessionId);
  const presentStudentIds = new Set(sessionAttendance.filter(a => a.status === 'PRESENT').map(a => a.studentId));

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 40,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  const handleProcessQrData = useCallback((qrRawText: string) => {
    if (!qrRawText || !qrRawText.trim()) return;

    const trimmed = qrRawText.trim();
    const now = Date.now();

    // Prevent spam scanning of the exact same code within 2 seconds
    if (trimmed === lastScannedTextRef.current && now - lastScannedTimeRef.current < 2000) {
      return;
    }
    lastScannedTextRef.current = trimmed;
    lastScannedTimeRef.current = now;

    const res = StorageService.markAttendance(session.sessionId, trimmed);

    if (res.success && res.record) {
      const student = StorageService.findStudent(trimmed) || StorageService.getUserById(res.record.studentId);
      
      setScanResult({
        type: 'success',
        message: res.message,
        studentName: student?.name || 'Student',
        rollNo: student?.rollNo,
        time: res.record.time,
      });

      // BIG LOUD SOUND & VISUAL FLASH
      playBigSuccessSound();
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 800);
      triggerConfetti();
      onScanSuccess();
    } else {
      const isDuplicate = res.message.toLowerCase().includes('duplicate') || res.message.toLowerCase().includes('already');
      
      setScanResult({
        type: isDuplicate ? 'duplicate' : 'error',
        message: res.message || 'Unable to verify attendance.',
      });

      if (isDuplicate) {
        playDuplicateWarningSound();
      } else {
        playErrorSound();
      }
    }

    setTimeout(() => {
      setScanResult(null);
    }, 4500);
  }, [session.sessionId, onScanSuccess, triggerConfetti]);

  const stopCameraStream = useCallback(() => {
    isScanningActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const scanFrame = useCallback(async () => {
    if (!isScanningActiveRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      // 1. Check Native Hardware BarcodeDetector if supported (Chrome/Android/Edge)
      if ('BarcodeDetector' in window) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            handleProcessQrData(barcodes[0].rawValue);
          }
        } catch {
          // fallback to jsQR below
        }
      }

      // 2. jsQR Canvas Decoder
      if (canvas && video.videoWidth > 0 && video.videoHeight > 0) {
        // Optimal scan dimensions
        const scanWidth = Math.min(640, video.videoWidth);
        const scanHeight = Math.min(480, Math.round((scanWidth / video.videoWidth) * video.videoHeight));

        canvas.width = scanWidth;
        canvas.height = scanHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, scanWidth, scanHeight);
          try {
            const imageData = ctx.getImageData(0, 0, scanWidth, scanHeight);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });
            if (code && code.data && code.data.trim()) {
              handleProcessQrData(code.data);
            }
          } catch {
            // ignore frame parse glitch
          }
        }
      }
    }

    if (isScanningActiveRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    }
  }, [handleProcessQrData]);

  const startCameraStream = useCallback(async () => {
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermissionState('unsupported');
      setCameraErrorMsg('Camera API is not supported in this browser. Please use Quick Tap or Manual ID.');
      return;
    }

    setCameraPermissionState('loading');
    setCameraErrorMsg(null);

    const constraintsList: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: cameraFacingMode },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: cameraFacingMode,
        },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    let stream: MediaStream | null = null;
    let lastError: unknown = null;

    for (const constraints of constraintsList) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (stream && videoRef.current) {
      mediaStreamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      try {
        await videoRef.current.play();
      } catch {
        // Autoplay may need user gesture
      }

      setCameraPermissionState('granted');
      isScanningActiveRef.current = true;
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } else {
      const errString = lastError instanceof Error ? lastError.name : String(lastError);
      setCameraPermissionState('denied');
      if (errString.includes('NotAllowedError') || errString.includes('PermissionDeniedError')) {
        setCameraErrorMsg('Camera access was denied by browser permissions. You can use Quick Tap, File Upload, or Manual ID below.');
      } else if (errString.includes('NotFoundError') || errString.includes('DevicesNotFoundError')) {
        setCameraErrorMsg('No webcam or camera hardware detected on this device.');
      } else {
        setCameraErrorMsg('Camera hardware or permission is unavailable in this browser. Use 1-Tap Attendance or Manual ID below.');
      }
    }
  }, [cameraFacingMode, scanFrame, stopCameraStream]);

  useEffect(() => {
    if (activeTab === 'camera') {
      startCameraStream();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [activeTab, cameraFacingMode, startCameraStream, stopCameraStream]);

  // Decode QR using HTML5 Canvas & jsQR from file
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          handleProcessQrData(code.data);
        } else {
          setScanResult({
            type: 'error',
            message: 'No readable QR code found in this image. Please upload a clear student QR pass.',
          });
          playErrorSound();
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleManualQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQrKey.trim()) return;
    handleProcessQrData(manualQrKey.trim());
    setManualQrKey('');
  };

  const handleSimulatedScan = (student: User) => {
    setIsSimulating(true);
    setTimeout(() => {
      handleProcessQrData(student.qrId || student.rollNo || student.userId);
      setIsSimulating(false);
    }, 250);
  };

  const toggleCameraFacingMode = () => {
    setCameraFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const filteredRoster = classStudents.filter(s =>
    s.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
    (s.rollNo && s.rollNo.includes(rosterSearch)) ||
    s.userId.toLowerCase().includes(rosterSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 my-auto transition-colors flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/90 rounded-2xl shadow-inner text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight tracking-tight flex items-center gap-1.5">
                Live Attendance Scanner
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {activeClass?.className} • <span className="text-blue-400">{session.subject}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Test Big Sound Button */}
            <button
              onClick={playBigSuccessSound}
              title="Test Scanner Sound (Big Chime)"
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Test Sound</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Attendance Counters */}
        <div className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs font-bold shrink-0">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Enrolled Students: {classStudents.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-extrabold">
              ✓ Present: {presentStudentIds.size}
            </span>
            <span className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 font-extrabold">
              Pending: {classStudents.length - presentStudentIds.size}
            </span>
          </div>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="grid grid-cols-4 p-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('camera')}
            className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Camera</span> Scan
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Quick</span> Tap
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload QR
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Roll / ID
          </button>
        </div>

        {/* Scan Status Toast Banner with Large Text & Sound Feedback */}
        {scanResult && (
          <div
            className={`p-4 mx-4 mt-3 rounded-2xl border flex items-start gap-3.5 transition-all shrink-0 animate-in fade-in shadow-lg ${
              scanResult.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 ring-4 ring-emerald-400/20'
                : scanResult.type === 'duplicate'
                ? 'bg-amber-500 text-white border-amber-400 ring-4 ring-amber-300/20'
                : 'bg-rose-600 text-white border-rose-500 ring-4 ring-rose-400/20'
            }`}
          >
            {scanResult.type === 'success' ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-100 shrink-0 mt-0.5 animate-bounce" />
            ) : (
              <AlertTriangle className="w-7 h-7 text-amber-100 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <p className="font-black text-sm tracking-wide">
                  {scanResult.type === 'success'
                    ? `✓ ATTENDANCE MARKED: ${scanResult.studentName}`
                    : scanResult.type === 'duplicate'
                    ? '⚠ ALREADY MARKED'
                    : '✕ SCAN ERROR'}
                </p>
                {scanResult.rollNo && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-extrabold">
                    Roll #{scanResult.rollNo}
                  </span>
                )}
              </div>
              <p className="text-white/90 text-xs mt-0.5 font-medium">{scanResult.message}</p>
              {scanResult.time && (
                <p className="text-[11px] text-white/80 mt-1 font-bold">
                  Verified at: {scanResult.time}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Modal Body / Tab Panes */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: CAMERA SCANNER */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <div
                className={`relative rounded-3xl overflow-hidden bg-slate-950 border-2 transition-all min-h-[260px] flex items-center justify-center shadow-inner ${
                  successFlash ? 'border-emerald-500 ring-8 ring-emerald-500/30' : 'border-indigo-500/50'
                }`}
              >
                {/* Video feed */}
                <video
                  ref={videoRef}
                  className={`w-full max-h-[320px] object-cover rounded-3xl ${
                    cameraPermissionState === 'granted' ? 'block' : 'hidden'
                  }`}
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Laser animation overlay */}
                {cameraPermissionState === 'granted' && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div
                      className={`w-52 h-52 border-2 rounded-2xl relative shadow-2xl transition-colors ${
                        successFlash ? 'border-emerald-400 bg-emerald-500/20' : 'border-blue-400/80'
                      }`}
                    >
                      <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-blue-500"></div>
                      <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-blue-500"></div>
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-blue-500"></div>
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-blue-500"></div>
                      
                      {!successFlash && (
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse shadow-sm shadow-red-500"></div>
                      )}
                    </div>
                    
                    <p className="text-[11px] text-slate-200 font-bold mt-3 bg-slate-900/85 px-3 py-1 rounded-full border border-slate-700 shadow-md">
                      {successFlash ? '✓ QR Code Verified!' : 'Align Student QR Pass inside frame'}
                    </p>
                  </div>
                )}

                {/* Camera controls in live mode removed as requested */}
                {/* Fallback Screen if camera is blocked/denied */}
                {(cameraPermissionState === 'denied' || cameraPermissionState === 'unsupported') && (
                  <div className="p-6 text-center text-slate-200 max-w-md space-y-3">
                    <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
                      <VideoOff className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Camera Access Notice</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {cameraErrorMsg || 'Webcam permission was blocked or hardware is unavailable. You can retry permission or use the 1-Tap Attendance & Simulator options below.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        onClick={startCameraStream}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Simulator Bar */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/60 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Instant Student QR Simulator</span>
                  </div>
                  <span className="text-[10px] uppercase font-extrabold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    Demo Mode
                  </span>
                </div>

                <div className="flex gap-2">
                  <select
                    value={selectedSimStudentId}
                    onChange={e => setSelectedSimStudentId(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold px-3 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Student to Scan --</option>
                    {classStudents.map(student => {
                      const isPresent = presentStudentIds.has(student.userId);
                      return (
                        <option key={student.userId} value={student.userId}>
                          Roll #{student.rollNo}: {student.name} {isPresent ? '✓ (PRESENT)' : ''}
                        </option>
                      );
                    })}
                  </select>

                  <button
                    onClick={() => {
                      const student = StorageService.getUserById(selectedSimStudentId);
                      if (student) handleSimulatedScan(student);
                    }}
                    disabled={!selectedSimStudentId || isSimulating}
                    className="px-4 py-2 min-h-[40px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    <QrCode className="w-4 h-4" />
                    {isSimulating ? 'Scanning...' : 'Scan Pass'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 1-TAP STUDENT ROSTER */}
          {activeTab === 'roster' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={e => setRosterSearch(e.target.value)}
                  placeholder="Search student by Roll #, Name, or ID..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredRoster.map(student => {
                  const isPresent = presentStudentIds.has(student.userId);
                  return (
                    <div
                      key={student.userId}
                      className="p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-3 transition hover:border-blue-300 dark:hover:border-blue-700"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-xs shrink-0">
                          {student.rollNo || '#'}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {student.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            ID: {student.userId} • Roll: #{student.rollNo}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSimulatedScan(student)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer min-h-[36px] shrink-0 ${
                          isPresent
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        }`}
                      >
                        {isPresent ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Present
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" /> Mark Present
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD QR IMAGE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl cursor-pointer flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition space-y-2">
                <div className="p-3.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                    Click or Drag to Upload Student QR Image
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Supports PNG, JPG, WEBP, or screenshot of digital pass
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
              </label>

              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Tip: Students can send photos/screenshots of their QR Pass for offline verification.</span>
              </div>
            </div>
          )}

          {/* TAB 4: MANUAL ROLL NUMBER / ID INPUT */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualQrSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Enter Student Roll Number, User ID, or QR Key:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={manualQrKey}
                    onChange={e => setManualQrKey(e.target.value)}
                    placeholder="e.g. 101, STU101, or QR Hash"
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                  >
                    <Check className="w-4 h-4" /> Submit
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                  Available Class Roll Numbers:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {classStudents.map(student => {
                    const isPresent = presentStudentIds.has(student.userId);
                    return (
                      <button
                        key={student.userId}
                        type="button"
                        onClick={() => handleProcessQrData(student.rollNo || student.userId)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                          isPresent
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        #{student.rollNo} {isPresent ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 p-3.5 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted Session: {session.sessionId}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 min-h-[38px] bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer"
          >
            Finish & Close
          </button>
        </div>
      </div>
    </div>
  );
};
