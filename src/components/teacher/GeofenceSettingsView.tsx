import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import { ClassItem } from '../../types';
import { MapPin, Navigation, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export const GeofenceSettingsView: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>(StorageService.getClasses());
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.classId || '');
  
  const currentClass = classes.find(c => c.classId === selectedClassId) || classes[0];

  const [classroomName, setClassroomName] = useState<string>(currentClass?.classroomName || currentClass?.className || 'Lab 402');
  const [latitude, setLatitude] = useState<string>(String(currentClass?.latitude ?? 19.0760));
  const [longitude, setLongitude] = useState<string>(String(currentClass?.longitude ?? 72.8777));
  const [radius, setRadius] = useState<string>(String(currentClass?.radius ?? 50));
  
  const [locating, setLocating] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleClassChange = (cId: string) => {
    setSelectedClassId(cId);
    const cls = classes.find(c => c.classId === cId);
    if (cls) {
      setClassroomName(cls.classroomName || cls.className);
      setLatitude(String(cls.latitude ?? 19.0760));
      setLongitude(String(cls.longitude ?? 72.8777));
      setRadius(String(cls.radius ?? 50));
      setStatusMsg(null);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatusMsg({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }

    setLocating(true);
    setStatusMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocating(false);
        setStatusMsg({ type: 'success', text: 'Location status: Current GPS coordinates updated.' });
      },
      (error) => {
        setLocating(false);
        setStatusMsg({ type: 'error', text: `Location error: ${error.message}` });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSaveGeofence = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const rad = parseFloat(radius);

    if (isNaN(lat) || isNaN(lon) || isNaN(rad)) {
      setStatusMsg({ type: 'error', text: 'Please enter valid numbers for latitude, longitude, and radius.' });
      return;
    }

    StorageService.updateClassGeofence(selectedClassId, {
      classroomName,
      latitude: lat,
      longitude: lon,
      radius: rad,
      geofenceActive: true,
    });

    const updatedClasses = StorageService.getClasses();
    setClasses(updatedClasses);
    setStatusMsg({
      type: 'success',
      text: 'Location status: Classroom location configured successfully.'
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-slate-700" /> Geofence Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure the classroom location used to verify student attendance.
        </p>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Geofence Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <form onSubmit={handleSaveGeofence} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
            <select
              value={selectedClassId}
              onChange={e => handleClassChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
            >
              {classes.map(c => (
                <option key={c.classId} value={c.classId}>
                  {c.className} — {c.subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Classroom Name</label>
            <input
              type="text"
              value={classroomName}
              onChange={e => setClassroomName(e.target.value)}
              placeholder="e.g. Lab 402 / Seminar Hall"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
              <input
                type="text"
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
                placeholder="19.076000"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
              <input
                type="text"
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
                placeholder="72.877700"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Radius (metres)</label>
            <input
              type="number"
              min="5"
              max="500"
              value={radius}
              onChange={e => setRadius(e.target.value)}
              placeholder="50"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Classroom GPS radius boundary limit.</p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Navigation className={`w-3.5 h-3.5 text-blue-600 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Detecting Location...' : 'USE CURRENT LOCATION'}</span>
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>SAVE SETTINGS</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
