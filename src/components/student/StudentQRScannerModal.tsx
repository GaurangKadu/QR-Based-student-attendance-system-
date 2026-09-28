import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { StorageService } from '../../services/storageService';
import { User, AttendanceSession } from '../../types';
import {
  playBigSuccessSound,
  playDuplicateWarningSound,
  playErrorSound
} from '../../utils/audioAlert';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Navigation,
  KeyRound,
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  MapPin,
  Check,
  Zap,
  Volume2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  ShieldCheck,
  SwitchCamera,
  Smartphone,
  Video
} from 'lucide-react';

interface StudentQRScannerModalProps {
  student: User;
  onClose: () => void;
  onScanSuccess: () => void;
  initialTab?: 'type_code' | 'camera' | 'upload' | 'quick_select';
}

export const StudentQRScannerModal: React.FC<StudentQRScannerModalProps> = ({
  student,
  onClose,
  onScanSuccess,
  initialTab = 'camera',
}) => {
  const [activeTab, setActiveTab] = useState<'type_code' | 'camera' | 'upload' | 'quick_select'>(initialTab);
  const [manualCode, setManualCode] = useState<string>('');
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraPermissionState, setCameraPermissionState] = useState<'loading' | 'granted' | 'denied' | 'unsupported'>('loading');
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string | null>(null);
  const [useVirtualCamera, setUseVirtualCamera] = useState<boolean>(false);
  const [showHowToAllowGuide, setShowHowToAllowGuide] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successFlash, setSuccessFlash] = useState<boolean>(false);
  const [scannedSuccessPayload, setScannedSuccessPayload] = useState<{
    subject: string;
    time: string;
    code?: string;
  } | null>(null);

  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'error' | 'duplicate';
    message: string;
    distance?: number;
    subject?: string;
    time?: string;
  } | null>(null);

  const rawSessions = StorageService.getSessions();
  const activeSessions = rawSessions.filter(s => s.status === 'active');
  const currentActiveSession = activeSessions.find(s => s.classId === student.classId) || activeSessions[0];
  const [selectedSessionId, setSelectedSessionId] = useState<string>(currentActiveSession?.sessionId || '');
  const [activeSessionQrUrl, setActiveSessionQrUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (currentActiveSession) {
      const payload = JSON.stringify({
        sessionId: currentActiveSession.sessionId,
        dailyCode: currentActiveSession.dailyCode,
        classId: currentActiveSession.classId,
        date: currentActiveSession.date,
        subject: currentActiveSession.subject
      });
      QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: { dark: '#020617', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      }).then(url => {
        setActiveSessionQrUrl(url);
      }).catch(err => {
        console.error('QR code generation error:', err);
      });
    }
  }, [currentActiveSession]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isScanningActiveRef = useRef<boolean>(false);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedTextRef = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);

  // Stable callback refs
  const onScanSuccessRef = useRef(onScanSuccess);
  onScanSuccessRef.current = onScanSuccess;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const studentRef = useRef(student);
  studentRef.current = student;

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  // Central verify function for both QR scanning and Manual Code input
  const handleVerifyCodeOrSession = useCallback((rawCodeOrSessionId: string, bypassGeo: boolean = false) => {
    if (!rawCodeOrSessionId || !rawCodeOrSessionId.trim() || isProcessingRef.current) return;

    const trimmed = rawCodeOrSessionId.trim();
    isProcessingRef.current = true;
    setIsProcessing(true);
    setScanResult(null);

    // Parse JSON if student scanned JSON payload
    let targetIdentifier = trimmed;
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        targetIdentifier = parsed.dailyCode || parsed.sessionId || trimmed;
      } catch {
        targetIdentifier = trimmed;
      }
    }

    // Attempt geolocation
    const proceedWithCoords = (lat?: number, lon?: number) => {
      const currentStudent = studentRef.current;
      const res = StorageService.markAttendance(
        targetIdentifier,
        currentStudent.userId,
        lat,
        lon,
        bypassGeo
      );
      isProcessingRef.current = false;
      setIsProcessing(false);

      if (res.success && res.record) {
        const sess = res.session || StorageService.findSessionByCode(targetIdentifier);
        const subjectName = sess?.subject || 'Class Lecture';
        const recordedTime = res.record.time;

        setScannedSuccessPayload({
          subject: subjectName,
          time: recordedTime,
          code: targetIdentifier,
        });

        setScanResult({
          type: 'success',
          message: res.message,
          subject: subjectName,
          time: recordedTime,
        });

        playBigSuccessSound();
        try {
          if (navigator.vibrate) {
            navigator.vibrate([150, 70, 150]);
          }
        } catch {
          // ignore vibrate error
        }

        setSuccessFlash(true);
        triggerConfetti();
        onScanSuccessRef.current();

        // Hold big success animation screen for 2.0s ("bigs for 1 2 sec if successfully scanned")
        setTimeout(() => {
          setSuccessFlash(false);
          onCloseRef.current();
        }, 2100);
      } else {
        const isDuplicate = res.message.toLowerCase().includes('already') || res.message.toLowerCase().includes('duplicate');
        setScanResult({
          type: isDuplicate ? 'duplicate' : 'error',
          message: res.message,
          distance: res.distance,
        });

        if (isDuplicate) {
          playDuplicateWarningSound();
        } else {
          playErrorSound();
        }
      }
    };

    if (navigator.geolocation && !bypassGeo) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          proceedWithCoords(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          proceedWithCoords(undefined, undefined);
        },
        { timeout: 3500, enableHighAccuracy: true }
      );
    } else {
      proceedWithCoords(undefined, undefined);
    }
  }, [triggerConfetti]);

  const handleVerifyRef = useRef(handleVerifyCodeOrSession);
  handleVerifyRef.current = handleVerifyCodeOrSession;

  const stopCameraStream = useCallback(() => {
    isScanningActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => {
        try {
          t.stop();
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
      if ('BarcodeDetector' in window) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            const raw = barcodes[0].rawValue.trim();
            const now = Date.now();
            if (raw !== lastScannedTextRef.current || now - lastScannedTimeRef.current > 3000) {
              lastScannedTextRef.current = raw;
              lastScannedTimeRef.current = now;
              handleVerifyRef.current(raw);
              return;
            }
          }
        } catch {
          // fallback to jsQR
        }
      }

      if (canvas && video.videoWidth > 0 && video.videoHeight > 0) {
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
              const raw = code.data.trim();
              const now = Date.now();
              if (raw !== lastScannedTextRef.current || now - lastScannedTimeRef.current > 3000) {
                lastScannedTextRef.current = raw;
                lastScannedTimeRef.current = now;
                handleVerifyRef.current(raw);
                return;
              }
            }
          } catch {
            // ignore frame read error
          }
        }
      }
    }

    if (isScanningActiveRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    }
  }, []);

  const startCameraStream = useCallback(async () => {
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermissionState('unsupported');
      setCameraErrorMsg('Live video API is not supported in this browser window. You can use "Open Phone Camera" or "Type 6-Digit Passcode" below.');
      return;
    }

    setCameraPermissionState('loading');
    setCameraErrorMsg(null);

    // Mobile-resilient constraints (avoids OverconstrainedError on Android/iOS)
    const constraintsList: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: cameraFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: { ideal: cameraFacingMode },
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
      videoRef.current.setAttribute('webkit-playsinline', 'true');
      videoRef.current.muted = true;
      try {
        await videoRef.current.play();
      } catch (playErr) {
        console.warn('Autoplay requires user gesture:', playErr);
      }

      setCameraPermissionState('granted');
      setUseVirtualCamera(false);
      isScanningActiveRef.current = true;
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } else {
      const errString = lastError instanceof Error ? `${lastError.name}: ${lastError.message}` : String(lastError);
      setCameraPermissionState('denied');
      if (errString.includes('NotAllowedError') || errString.includes('PermissionDeniedError') || errString.includes('denied')) {
        setCameraErrorMsg('Camera access requires permission. Tap "Start Camera" below to grant permission, or tap "Open Phone Camera" to snap and scan directly.');
      } else {
        setCameraErrorMsg('Live video stream not available. Tap "Open Phone Camera" below to snap and scan with your camera.');
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

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Scale down large mobile phone camera images (12MP/48MP) to 1000px max so jsQR decodes fast
        const MAX_DIM = 1000;
        let targetWidth = img.width;
        let targetHeight = img.height;
        if (targetWidth > MAX_DIM || targetHeight > MAX_DIM) {
          if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight * MAX_DIM) / targetWidth);
            targetWidth = MAX_DIM;
          } else {
            targetWidth = Math.round((targetWidth * MAX_DIM) / targetHeight);
            targetHeight = MAX_DIM;
          }
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Try BarcodeDetector first if supported on mobile Chrome/Android
        if ('BarcodeDetector' in window) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            detector.detect(img).then((barcodes: any[]) => {
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                handleVerifyCodeOrSession(barcodes[0].rawValue.trim());
                return;
              }
              // fallback to jsQR
              decodeWithJsQR(ctx, targetWidth, targetHeight);
            }).catch(() => {
              decodeWithJsQR(ctx, targetWidth, targetHeight);
            });
            return;
          } catch {
            // fallback to jsQR
          }
        }

        decodeWithJsQR(ctx, targetWidth, targetHeight);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const decodeWithJsQR = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
      const imageData = ctx.getImageData(0, 0, width, height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data && code.data.trim()) {
        handleVerifyCodeOrSession(code.data.trim());
      } else {
        setScanResult({
          type: 'error',
          message: 'Could not detect a clear QR code in this photo. Make sure the QR code is centered and in focus, or type the 6-digit daily code.',
        });
        playErrorSound();
      }
    } catch {
      setScanResult({
        type: 'error',
        message: 'Error processing photo. Please try again or type the 6-digit daily code.',
      });
      playErrorSound();
    }
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleVerifyCodeOrSession(manualCode.trim());
  };

  const handleVirtualScan = (sessionObj?: AttendanceSession) => {
    const targetSession = sessionObj || activeSessions[0];
    if (targetSession) {
      handleVerifyCodeOrSession(targetSession.dailyCode || targetSession.sessionId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-2 my-auto flex flex-col max-h-[92vh] ${
        successFlash ? 'border-emerald-500 ring-8 ring-emerald-500/30' : 'border-slate-200 dark:border-slate-800'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-md shadow-blue-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
                Classroom Attendance Check-In
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Student: <span className="text-blue-400 font-bold">{student.name}</span> (Roll #{student.rollNo})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={playBigSuccessSound}
              title="Test Sound Chime"
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Mode Tabs */}
        <div className="grid grid-cols-4 p-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('type_code')}
            className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'type_code'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="font-extrabold">Type Code</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quick_select')}
            className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'quick_select'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>1-Tap GPS</span>
          </button>
        </div>

        {/* Scan Status Toast Banner with Large Text & Feedback */}
        {scanResult && (
          <div
            className={`p-4 mx-4 mt-3 rounded-2xl border flex items-start gap-3.5 transition-all shrink-0 shadow-lg ${
              scanResult.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 ring-4 ring-emerald-400/20'
                : scanResult.type === 'duplicate'
                ? 'bg-amber-500 text-white border-amber-400 ring-4 ring-amber-300/20'
                : 'bg-rose-600 text-white border-rose-500 ring-4 ring-rose-400/20'
            }`}
          >
            {scanResult.type === 'success' ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-100 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-7 h-7 text-white shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <p className="font-black text-sm tracking-wide">
                {scanResult.type === 'success'
                  ? '✓ ATTENDANCE RECORDED SUCCESSFULLY!'
                  : scanResult.type === 'duplicate'
                  ? '⚠ ALREADY MARKED PRESENT'
                  : '✕ ATTENDANCE VERIFICATION FAILED'}
              </p>
              <p className="text-white/95 text-xs mt-0.5 font-medium">{scanResult.message}</p>
              {scanResult.subject && (
                <p className="text-[11px] text-white/90 mt-1 font-bold">
                  Subject: {scanResult.subject} • Time: {scanResult.time}
                </p>
              )}
              {scanResult.distance !== undefined && (
                <p className="text-[11px] text-white/90 mt-1 font-mono">
                  Distance from class: {scanResult.distance} meters.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: TYPE DAILY CODE (PRIMARY RECOMMENDED MODE) */}
          {activeTab === 'type_code' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/40 p-5 rounded-3xl border border-blue-200 dark:border-blue-900/60 text-center space-y-3">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">Type 6-Digit Attendance Passcode</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Type the 6-digit daily QR code number displayed on the projector screen or shared by your teacher.
                  </p>
                </div>

                <form onSubmit={handleManualCodeSubmit} className="space-y-3 pt-2">
                  <div className="relative max-w-xs mx-auto">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value)}
                      placeholder="e.g. 849201"
                      className="w-full text-center text-2xl sm:text-3xl font-mono font-black tracking-widest bg-white dark:bg-slate-900 border-2 border-blue-400 dark:border-blue-600 rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/30 placeholder:text-slate-300 placeholder:font-sans placeholder:text-base shadow-inner"
                    />
                  </div>

                  <div className="flex gap-2 justify-center max-w-xs mx-auto">
                    <button
                      type="submit"
                      disabled={!manualCode.trim() || isProcessing}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Verifying Passcode...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Submit Daily Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Sessions Quick Helper */}
              {activeSessions.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Active Classroom Passcodes:
                    </span>
                    <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                      Live
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {activeSessions.map(s => {
                      const cls = StorageService.getClassById(s.classId);
                      return (
                        <div
                          key={s.sessionId}
                          onClick={() => setManualCode(s.dailyCode || s.sessionId)}
                          className="p-2.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer transition text-xs group"
                        >
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                              {cls?.className || 'Class'} • {s.subject}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              Passcode: <strong className="text-blue-600 dark:text-blue-400 text-xs">{s.dailyCode || 'N/A'}</strong>
                            </p>
                          </div>
                          <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                            Auto-Fill Code
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAMERA SCANNER (WITH LIVE HARDWARE CAMERA OR VIRTUAL CAMERA PREVIEW) */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div
                  className={`relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 border-2 p-4 sm:p-5 min-h-[300px] flex flex-col items-center justify-between text-center shadow-2xl transition-all ${
                    successFlash ? 'border-emerald-500 ring-8 ring-emerald-500/30' : 'border-blue-500/40'
                  }`}
                >
                  {/* Viewfinder Header Bar */}
                  <div className="w-full flex items-center justify-between text-[11px] text-slate-300 font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      {cameraPermissionState === 'granted'
                        ? (cameraFacingMode === 'environment' ? '🟢 REAR CAMERA LIVE' : '🟢 FRONT CAMERA LIVE')
                        : '📷 CAMERA SCANNER READY'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCameraFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
                          startCameraStream();
                        }}
                        title="Switch Camera (Front/Rear)"
                        className="p-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-[10px] flex items-center gap-1 transition"
                      >
                        <SwitchCamera className="w-3.5 h-3.5 text-blue-400" />
                        <span>{cameraFacingMode === 'environment' ? 'Rear Cam' : 'Front Cam'}</span>
                      </button>
                      <span className="bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700 text-blue-300 text-[10px]">
                        HD Mobile
                      </span>
                    </div>
                  </div>

                  {/* Viewfinder Target Reticle Box (CSS Selector 1) */}
                  <div className={`my-3 relative w-60 h-60 sm:w-72 sm:h-72 border-2 rounded-3xl flex flex-col items-center justify-center p-3 bg-slate-950 shadow-2xl backdrop-blur-xs group overflow-hidden transition-all duration-300 ${
                    successFlash
                      ? 'border-emerald-400 ring-8 ring-emerald-500/40 shadow-[0_0_35px_#10b981]'
                      : 'border-cyan-400/80'
                  }`}>
                    {/* Corner Reticle Brackets */}
                    <div className={`absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 z-20 transition-colors ${successFlash ? 'border-emerald-400' : 'border-cyan-400'}`}></div>
                    <div className={`absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 z-20 transition-colors ${successFlash ? 'border-emerald-400' : 'border-cyan-400'}`}></div>
                    <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 z-20 transition-colors ${successFlash ? 'border-emerald-400' : 'border-cyan-400'}`}></div>
                    <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 z-20 transition-colors ${successFlash ? 'border-emerald-400' : 'border-cyan-400'}`}></div>

                    {/* Active Sweeping Laser Beam */}
                    {!successFlash && (
                      <div className="absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse pointer-events-none z-20"></div>
                    )}

                    {/* Hardware Video Stream - Always in DOM without display:none so video.play() works properly */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl z-0"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Interactive Launcher if Camera is Not Currently Streaming and Not in Success Flash */}
                    {cameraPermissionState !== 'granted' && !successFlash && (
                      <div className="absolute inset-0 bg-slate-950/90 z-10 flex flex-col items-center justify-center p-4 text-center space-y-3 rounded-2xl">
                        <div className="p-3 bg-blue-600/20 text-cyan-300 rounded-2xl border border-blue-400/30">
                          <Camera className="w-8 h-8 animate-pulse text-cyan-300" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">Tap to Turn On Camera</p>
                          <p className="text-[10px] text-slate-300 mt-0.5">
                            Uses phone rear camera or device webcam
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={startCameraStream}
                          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Start Live Camera</span>
                        </button>
                      </div>
                    )}

                    {/* Big 1-2 Second Success Confirmation Screen ("bigs for 1 2 sec if successfully scanned") */}
                    {successFlash && (
                      <div className="absolute inset-0 z-30 bg-gradient-to-b from-emerald-950/95 via-slate-950/95 to-emerald-950/95 flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in-95 duration-200">
                        {/* Big Pulsing Green Checkmark Ring */}
                        <div className="relative mb-3">
                          <div className="absolute -inset-3 bg-emerald-500/30 rounded-full blur-md animate-ping"></div>
                          <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-[0_0_35px_#10b981] animate-bounce">
                            <Check className="w-12 h-12 stroke-[3]" />
                          </div>
                        </div>

                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/20 px-3 py-0.5 rounded-full border border-emerald-400/40 mb-1">
                          ✓ Verified & Recorded
                        </span>

                        <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                          ATTENDANCE MARKED!
                        </h3>

                        {scannedSuccessPayload && (
                          <div className="mt-1.5 p-2 bg-white/10 rounded-xl border border-white/10 text-[11px] text-emerald-100 max-w-[220px]">
                            <p className="font-bold truncate text-white">{scannedSuccessPayload.subject}</p>
                            <p className="text-[10px] text-emerald-200 font-mono mt-0.5">{scannedSuccessPayload.time}</p>
                          </div>
                        )}

                        <p className="text-[10px] text-emerald-300 font-mono mt-2 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Saving attendance log...
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions & Controls */}
                  <div className="w-full space-y-2.5">
                    {/* Primary Button 1: Native Mobile Camera Shutter (100% reliable on Android & iPhone) */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => mobileCameraInputRef.current?.click()}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 active:scale-98 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-200" />
                      <span>📱 Open Mobile Camera (Snap & Scan)</span>
                    </button>

                    {/* Secondary Tool Bar */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={startCameraStream}
                        className="py-2.5 px-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition text-[11px] cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{cameraPermissionState === 'granted' ? 'Restart Live Feed' : 'Turn On Live Feed'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="py-2.5 px-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition text-[11px] cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-400" />
                        <span>Upload Photo / File</span>
                      </button>
                    </div>

                    {/* Instant Check-In Attendance Pass */}
                    {currentActiveSession && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleVirtualScan(currentActiveSession)}
                        className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-blue-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-98"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>⚡ Instant 1-Tap Attendance Check-In</span>
                      </button>
                    )}

                    <input
                      ref={mobileCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {currentActiveSession && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold truncate">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">
                        Classroom: <strong>{currentActiveSession.subject}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 shrink-0">
                      Code: {currentActiveSession.dailyCode}
                    </span>
                  </div>
                )}
              </div>

              {/* Troubleshooting Accordion for Unblocking Camera */}
              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setShowHowToAllowGuide(!showHowToAllowGuide)}
                  className="w-full p-3 flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-500" /> How to allow hardware camera in your browser
                  </span>
                  {showHowToAllowGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHowToAllowGuide && (
                  <div className="p-3.5 pt-0 border-t border-slate-200 dark:border-slate-700 space-y-2 text-slate-600 dark:text-slate-400">
                    <p><strong>• Mobile (Android / Chrome):</strong> Tap the lock icon 🔒 next to the web address ➔ Permissions ➔ Camera ➔ Allow.</p>
                    <p><strong>• Mobile (iPhone / Safari):</strong> Tap <em>aA</em> in address bar ➔ <em>Website Settings</em> ➔ Camera ➔ Allow.</p>
                    <p><strong>• Laptop / Desktop:</strong> Click the camera icon or padlock 🔒 on the left of your browser address bar ➔ Allow Camera ➔ Refresh.</p>
                  </div>
                )}
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
                    Click to Upload Photo or Screenshot of Classroom QR
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Supports camera photos, PNG, JPG, or WhatsApp images
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* TAB 4: QUICK 1-TAP GPS SELECTION */}
          {activeTab === 'quick_select' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center gap-2.5 text-xs text-blue-900 dark:text-blue-300">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Geofence check will verify your device location against the active classroom.</span>
              </div>

              {activeSessions.length > 0 ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Active Classroom Session:
                  </label>
                  <select
                    value={selectedSessionId}
                    onChange={e => setSelectedSessionId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {activeSessions.map(s => {
                      const cls = StorageService.getClassById(s.classId);
                      return (
                        <option key={s.sessionId} value={s.sessionId}>
                          {cls?.className || s.subject} ({s.subject}) • Passcode: {s.dailyCode}
                        </option>
                      );
                    })}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleVerifyCodeOrSession(selectedSessionId)}
                    disabled={isProcessing || !selectedSessionId}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{isProcessing ? 'Verifying...' : 'Verify Location & Mark Present'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  No active classroom attendance sessions currently running.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 p-3.5 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Digital QR Check-In</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
