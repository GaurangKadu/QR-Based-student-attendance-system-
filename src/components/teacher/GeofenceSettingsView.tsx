import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import { ClassItem } from '../../types';
import {
  MapPin,
  Navigation,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  ShieldOff,
  Power,
  Radio,
  Sparkles
} from 'lucide-react';

export const GeofenceSettingsView: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>(StorageService.getClasses());
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.classId || '');
  
  const currentClass = classes.find(c => c.classId === selectedClassId) || classes[0];

  const [classroomName, ClassroomNameSet] = useState<string>(currentClass?.classroomName || currentClass?.className || 'Lab 402');
  const [latitude, setLatitude] = useState<string>(String(currentClass?.latitude ?? 19.0760));
  const [longitude, setLongitude] = useState<string>(String(currentClass?.longitude ?? 72.8777));
  const [radius, setRadius] = useState<string>(String(currentClass?.radius ?? 50));
  const [geofenceActive, setGeofenceActive] = useState<boolean>(currentClass?.geofenceActive ?? true);
  
  const [locating, setLocating] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleClassChange = (cId: string) => {
    setSelectedClassId(cId);
    const cls = classes.find(c => c.classId === cId);
    if (cls) {
      ClassroomNameSet(cls.classroomName || cls.className);
      setLatitude(String(cls.latitude ?? 19.0760));
      setLongitude(String(cls.longitude ?? 72.8777));
      setRadius(String(cls.radius ?? 50));
      setGeofenceActive(cls.geofenceActive ?? true);
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
        setStatusMsg({ type: 'success', text: 'Successfully retrieved current GPS coordinates!' });
      },
      (error) => {
        setLocating(false);
        setStatusMsg({ type: 'error', text: `Location error: ${error.message}. Please allow location access.` });
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
      geofenceActive,
    });

    const updatedClasses = StorageService.getClasses();
    setClasses(updatedClasses);
    setStatusMsg({
      type: 'success',
      text: geofenceActive
        ? '✓ Geofence activated & settings saved! Students must be inside the classroom boundary.'
        : '✓ Geofence deactivated & settings saved! Students can now mark attendance from any location.'
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner - Selected Element with Activate / Deactivate Toggle and Save Button */}
      <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border-2 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
        geofenceActive 
          ? 'border-emerald-300 dark:border-emerald-900/60 shadow-emerald-500/5' 
          : 'border-amber-300 dark:border-amber-900/60 shadow-amber-500/5'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3.5 rounded-2xl text-white shadow-md transition-all shrink-0 ${
            geofenceActive 
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/20' 
              : 'bg-gradient-to-tr from-amber-600 to-orange-600 shadow-amber-500/20'
          }`}>
            {geofenceActive ? <ShieldCheck className="w-7 h-7" /> : <ShieldOff className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Classroom Geofence Settings
              </h1>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                geofenceActive 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${geofenceActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                {geofenceActive ? 'Geofence Active & Enforced' : 'Geofence Deactivated (Free Access)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              {geofenceActive
                ? `GPS fence active: student check-in is restricted to ${radius || 50} metres around ${classroomName || 'the classroom'}.`
                : 'GPS fence is currently deactivated: students can mark attendance freely from any location without distance limit.'}
            </p>
          </div>
        </div>

        {/* Activate / Deactivate Toggle and Save Action */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
          {/* Toggle Switch */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-2 sm:p-2.5 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className={`text-xs font-black transition-colors ${
              geofenceActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
            }`}>
              {geofenceActive ? 'Active' : 'Deactivated'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={geofenceActive}
              aria-label={geofenceActive ? 'Deactivate Classroom Geofence' : 'Activate Classroom Geofence'}
              title={geofenceActive ? 'Click to Deactivate Geofence' : 'Click to Activate Geofence'}
              onClick={() => setGeofenceActive(!geofenceActive)}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                geofenceActive
                  ? 'bg-emerald-600 shadow-sm shadow-emerald-500/25'
                  : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
                  geofenceActive ? 'translate-x-6' : 'translate-x-0'
                }`}
              >
                <Power className={`w-3.5 h-3.5 transition-colors ${geofenceActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              </span>
            </button>
          </div>

          {/* Direct Save Button */}
          <button
            type="button"
            onClick={() => handleSaveGeofence()}
            className="px-5 py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all animate-in fade-in ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Geofence Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <form onSubmit={handleSaveGeofence} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Select Class / Division</label>
            <select
              value={selectedClassId}
              onChange={e => handleClassChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {classes.map(c => (
                <option key={c.classId} value={c.classId}>
                  {c.className} — {c.subject} ({c.geofenceActive !== false ? 'Geofence Active' : 'Geofence Deactivated'})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Status Control Tile */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl text-white ${geofenceActive ? 'bg-emerald-600' : 'bg-slate-500'}`}>
                {geofenceActive ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Boundary Enforcement State: <span className={geofenceActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                    {geofenceActive ? 'Active (Strict GPS Checked)' : 'Deactivated (Allowed from Any Location)'}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {geofenceActive
                    ? 'Students beyond the radius cannot mark attendance.'
                    : 'Geofence check is bypassed; all students can mark attendance freely.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGeofenceActive(!geofenceActive)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                geofenceActive
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:text-amber-300'
                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{geofenceActive ? 'Deactivate Fence' : 'Activate Fence'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Classroom / Venue Name</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={classroomName}
                  onChange={e => ClassroomNameSet(e.target.value)}
                  placeholder="e.g. IT Seminar Hall / Lab 402"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Geofence Radius (metres)</label>
              <input
                type="number"
                min="5"
                max="500"
                value={radius}
                onChange={e => setRadius(e.target.value)}
                placeholder="50"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">Recommended: 30 - 50 metres for indoor classrooms.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Latitude (°N)</label>
              <input
                type="text"
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
                placeholder="19.076000"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Longitude (°E)</label>
              <input
                type="text"
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
                placeholder="72.877700"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="w-full sm:w-auto px-5 py-3 min-h-[44px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Navigation className={`w-4 h-4 text-blue-600 ${locating ? 'animate-spin' : ''}`} />
              {locating ? 'Detecting GPS Location...' : 'Use Current GPS Location'}
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-blue-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Geofence Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
