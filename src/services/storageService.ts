import { User, ClassItem, AttendanceSession, AttendanceRecord, TimeTableLecture, DayOfWeek } from '../types';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  query,
  where
} from 'firebase/firestore';

const STORAGE_KEYS = {
  USERS: 'qr_attendance_users',
  CLASSES: 'qr_attendance_classes',
  SESSIONS: 'qr_attendance_sessions',
  ATTENDANCE: 'qr_attendance_records',
  CURRENT_USER: 'qr_attendance_current_user',
  TIMETABLE: 'qr_attendance_timetable',
};

// Initial Demo Seed Data
const INITIAL_CLASSES: ClassItem[] = [
  {
    classId: 'CLASS_SE_IT_A',
    className: 'SE IT - Div A',
    year: '2nd Year',
    semester: 'Semester IV',
    division: 'A',
    subject: 'Data Structures & Algorithms',
    totalStudents: 60,
    classroomName: 'Room 201 (Theory Hall)',
    latitude: 19.0760,
    longitude: 72.8777,
    radius: 50,
    geofenceActive: true,
  },
  {
    classId: 'CLASS_SE_IT_B',
    className: 'SE IT - Div B',
    year: '2nd Year',
    semester: 'Semester IV',
    division: 'B',
    subject: 'Database Management Systems',
    totalStudents: 60,
    classroomName: 'Room 202 (Theory Hall)',
    latitude: 19.0760,
    longitude: 72.8777,
    radius: 50,
    geofenceActive: true,
  },
  {
    classId: 'CLASS_TE_IT_A',
    className: 'TE IT - Div A',
    year: '3rd Year',
    semester: 'Semester VI',
    division: 'A',
    subject: 'Software Engineering',
    totalStudents: 55,
    classroomName: 'Room 301 (Theory Hall)',
    latitude: 19.0760,
    longitude: 72.8777,
    radius: 50,
    geofenceActive: true,
  },
];

