import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { StorageService } from '../../services/storageService';
import { User } from '../../types';
import {
  X,
  Camera,
  Check,
  AlertCircle,
  RefreshCw,
  Upload,
  FileImage,
  ArrowRight,
  SwitchCamera
} from 'lucide-react';

interface StudentQRScannerModalProps {
  student: User;
  onClose: () => void;
  onScanSuccess: () => void;
}

export const StudentQRScannerModal: React.FC<StudentQRScannerModalProps> = ({
  student,
  onClose,
  onScanSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraPermissionState, setCameraPermissionState] = useState<'loading' | 'granted' | 'denied' | 'unsupported'>('loading');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [manualInputText, setManualInputText] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'error' | 'duplicate' | 'expired' | 'location_error' | 'invalid_code';
    message: string;
    distance?: number;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isScanningActiveRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const streamRequestIdRef = useRef<number>(0);

  const studentRef = useRef(student);
  studentRef.current = student;

  const facingModeRef = useRef(facingMode);
  facingModeRef.current = facingMode;

  const onScanSuccessRef = useRef(onScanSuccess);
  onScanSuccessRef.current = onScanSuccess;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Single reliable cleanup function
  const stopCameraStream = useCallback(() => {
    isScanningActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        const tracks = mediaStreamRef.current.getTracks();
        tracks.forEach(track => {
          try {
            track.enabled = false;
            track.stop();
          } catch {}
        });
      } catch (err) {
        console.warn('Error stopping camera tracks:', err);
      }
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      try {
        if (videoRef.current.srcObject) {
          const s = videoRef.current.srcObject as MediaStream;
          if (s && s.getTracks) {
            s.getTracks().forEach(t => {
              try {
                t.enabled = false;
                t.stop();
              } catch {}
            });
          }
        }
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch {}
    }
  }, []);

  // Central Common Function for all 3 QR input methods
  const processAttendanceQR = useCallback((rawPayload: string) => {
    if (isProcessingRef.current) return;

    const trimmed = (rawPayload || '').trim();
    if (!trimmed) {
      setScanResult({
        type: 'invalid_code',
        message: 'Invalid Attendance QR Code. Please enter or scan a valid session code.',
      });
      return;
    }

    // 1. Extract sessionId
    let targetIdentifier = trimmed;
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        targetIdentifier = parsed.sessionId || parsed.dailyCode || trimmed;
      } catch {
        targetIdentifier = trimmed;
      }
    } else if (trimmed.includes('?')) {
      try {
        const url = new URL(trimmed, window.location.origin);
        const paramSess = url.searchParams.get('sessionId') || url.searchParams.get('session');
        if (paramSess) targetIdentifier = paramSess;
      } catch {}
    }

    console.log('QR_PAYLOAD_PARSED', { rawPayload: trimmed, extractedIdentifier: targetIdentifier });

    // Stop camera immediately
    stopCameraStream();
    isProcessingRef.current = true;
    setIsProcessing(true);

    // 2. Retrieve attendance session from Storage / Firestore cache
    console.log('SESSION_LOOKUP_STARTED', targetIdentifier);
    let session = StorageService.getSessions().find(s => s.sessionId === targetIdentifier);
    if (!session) {
      session = StorageService.findSessionByCode(targetIdentifier);
    }

    // 3. Verify session exists and is active
    if (!session || session.status !== 'active') {
      isProcessingRef.current = false;
      setIsProcessing(false);
      setScanResult({
        type: 'expired',
        message: 'This attendance session has expired or is no longer active.',
      });
      return;
    }

    console.log('SESSION_FOUND', session.sessionId, session.classId, session.subject);

    // 4. Verify logged-in student exists and account is active
    const currentStudent = studentRef.current;
    const studentUser = StorageService.getUserById(currentStudent.userId) || currentStudent;
    if (!studentUser || studentUser.status === 'deactivated') {
      isProcessingRef.current = false;
      setIsProcessing(false);
      setScanResult({
        type: 'error',
        message: `Student account for ${currentStudent.name} is deactivated or not found.`,
      });
      return;
    }

    // 5. Verify student.classId === session.classId
    if (studentUser.classId !== session.classId) {
      isProcessingRef.current = false;
      setIsProcessing(false);
      const studentClass = StorageService.getClassById(studentUser.classId || '');
      const sessClass = StorageService.getClassById(session.classId);
      setScanResult({
        type: 'error',
        message: `${studentUser.name} is in ${studentClass?.className || 'another class'}, but this code is for ${sessClass?.className || 'a different class'}.`,
      });
      return;
    }

    // 6. Check duplicate attendance before requesting GPS
    const existingRecords = StorageService.getAttendanceRecords();
    const isDuplicate = existingRecords.some(r => r.sessionId === session.sessionId && r.studentId === studentUser.userId);
    if (isDuplicate) {
      isProcessingRef.current = false;
      setIsProcessing(false);
      setScanResult({
        type: 'duplicate',
        message: 'Your attendance has already been recorded for this session.',
      });
      return;
    }

    // 7. Verify class geofence is configured
    const classItem = StorageService.getClassById(session.classId);
    if (!classItem || classItem.latitude === undefined || classItem.longitude === undefined) {
      isProcessingRef.current = false;
      setIsProcessing(false);
      setScanResult({
        type: 'error',
        message: 'Classroom location/geofence is not configured for this class.',
      });
      return;
    }

    // 8. Request student GPS location
    console.log('GPS_REQUEST_STARTED');
    if (!navigator.geolocation) {
      isProcessingRef.current = false;
      setIsProcessing(false);
      setScanResult({
        type: 'location_error',
        message: 'Location permission is required to mark attendance.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('GPS_RECEIVED', pos.coords.latitude, pos.coords.longitude);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        console.log('ATTENDANCE_WRITE_STARTED');
        const res = StorageService.markAttendance(
          session.sessionId,
          studentUser.userId,
          lat,
          lon
        );

        if (!isMountedRef.current) return;

        isProcessingRef.current = false;
        setIsProcessing(false);

        if (res.success && res.record) {
          console.log('ATTENDANCE_WRITE_SUCCESS', res.record.attendanceId);
          setScanResult({
            type: 'success',
            message: 'Location verified. You are inside the classroom.',
          });
          onScanSuccessRef.current();

          autoCloseTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              onCloseRef.current();
            }
          }, 2500);
        } else {
          const msg = (res.message || '').toLowerCase();
          if (msg.includes('already') || msg.includes('duplicate')) {
            setScanResult({
              type: 'duplicate',
              message: 'Your attendance has already been recorded for this session.',
            });
          } else if (msg.includes('location permission')) {
            setScanResult({
              type: 'location_error',
              message: 'Location permission is required to mark attendance.',
            });
          } else if (msg.includes('outside')) {
            setScanResult({
              type: 'error',
              message: res.message || 'You are outside the classroom area.',
              distance: res.distance,
            });
          } else {
            setScanResult({
              type: 'error',
              message: res.message || 'Unable to record attendance.',
              distance: res.distance,
            });
          }
        }
      },
      (geoErr) => {
        console.warn('GPS_DENIED_OR_FAILED', geoErr);
        if (!isMountedRef.current) return;
        isProcessingRef.current = false;
        setIsProcessing(false);
        setScanResult({
          type: 'location_error',
          message: 'Location permission is required to mark attendance.',
        });
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
    );
  }, [stopCameraStream]);

  // Video frame scanning loop
  const scanVideoFrame = useCallback(() => {
    if (!isScanningActiveRef.current || !isMountedRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data && !isProcessingRef.current) {
          console.log('QR_DETECTED', code.data);
          stopCameraStream();
          processAttendanceQR(code.data);
          return;
        }
      }
    }

    if (isScanningActiveRef.current && isMountedRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
    }
  }, [processAttendanceQR, stopCameraStream]);

  // Camera stream starter
  const startCameraStream = useCallback(async () => {
    stopCameraStream();
    const currentRequestId = ++streamRequestIdRef.current;
    setCameraPermissionState('loading');
    setCameraErrorMessage('');

    console.log('CAMERA_OPEN_REQUESTED', { requestId: currentRequestId, facingMode: facingModeRef.current });

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('GET_USER_MEDIA_ERROR: Camera API not supported or insecure context');
      setCameraPermissionState('unsupported');
      setCameraErrorMessage('Camera API is not supported on this browser or context.');
      return;
    }

    let stream: MediaStream | null = null;
    let lastError: any = null;

    // 1. First attempt: Simple preferred facingMode constraint
    try {
      console.log('GET_USER_MEDIA_CALLED', 'Constraint: { video: { facingMode: { ideal: facingMode } } }');
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingModeRef.current },
        },
        audio: false,
      });
    } catch (err: any) {
      lastError = err;
      console.warn('GET_USER_MEDIA_ERROR: Preferred camera constraint failed:', err.name, err.message);

      // State 5: Camera already in use — stop existing stream and retry once
      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        console.log('Camera in use, stopping existing streams and retrying once...');
        stopCameraStream();
        await new Promise(r => setTimeout(r, 250));
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingModeRef.current },
            },
            audio: false,
          });
        } catch (retryErr: any) {
          lastError = retryErr;
        }
      }

      // 2. Fallback attempt: simple { video: true, audio: false }
      if (!stream && err.name !== 'NotAllowedError' && err.name !== 'PermissionDeniedError' && err.name !== 'SecurityError') {
        try {
          console.log('GET_USER_MEDIA_CALLED', 'Fallback Constraint: { video: true, audio: false }');
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (fallbackErr: any) {
          lastError = fallbackErr;
          console.warn('GET_USER_MEDIA_ERROR: Fallback camera constraints failed:', fallbackErr.name, fallbackErr.message);
        }
      }
    }

    // Verify component is still mounted and this is the active request
    if (currentRequestId !== streamRequestIdRef.current || !isMountedRef.current) {
      if (stream) {
        stream.getTracks().forEach(t => {
          try {
            t.enabled = false;
            t.stop();
          } catch {}
        });
      }
      return;
    }

    if (!stream) {
      console.log('GET_USER_MEDIA_ERROR', 'failed with error:', lastError?.name);
      const isEmbeddedIframe = typeof window !== 'undefined' && window.self !== window.top;

      if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError' || lastError?.name === 'SecurityError') {
        setCameraPermissionState('denied');
        if (isEmbeddedIframe) {
          setCameraErrorMessage('Camera access is unavailable in this preview. Please open the deployed HTTPS application directly in your mobile browser to use the camera.');
        } else {
          setCameraErrorMessage('Camera permission was declined or blocked by your browser.');
        }
      } else if (lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError') {
        setCameraPermissionState('unsupported');
        setCameraErrorMessage('No camera hardware found on this device.');
      } else if (lastError?.name === 'NotReadableError' || lastError?.name === 'TrackStartError') {
        setCameraPermissionState('unsupported');
        setCameraErrorMessage('Camera is currently in use by another application or tab.');
      } else if (lastError?.name === 'OverconstrainedError') {
        setCameraPermissionState('unsupported');
        setCameraErrorMessage('Camera requested could not satisfy constraints.');
      } else {
        setCameraPermissionState('unsupported');
        setCameraErrorMessage('Camera unavailable. You can use another attendance method.');
      }
      return;
    }

    console.log('GET_USER_MEDIA_SUCCESS', 'tracks:', stream.getVideoTracks().length);
    mediaStreamRef.current = stream;
    isScanningActiveRef.current = true;

    // Attach stream to video element (waiting if necessary)
    const attachAndPlay = async () => {
      let video = videoRef.current;
      if (!video) {
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 50));
          if (!isMountedRef.current || currentRequestId !== streamRequestIdRef.current) return;
          if (videoRef.current) {
            video = videoRef.current;
            break;
          }
        }
      }

      if (!video) {
        console.warn('Video element not available after stream acquisition');
        return;
      }

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.muted = true;
      console.log('STREAM_ATTACHED');

      const handleVideoReady = async () => {
        if (!isMountedRef.current || currentRequestId !== streamRequestIdRef.current) return;
        try {
          console.log('VIDEO_PLAY_STARTED');
          await video!.play();
        } catch (playErr) {
          console.warn('Video play warning:', playErr);
        }

        if (isMountedRef.current && currentRequestId === streamRequestIdRef.current) {
          console.log('VIDEO_READY_FOR_SCAN', video!.videoWidth, video!.videoHeight);
          setCameraPermissionState('granted');
          if (isScanningActiveRef.current) {
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
            }
            animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
          }
        }
      };

      if (video.readyState >= 2) {
        console.log('VIDEO_METADATA_READY (immediate)');
        handleVideoReady();
      } else {
        video.onloadedmetadata = () => {
          console.log('VIDEO_METADATA_READY (onloadedmetadata)');
          handleVideoReady();
        };
      }
    };

    attachAndPlay();
  }, [scanVideoFrame, stopCameraStream]);

  // Tab and Lifecycle management
  useEffect(() => {
    isMountedRef.current = true;

    if (activeTab === 'camera' && !scanResult) {
      startCameraStream();
    } else {
      stopCameraStream();
    }

    return () => {
      isMountedRef.current = false;
      stopCameraStream();
    };
  }, [activeTab, facingMode, scanResult, startCameraStream, stopCameraStream]);

  // Image Upload Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.onload = () => {
        const offscreenCanvas = document.createElement('canvas');
        const ctx = offscreenCanvas.getContext('2d');
        if (!ctx) {
          setUploadError('Unable to process image file.');
          return;
        }

        offscreenCanvas.width = img.width;
        offscreenCanvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (decoded && decoded.data) {
          processAttendanceQR(decoded.data);
        } else {
          setUploadError('Invalid QR Code. No attendance session QR detected in the selected image.');
        }
      };
      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const handleManualFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInputText.trim()) return;
    processAttendanceQR(manualInputText.trim());
  };

  const toggleCameraFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg max-w-md w-full p-5 sm:p-6 text-center relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="text-left">
            <h2 className="text-base font-bold text-slate-900">Scan Attendance QR</h2>
            <p className="text-xs text-slate-500">Provide the attendance QR code displayed by your teacher.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Attendance Result Card */}
        {scanResult ? (
          <div className="py-4 space-y-4">
            {scanResult.type === 'success' && (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto ring-4 ring-emerald-50">
                  <Check className="w-6 h-6" />
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-medium space-y-1">
                  <p className="font-bold text-sm text-emerald-800">✓ Attendance Marked</p>
                  <p className="text-[11px] text-emerald-700">Your location has been verified. You are inside the classroom.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stopCameraStream();
                    onClose();
                  }}
                  className="mt-1 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition cursor-pointer"
                >
                  DONE
                </button>
              </div>
            )}

            {scanResult.type === 'duplicate' && (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">✓ Attendance Already Marked</h3>
                <p className="text-xs text-slate-600">{scanResult.message}</p>
                <button
                  type="button"
                  onClick={() => {
                    stopCameraStream();
                    onClose();
                  }}
                  className="mt-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition cursor-pointer"
                >
                  DONE
                </button>
              </div>
            )}

            {(scanResult.type === 'error' || scanResult.type === 'location_error' || scanResult.type === 'expired' || scanResult.type === 'invalid_code') && (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-rose-700">✕ Attendance Not Marked</h3>
                <p className="text-xs text-slate-600">{scanResult.message}</p>
                {scanResult.distance !== undefined && (
                  <p className="text-[11px] font-mono text-slate-500">
                    Required radius: 50 metres (Your distance: {scanResult.distance}m)
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setScanResult(null);
                    isProcessingRef.current = false;
                    setIsProcessing(false);
                    if (activeTab === 'camera') startCameraStream();
                  }}
                  className="mt-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition cursor-pointer"
                >
                  TRY AGAIN
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* 3 Input Method Option Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-[11px] font-medium">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('camera');
                  setUploadError(null);
                }}
                className={`py-1.5 rounded transition cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Camera
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  setUploadError(null);
                  stopCameraStream();
                }}
                className={`py-1.5 rounded transition cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload QR
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('manual');
                  setUploadError(null);
                  stopCameraStream();
                }}
                className={`py-1.5 rounded transition cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Enter Code
              </button>
            </div>

            {/* TAB 1: Camera Scanner View */}
            {activeTab === 'camera' && (
              <div className="space-y-3">
                {/* Always keep video element mounted so ref is continuously valid */}
                <div className="relative w-full aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Camera Flip Button Overlay */}
                  {cameraPermissionState === 'granted' && (
                    <button
                      type="button"
                      onClick={toggleCameraFacingMode}
                      title="Switch Camera (Front/Back)"
                      className="absolute top-2 right-2 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-lg backdrop-blur-xs text-xs z-10 transition cursor-pointer"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  )}

                  {/* Loading State */}
                  {cameraPermissionState === 'loading' && (
                    <div className="absolute inset-0 bg-slate-900 text-slate-300 flex flex-col items-center justify-center gap-2 text-xs">
                      <Camera className="w-6 h-6 animate-pulse" />
                      <span>Starting camera...</span>
                    </div>
                  )}

                  {/* Processing State */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-slate-950/70 text-white flex flex-col items-center justify-center gap-2 text-xs font-semibold">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                      <span>Verifying GPS & Attendance...</span>
                    </div>
                  )}

                  {/* Error / Denied / Unsupported State Overlay */}
                  {(cameraPermissionState === 'denied' || cameraPermissionState === 'unsupported') && (
                    <div className="absolute inset-0 bg-white p-4 text-xs space-y-3 text-left flex flex-col justify-between overflow-y-auto">
                      <div className="space-y-2">
                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{cameraPermissionState === 'denied' ? 'Camera Permission Blocked' : 'Camera Unavailable'}</span>
                        </p>
                        {cameraErrorMessage && (
                          <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded">
                            {cameraErrorMessage}
                          </p>
                        )}
                        {cameraPermissionState === 'denied' ? (
                          <>
                            <p className="text-slate-600">To scan using your camera:</p>
                            <ol className="list-decimal pl-4 space-y-1 text-slate-600 text-[11px]">
                              <li>Allow camera permission in your mobile browser settings.</li>
                              <li>Ensure no other application is locking the camera.</li>
                              <li>Click TRY AGAIN below.</li>
                            </ol>
                          </>
                        ) : (
                          <p className="text-slate-600 text-[11px]">
                            Camera is unavailable on this device or context. You can use another attendance method below.
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={startCameraStream}
                            className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                          >
                            TRY AGAIN
                          </button>
                          <button
                            type="button"
                            onClick={toggleCameraFacingMode}
                            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1"
                          >
                            <SwitchCamera className="w-3.5 h-3.5" />
                            <span>FLIP CAMERA</span>
                          </button>
                        </div>

                        <div>
                          <p className="text-[11px] text-slate-500 font-medium mb-1.5">Or mark attendance via:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveTab('upload')}
                              className="py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-800 font-medium text-xs cursor-pointer"
                            >
                              Upload QR
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab('manual')}
                              className="py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-800 font-medium text-xs cursor-pointer"
                            >
                              Enter Code
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {cameraPermissionState === 'granted' && (
                  <p className="text-xs text-slate-500 font-medium">
                    Point your camera at the attendance QR code.
                  </p>
                )}
              </div>
            )}

            {/* TAB 2: Upload QR Image with Native Mobile Camera Fallback */}
            {activeTab === 'upload' && (
              <div className="space-y-3 py-2">
                <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-lg p-6 text-center space-y-3 bg-slate-50">
                  <div className="p-3 bg-white border border-slate-200 rounded-full inline-block text-slate-600 shadow-2xs">
                    <FileImage className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Upload Attendance QR Image</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Select a QR photo or take a photo with camera</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>SELECT QR IMAGE</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                </div>

                {uploadError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium flex items-center gap-1.5 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {isProcessing && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-medium flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Verifying GPS & Attendance...</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Enter QR / Session Code Manually */}
            {activeTab === 'manual' && (
              <div className="space-y-3 py-2 text-left">
                <form onSubmit={handleManualFormSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">
                      Enter Attendance QR Code
                    </label>
                    <input
                      type="text"
                      value={manualInputText}
                      onChange={e => setManualInputText(e.target.value)}
                      placeholder="e.g. SESS_1740000000000 or Daily Code"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                      required
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Enter the unique session code or payload text generated for the class session.
                    </p>
                  </div>

                  {isProcessing ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-medium flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Verifying GPS & Attendance...</span>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={!manualInputText.trim()}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>CONTINUE</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