const INITIAL_USERS: User[] = [
  {
    userId: 'Teacher1',
    name: 'Prof. Rajesh Sharma',
    email: 'Teacher1',
    password: 'Class1',
    role: 'teacher',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'STU101',
    name: 'Aarav Patil',
    email: 'STU101',
    password: 'Student123',
    role: 'student',
    rollNo: '201',
    classId: 'CLASS_SE_IT_A',
    qrId: 'QR_STU101_AARAV_201',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'STU102',
    name: 'Ananya Joshi',
    email: 'STU102',
    password: 'Student123',
    role: 'student',
    rollNo: '202',
    classId: 'CLASS_SE_IT_A',
    qrId: 'QR_STU102_ANANYA_202',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'STU103',
    name: 'Karan Malhotra',
    email: 'STU103',
    password: 'Student123',
    role: 'student',
    rollNo: '203',
    classId: 'CLASS_SE_IT_A',
    qrId: 'QR_STU103_KARAN_203',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'STU104',
    name: 'Riya Deshmukh',
    email: 'STU104',
    password: 'Student123',
    role: 'student',
    rollNo: '204',
    classId: 'CLASS_SE_IT_A',
    qrId: 'QR_STU104_RIYA_204',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'STU105',
    name: 'Siddharth Nair',
    email: 'STU105',
    password: 'Student123',
    role: 'student',
    rollNo: '205',
    classId: 'CLASS_SE_IT_B',
    qrId: 'QR_STU105_SIDDHARTH_205',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'STU106',
    name: 'Neha Kulkarni',
    email: 'STU106',
    password: 'Student123',
    role: 'student',
    rollNo: '206',
    classId: 'CLASS_SE_IT_B',
    qrId: 'QR_STU106_NEHA_206',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

const TODAY_STR = new Date().toISOString().split('T')[0];

export function generateDailyCode(seed?: string): string {
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const num = Math.abs(hash) % 900000 + 100000;
    return num.toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const INITIAL_SESSIONS: AttendanceSession[] = [];
const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_TIMETABLE: TimeTableLecture[] = [
  {
    id: 'TT_MON_1',
    dayOfWeek: 'Monday',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    subject: 'Data Structures & Algorithms',
    subjectCode: 'IT401',
    classId: 'CLASS_SE_IT_A',
    className: 'SE IT - Div A',
    room: 'Room 201 (Theory Hall)',
    lectureType: 'Theory',
    teacherName: 'Prof. Rajesh Sharma',
    colorTag: 'blue',
  },
  {
    id: 'TT_MON_2',
    dayOfWeek: 'Monday',
    startTime: '10:15 AM',
    endTime: '11:15 AM',
    subject: 'Database Management Systems',
    subjectCode: 'IT402',
    classId: 'CLASS_SE_IT_B',
    className: 'SE IT - Div B',
    room: 'Room 202 (Theory Hall)',
    lectureType: 'Theory',
    teacherName: 'Prof. Rajesh Sharma',
    colorTag: 'indigo',
  },
];

export class StorageService {
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // Initialize and attach Firestore real-time listeners for shared attendance state across devices
  public static init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
      this.setItem(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
      this.setItem(STORAGE_KEYS.SESSIONS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TIMETABLE)) {
      this.setItem(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      this.setItem(STORAGE_KEYS.ATTENDANCE, []);
    }

    // Attach Firestore listeners to synchronize shared data
    this.setupFirestoreListeners();
  }

  private static setupFirestoreListeners(): void {
    try {
      // 1. Sync Attendance Sessions from Firestore
      onSnapshot(collection(db, 'attendanceSessions'), (snapshot) => {
        const sessions: AttendanceSession[] = [];
        snapshot.forEach((docSnap) => {
          sessions.push(docSnap.data() as AttendanceSession);
        });
        if (sessions.length > 0) {
          this.setItem(STORAGE_KEYS.SESSIONS, sessions);
        }
        window.dispatchEvent(new CustomEvent('qr_attendance_updated'));
      }, (err) => {
        console.warn('Firestore attendanceSessions snapshot error:', err);
      });

      // 2. Sync Attendance Records from Firestore
      onSnapshot(collection(db, 'attendance'), (snapshot) => {
        const records: AttendanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push(docSnap.data() as AttendanceRecord);
        });
        this.setItem(STORAGE_KEYS.ATTENDANCE, records);
        window.dispatchEvent(new CustomEvent('qr_attendance_updated'));
      }, (err) => {
        console.warn('Firestore attendance snapshot error:', err);
      });

      // 3. Sync Classes & Geofence Settings from Firestore
      onSnapshot(collection(db, 'classes'), (snapshot) => {
        const classes: ClassItem[] = [];
        snapshot.forEach((docSnap) => {
          classes.push(docSnap.data() as ClassItem);
        });
        if (classes.length > 0) {
          this.setItem(STORAGE_KEYS.CLASSES, classes);
        }
        window.dispatchEvent(new CustomEvent('qr_attendance_updated'));
      }, (err) => {
        console.warn('Firestore classes snapshot error:', err);
      });

      // Seed initial users and classes into Firestore if not present
      this.seedInitialFirestoreData();
    } catch (err) {
      console.warn('Error setting up Firestore listeners:', err);
    }
  }


  private static async seedInitialFirestoreData(): Promise<void> {
    try {
      // Seed users
      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty) {
        for (const user of INITIAL_USERS) {
          await setDoc(doc(db, 'users', user.userId), user, { merge: true });
        }
      }

      // Seed classes
      const classesSnap = await getDocs(collection(db, 'classes'));
      if (classesSnap.empty) {
        for (const cls of INITIAL_CLASSES) {
          await setDoc(doc(db, 'classes', cls.classId), cls, { merge: true });
        }
      }
    } catch (err) {
      console.warn('Seed Firestore error:', err);
    }
  }

  public static clearAllSamples(): void {
    this.setItem(STORAGE_KEYS.SESSIONS, []);
    this.setItem(STORAGE_KEYS.ATTENDANCE, []);
  }

  public static resetToDemo(): void {
    this.setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.setItem(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    this.setItem(STORAGE_KEYS.SESSIONS, []);
    this.setItem(STORAGE_KEYS.ATTENDANCE, []);
    this.setItem(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE);
    this.seedInitialFirestoreData();
  }

  // User Management
  public static getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  public static getStudents(): User[] {
    return this.getUsers().filter(u => u.role === 'student');
  }

  public static getUserById(userId: string): User | undefined {
    return this.getUsers().find(u => u.userId === userId || u.email === userId);
  }

  public static getUserByQRId(qrId: string): User | undefined {
    return this.getUsers().find(u => u.qrId === qrId || u.userId === qrId);
  }

  public static findStudent(queryStr: string): User | undefined {
    if (!queryStr) return undefined;
    const raw = queryStr.trim();

    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.userId) {
          const u = this.getUserById(parsed.userId);
          if (u) return u;
        }
      } catch {
        // ignore
      }
    }

    const clean = raw.toLowerCase();
    const students = this.getStudents();

    const byId = students.find(s => s.userId.toLowerCase() === clean);
    if (byId) return byId;

    const byQr = students.find(s => s.qrId && s.qrId.toLowerCase() === clean);
    if (byQr) return byQr;

    const byRoll = students.find(s => s.rollNo && s.rollNo.toLowerCase() === clean);
    if (byRoll) return byRoll;

    const byEmail = students.find(s => s.email.toLowerCase() === clean);
    if (byEmail) return byEmail;

    return students.find(s => s.name.toLowerCase() === clean || s.name.toLowerCase().includes(clean));
  }

  public static addUser(user: Omit<User, 'createdAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.setItem(STORAGE_KEYS.USERS, users);

    // Write to Firestore
    setDoc(doc(db, 'users', newUser.userId), newUser, { merge: true }).catch(err => {
      console.warn('Firestore addUser error:', err);
    });

    return newUser;
  }

  public static updateUser(userId: string, updates: Partial<User>): User | undefined {
    const users = this.getUsers();
    const index = users.findIndex(u => u.userId === userId);
    if (index === -1) return undefined;

    users[index] = { ...users[index], ...updates };
    this.setItem(STORAGE_KEYS.USERS, users);

    // Update in Firestore
    setDoc(doc(db, 'users', userId), users[index], { merge: true }).catch(err => {
      console.warn('Firestore updateUser error:', err);
    });

    return users[index];
  }

  public static toggleUserStatus(userId: string): User | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;
    const newStatus = user.status === 'active' ? 'deactivated' : 'active';
    return this.updateUser(userId, { status: newStatus });
  }

  public static deleteUser(userId: string): boolean {
    let users = this.getUsers();
    users = users.filter(u => u.userId !== userId);
    this.setItem(STORAGE_KEYS.USERS, users);
    return true;
  }

  // Class Management
  public static getClasses(): ClassItem[] {
    return this.getItem<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  }

  public static getClassById(classId: string): ClassItem | undefined {
    return this.getClasses().find(c => c.classId === classId);
  }

  public static addClass(cls: ClassItem): ClassItem {
    const classes = this.getClasses();
    const existing = classes.find(c => c.classId.toLowerCase() === cls.classId.toLowerCase());
    if (existing) {
      Object.assign(existing, cls);
    } else {
      classes.push(cls);
    }
    this.setItem(STORAGE_KEYS.CLASSES, classes);

    // Write to Firestore
    setDoc(doc(db, 'classes', cls.classId), cls, { merge: true }).catch(err => {
      console.warn('Firestore addClass error:', err);
    });

    window.dispatchEvent(new CustomEvent('qr_attendance_updated'));
    return cls;
  }

  public static deleteClass(classId: string): void {
    let classes = this.getClasses();
    classes = classes.filter(c => c.classId !== classId);
    this.setItem(STORAGE_KEYS.CLASSES, classes);
    window.dispatchEvent(new CustomEvent('qr_attendance_updated'));
  }

  public static bulkImportStudents(newStudents: Omit<User, 'createdAt'>[]): { imported: number; errors: { row: number; studentId: string; reason: string }[] } {
    const existingUsers = this.getUsers();
    const existingIds = new Set(existingUsers.map(u => u.userId.toLowerCase()));
    const errors: { row: number; studentId: string; reason: string }[] = [];
    let imported = 0;

    newStudents.forEach((student, index) => {
      const rowNum = index + 2; // header is row 1
      if (!student.userId) {
        errors.push({ row: rowNum, studentId: 'N/A', reason: 'Missing Student ID' });
        return;
      }
      if (!student.name) {
        errors.push({ row: rowNum, studentId: student.userId, reason: 'Missing Student Name' });
        return;
      }
      if (!student.classId) {
        errors.push({ row: rowNum, studentId: student.userId, reason: 'Missing Class' });
        return;
      }

      if (existingIds.has(student.userId.toLowerCase())) {
        errors.push({ row: rowNum, studentId: student.userId, reason: 'Duplicate Student ID already exists' });
        return;
      }

      const newUser: User = {
        ...student,
        createdAt: new Date().toISOString(),
      };

      existingUsers.push(newUser);
      existingIds.add(newUser.userId.toLowerCase());
      imported++;

      // Write to Firestore
      setDoc(doc(db, 'users', newUser.userId), newUser, { merge: true }).catch(err => {
        console.warn('Firestore bulkImport error:', err);
      });
    });

    this.setItem(STORAGE_KEYS.USERS, existingUsers);
    window.dispatchEvent(new CustomEvent('qr_attendance_updated'));

    return { imported, errors };
  }


  // Session Management
  public static getSessions(): AttendanceSession[] {
    return this.getItem<AttendanceSession[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
  }

  public static getActiveSession(classId?: string): AttendanceSession | undefined {
    const sessions = this.getSessions();
    return sessions.find(s => s.status === 'active' && (!classId || s.classId === classId));
  }

  public static findSessionByCode(codeOrId: string): AttendanceSession | undefined {
    if (!codeOrId) return undefined;
    const clean = codeOrId.trim().replace(/[-\s]/g, '').toLowerCase();
    const sessions = this.getSessions();

    const active = sessions.filter(s => s.status === 'active');

    const matchActiveCode = active.find(s => s.dailyCode && s.dailyCode.replace(/[-\s]/g, '').toLowerCase() === clean);
    if (matchActiveCode) return matchActiveCode;

    const matchActiveId = active.find(s => s.sessionId.toLowerCase() === clean || s.sessionId.toLowerCase().includes(clean));
    if (matchActiveId) return matchActiveId;

    const matchAnyCode = sessions.find(s => s.dailyCode && s.dailyCode.replace(/[-\s]/g, '').toLowerCase() === clean);
    if (matchAnyCode) return matchAnyCode;

    return sessions.find(s => s.sessionId.toLowerCase() === clean);
  }

  public static startSession(classId: string, subject: string, teacherId: string): AttendanceSession {
    const sessions = this.getSessions();
    const now = new Date();
    const newDailyCode = generateDailyCode();

    // Close any previous active session for this class
    sessions.forEach(s => {
      if (s.classId === classId && s.status === 'active') {
        s.status = 'completed';
        s.endTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        // Update in Firestore
        setDoc(doc(db, 'attendanceSessions', s.sessionId), s, { merge: true }).catch(() => {});
      }
    });

    const newSession: AttendanceSession = {
      sessionId: `SESS_${Date.now()}`,
      dailyCode: newDailyCode,
      classId,
      subject,
      teacherId,
      date: now.toISOString().split('T')[0],
      startTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'active',
      createdAt: now.toISOString(),
    };

    sessions.unshift(newSession);
    this.setItem(STORAGE_KEYS.SESSIONS, sessions);

    // Save active attendance session to shared Firestore collection
    setDoc(doc(db, 'attendanceSessions', newSession.sessionId), newSession, { merge: true }).catch(err => {
      console.warn('Firestore startSession error:', err);
    });

    return newSession;
  }

  public static endSession(sessionId: string): AttendanceSession | undefined {
    const sessions = this.getSessions();
    const session = sessions.find(s => s.sessionId === sessionId);
    if (!session) return undefined;

    session.status = 'completed';
    session.endTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Mark remaining students in this class who were not scanned as ABSENT
    const classStudents = this.getStudents().filter(s => s.classId === session.classId && s.status === 'active');
    const existingRecords = this.getAttendanceForSession(sessionId);
    const markedStudentIds = new Set(existingRecords.map(r => r.studentId));

    const records = this.getAttendanceRecords();
    classStudents.forEach(student => {
      if (!markedStudentIds.has(student.userId)) {
        const absentRecord: AttendanceRecord = {
          attendanceId: `ATT_${student.userId}_${sessionId}`,
          studentId: student.userId,
          sessionId: sessionId,
          classId: session.classId,
          date: session.date,
          time: new Date().toLocaleTimeString(),
          status: 'ABSENT',
        };
        records.push(absentRecord);
        setDoc(doc(db, 'attendance', absentRecord.attendanceId), absentRecord, { merge: true }).catch(() => {});
      }
    });

    this.setItem(STORAGE_KEYS.ATTENDANCE, records);
    this.setItem(STORAGE_KEYS.SESSIONS, sessions);

    // Update session in Firestore
    setDoc(doc(db, 'attendanceSessions', session.sessionId), session, { merge: true }).catch(err => {
      console.warn('Firestore endSession error:', err);
    });

    return session;
  }

  // Attendance Records Management
  public static getAttendanceRecords(): AttendanceRecord[] {
    return this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  }

  public static getAttendanceForSession(sessionId: string): AttendanceRecord[] {
    return this.getAttendanceRecords().filter(r => r.sessionId === sessionId);
  }

  public static getAttendanceForStudent(studentId: string): AttendanceRecord[] {
    return this.getAttendanceRecords().filter(r => r.studentId === studentId);
  }

  public static markAttendance(
    sessionIdOrDailyCode: string,
    studentIdOrQuery: string,
    studentLat?: number,
    studentLon?: number
  ): { success: boolean; message: string; distance?: number; record?: AttendanceRecord; session?: AttendanceSession } {
    let session = this.getSessions().find(s => s.sessionId === sessionIdOrDailyCode);
    if (!session) {
      session = this.findSessionByCode(sessionIdOrDailyCode);
    }

    if (!session || session.status !== 'active') {
      return { success: false, message: 'Attendance Session not found or is no longer active.' };
    }

    const student = this.findStudent(studentIdOrQuery) || this.getUserById(studentIdOrQuery);
    if (!student) {
      return { success: false, message: 'Student record not recognized. Please check Roll No or QR.' };
    }

    if (student.status === 'deactivated') {
      return { success: false, message: `Student account for ${student.name} is currently deactivated.` };
    }

    if (student.classId !== session.classId) {
      const studentClass = this.getClassById(student.classId || '');
      const sessClass = this.getClassById(session.classId);
      return {
        success: false,
        message: `${student.name} is in ${studentClass?.className || 'another class'}, but this code is for ${sessClass?.className || 'a different class'}.`
      };
    }

    // Mandatory Geofence Validation
    const classItem = this.getClassById(session.classId);
    if (!classItem || classItem.latitude === undefined || classItem.longitude === undefined) {
      return { success: false, message: 'Classroom location is not configured.' };
    }

    if (studentLat === undefined || studentLon === undefined) {
      return { success: false, message: 'Location permission is required to mark attendance.' };
    }

    const radius = classItem.radius ?? 50;
    const distance = calculateDistanceMeters(studentLat, studentLon, classItem.latitude, classItem.longitude);

    if (distance > radius) {
      return {
        success: false,
        message: `You are outside the classroom area (${Math.round(distance)}m away, limit is ${radius}m).`,
        distance: Math.round(distance),
        session,
      };
    }

    // Duplicate Attendance Prevention using deterministic ID: ATT_{studentId}_{sessionId}
    const records = this.getAttendanceRecords();
    const deterministicId = `ATT_${student.userId}_${session.sessionId}`;
    const existing = records.find(r => r.sessionId === session.sessionId && r.studentId === student.userId);

    if (existing) {
      return {
        success: false,
        message: `Attendance already marked for this session.`,
        record: existing,
        session,
      };
    }

    const now = new Date();
    const newRecord: AttendanceRecord = {
      attendanceId: deterministicId,
      studentId: student.userId,
      sessionId: session.sessionId,
      classId: session.classId,
      date: session.date,
      time: now.toLocaleTimeString(),
      status: 'PRESENT',
    };

    records.push(newRecord);
    this.setItem(STORAGE_KEYS.ATTENDANCE, records);

    // Save attendance record directly into shared Firestore database
    setDoc(doc(db, 'attendance', deterministicId), newRecord, { merge: true }).catch(err => {
      console.warn('Firestore markAttendance error:', err);
    });

    return { success: true, message: `Attendance Marked Successfully for ${student.name}!`, record: newRecord, session };
  }

  // Statistics calculation helpers
  public static getDashboardStats() {
    const students = this.getStudents().filter(s => s.status === 'active');
    const totalStudents = students.length;

    const activeSession = this.getActiveSession();
    let presentToday = 0;
    let absentToday = 0;

    if (activeSession) {
      const records = this.getAttendanceForSession(activeSession.sessionId);
      presentToday = records.filter(r => r.status === 'PRESENT').length;
      absentToday = records.filter(r => r.status === 'ABSENT').length;
    } else {
      const todayRecords = this.getAttendanceRecords().filter(r => r.date === TODAY_STR);
      presentToday = todayRecords.filter(r => r.status === 'PRESENT').length;
      absentToday = todayRecords.filter(r => r.status === 'ABSENT').length;
    }

    const totalMarked = presentToday + absentToday;
    const percentage = totalMarked > 0 ? Math.round((presentToday / totalMarked) * 100) : 100;

    return {
      totalStudents,
      presentCount: presentToday,
      absentCount: absentToday,
      percentage,
      activeSession,
    };
  }

  public static getStudentStats(studentId: string) {
    const records = this.getAttendanceRecords().filter(r => r.studentId === studentId);
    const totalSessions = records.length;
    const presentCount = records.filter(r => r.status === 'PRESENT').length;
    const absentCount = records.filter(r => r.status === 'ABSENT').length;
    const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    return {
      totalSessions,
      presentCount,
      absentCount,
      percentage,
      records: records.sort((a, b) => b.date.localeCompare(a.date)),
    };
  }

  public static updateClassGeofence(
    classId: string,
    data: { classroomName?: string; latitude: number; longitude: number; radius: number; geofenceActive?: boolean }
  ) {
    const classes = this.getClasses();
    const cls = classes.find(c => c.classId === classId);
    if (cls) {
      cls.classroomName = data.classroomName;
      cls.latitude = data.latitude;
      cls.longitude = data.longitude;
      cls.radius = data.radius;
      cls.geofenceActive = true;
      this.setItem(STORAGE_KEYS.CLASSES, classes);

      // Save updated geofence to shared Firestore collection
      setDoc(doc(db, 'classes', classId), cls, { merge: true }).catch(err => {
        console.warn('Firestore updateClassGeofence error:', err);
      });
    }
  }

  // TimeTable
  public static getTimeTable(): TimeTableLecture[] {
    return this.getItem<TimeTableLecture[]>(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE);
  }

  private static getDayName(d: Date): DayOfWeek {
    const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getDay()];
  }

  public static getLecturesForDate(date: Date): { lectures: TimeTableLecture[]; dayOfWeek: DayOfWeek; dateStr: string } {
    const dayOfWeek = this.getDayName(date);
    const dateStr = date.toISOString().split('T')[0];
    const all = this.getTimeTable();

    const matching = all.filter(l => {
      if (l.specificDate) {
        return l.specificDate === dateStr;
      }
      return l.dayOfWeek === dayOfWeek;
    });

    matching.sort((a, b) => {
      const parseTime = (t: string) => {
        const [timePart, period] = t.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + (minutes || 0);
      };
      return parseTime(a.startTime) - parseTime(b.startTime);
    });

    return {
      lectures: matching,
      dayOfWeek,
      dateStr,
    };
  }
}

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (val: number) => (val * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Ensure storage & Firestore listeners are initialized on module load
StorageService.init();
