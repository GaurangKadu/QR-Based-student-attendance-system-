import { User, ClassItem, AttendanceSession, AttendanceRecord, TimeTableLecture, DayOfWeek } from '../types';

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

// Helper to get formatted date
const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const TODAY_STR = new Date().toISOString().split('T')[0];

export function generateDailyCode(seed?: string): string {
  // Generate a clean 6-digit numeric code
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

// Clean Initial State: No fake/sample sessions or dummy attendance logs
const INITIAL_SESSIONS: AttendanceSession[] = [];
const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_TIMETABLE: TimeTableLecture[] = [
  // Monday (4 Lectures)
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
  {
    id: 'TT_MON_3',
    dayOfWeek: 'Monday',
    startTime: '11:30 AM',
    endTime: '01:00 PM',
    subject: 'DSA Coding & Trees Lab',
    subjectCode: 'IT401-P',
    classId: 'CLASS_SE_IT_A',
    className: 'SE IT - Div A',
    room: 'Lab 304 (DSA Lab)',
    lectureType: 'Practical Lab',
    teacherName: 'Prof. Rajesh Sharma',
    colorTag: 'emerald',
  },
  {
    id: 'TT_MON_4',
    dayOfWeek: 'Monday',
    startTime: '02:00 PM',
    endTime: '03:00 PM',
    subject: 'Software Engineering',
    subjectCode: 'IT601',
    classId: 'CLASS_TE_IT_A',
    className: 'TE IT - Div A',
    room: 'Room 301 (Theory Hall)',
    lectureType: 'Theory',
    teacherName: 'Prof. Rajesh Sharma',
    colorTag: 'purple',
  },

  // Tuesday (3 Lectures)
  {
    id: 'TT_TUE_1',
    dayOfWeek: 'Tuesday',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    subject: 'Database Management Systems',
    subjectCode: 'IT402',
    classId: 'CLASS_SE_IT_B',
    className: 'SE IT - Div B',
    room: 'Room 202 (Theory Hall)',
    lectureType: 'Theory',
    teacherName: 'Prof. Rajesh Sharma',
    colorTag: 'indigo',
  },
  {
    id: 'TT_TUE_2',
    dayOfWeek: 'Tuesday',
    startTime: '10:15 AM',
    endTime: '11:15 AM',
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
    id: 'TT_TUE_3',
    dayOfWeek: 'Tuesday',
    startTime: '01:30 PM',
    endTime: '03:30 PM',
    subject: 'DBMS SQL & Query Optimization Lab',
    subjectCode: 'IT402-P',
    classId: 'CLASS_SE_IT_B',
    className: 'SE IT - Div B',
    room: 'Lab 302 (DBMS Lab)',
    lectureType: 'Practical Lab',
    teacherName: 'Prof. Rajesh Sharma',
    colorTag: 'emerald',
  },

  // Wednesday (4 Lectures)
  {
    id: 'TT_WED_1',
    dayOfWeek: 'Wednesday',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    subject: 'Software Engineering',
    subjectCode: 'IT601',
    classId: 'CLASS_TE_IT_A',
    className: 'TE IT - Div A',
    room: 'Room 301 (Theory Hall)',
    lectureType: 'Theory',
    teacherName: 'Prof. Rajesh Sharma',
    colorTag: 'purple',
  },
  {
    id: 'TT_WED_2',
    dayOfWeek: 'Wednesday',
    startTime: '10:15 AM',
    endTime: '11:15 AM',
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
    id: 'TT_WED_3',
    dayOfWeek: 'Wednesday',
    startTime: '11:30 AM',
    endTime: '12:30 PM',
    subject: 'Graph Algorithms & Recursion Tutorial',
    subjectCode: 'IT401-T',
    classId: 'CLASS_SE_IT_A',
    className: 'SE IT - Div A',
    room: 'Room 201 (Theory Hall)',
    lectureType: 'Tutorial',
    teacherName: 'Prof. Rajesh Sharma',
    colorTag: 'amber',
  },
  {
    id: 'TT_WED_4',
    dayOfWeek: 'Wednesday',
    startTime: '02:00 PM',
    endTime: '03:00 PM',
    subject: 'Database Management Systems',
    subjectCode: 'IT402',
    classId: 'CLASS_SE_IT_B',
    className: 'SE IT - Div B',
    room: 'Room 202 (Theory Hall)',
    lectureType: 'Theory',
    teacherName: 'Prof. Rajesh Sharma',
    colorTag: 'indigo',
  },

  // Thursday (3 Lectures)
  {
    id: 'TT_THU_1',
    dayOfWeek: 'Thursday',
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
    id: 'TT_THU_2',
    dayOfWeek: 'Thursday',
    startTime: '10:15 AM',
    endTime: '11:15 AM',
    subject: 'Software Engineering',
    subjectCode: 'IT601',
    classId: 'CLASS_TE_IT_A',
    className: 'TE IT - Div A',
    room: 'Room 301 (Theory Hall)',
    lectureType: 'Theory',
    teacherName: 'Prof. Rajesh Sharma',
    colorTag: 'purple',
  },
  {
    id: 'TT_THU_3',
    dayOfWeek: 'Thursday',
    startTime: '01:30 PM',
    endTime: '03:30 PM',
    subject: 'Agile Sprint & SDLC Project Lab',
    subjectCode: 'IT601-P',
    classId: 'CLASS_TE_IT_A',
    className: 'TE IT - Div A',
    room: 'Lab 305 (Project Lab)',
    lectureType: 'Practical Lab',
    teacherName: 'Prof. Rajesh Sharma',
    colorTag: 'emerald',
  },

  // Friday (3 Lectures)
  {
    id: 'TT_FRI_1',
    dayOfWeek: 'Friday',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    subject: 'Database Management Systems',
    subjectCode: 'IT402',
    classId: 'CLASS_SE_IT_B',
    className: 'SE IT - Div B',
    room: 'Room 202 (Theory Hall)',
    lectureType: 'Theory',
    teacherName: 'Prof. Rajesh Sharma',
    colorTag: 'indigo',
  },
  {
    id: 'TT_FRI_2',
    dayOfWeek: 'Friday',
    startTime: '10:15 AM',
    endTime: '11:15 AM',
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
    id: 'TT_FRI_3',
    dayOfWeek: 'Friday',
    startTime: '11:30 AM',
    endTime: '12:30 PM',
    subject: 'Technical Seminar & Mini-Project',
    subjectCode: 'IT405',
    classId: 'CLASS_SE_IT_A',
    className: 'SE IT - Div A',
    room: 'Seminar Hall 1',
    lectureType: 'Tutorial',
    teacherName: 'Prof. Rajesh Sharma',
    colorTag: 'amber',
  },

  // Saturday (2 Lectures)
  {
    id: 'TT_SAT_1',
    dayOfWeek: 'Saturday',
    startTime: '09:30 AM',
    endTime: '11:30 AM',
    subject: 'Competitive Programming & LeetCode Lab',
    subjectCode: 'IT409-P',
    classId: 'CLASS_SE_IT_A',
    className: 'SE IT - Div A',
    room: 'Lab 304 (DSA Lab)',
    lectureType: 'Practical Lab',
    teacherName: 'Prof. Rajesh Sharma',
    colorTag: 'cyan',
  },
  {
    id: 'TT_SAT_2',
    dayOfWeek: 'Saturday',
    startTime: '12:00 PM',
    endTime: '01:00 PM',
    subject: 'Attendance Review & Remedial Doubt Class',
    subjectCode: 'IT-REV',
    classId: 'CLASS_SE_IT_A',
    className: 'SE IT - Div A',
    room: 'Room 201 (Theory Hall)',
    lectureType: 'Tutorial',
    teacherName: 'Prof. Rajesh Sharma',
    colorTag: 'rose',
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

  // Initialize defaults if empty
  public static init(): void {
    // Purge any previously cached sample sessions and attendance records
    const PURGE_FLAG = 'qr_attendance_samples_cleared_v1';
    if (!localStorage.getItem(PURGE_FLAG)) {
      this.setItem(STORAGE_KEYS.SESSIONS, []);
      this.setItem(STORAGE_KEYS.ATTENDANCE, []);
      localStorage.setItem(PURGE_FLAG, 'true');
    }

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

  public static findStudent(query: string): User | undefined {
    if (!query) return undefined;
    const raw = query.trim();

    // Check if JSON QR payload
    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.userId) {
          const u = this.getUserById(parsed.userId);
          if (u) return u;
        }
        if (parsed.qrId) {
          const u = this.getUserByQRId(parsed.qrId);
          if (u) return u;
        }
        if (parsed.rollNo) {
          const u = this.getStudents().find(s => s.rollNo === parsed.rollNo || s.rollNo === String(parsed.rollNo));
          if (u) return u;
        }
      } catch {
        // ignore parse error
      }
    }

    const clean = raw.toLowerCase().replace(/^[#\s]+/, '').trim();
    const students = this.getStudents();

    // 1. Exact userId match
    const byId = students.find(s => s.userId.toLowerCase() === clean);
    if (byId) return byId;

    // 2. Exact qrId match
    const byQr = students.find(s => s.qrId && s.qrId.toLowerCase() === clean);
    if (byQr) return byQr;

    // 3. Exact rollNo match
    const byRoll = students.find(s => s.rollNo && s.rollNo.toLowerCase() === clean);
    if (byRoll) return byRoll;

    // 4. Exact email match
    const byEmail = students.find(s => s.email.toLowerCase() === clean);
    if (byEmail) return byEmail;

    // 5. Name contains or exact
    const byName = students.find(s => s.name.toLowerCase() === clean || s.name.toLowerCase().includes(clean));
    if (byName) return byName;

    return undefined;
  }

  public static addUser(user: Omit<User, 'createdAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.setItem(STORAGE_KEYS.USERS, users);
    return newUser;
  }

  public static updateUser(userId: string, updates: Partial<User>): User | undefined {
    const users = this.getUsers();
    const index = users.findIndex(u => u.userId === userId);
    if (index === -1) return undefined;

    users[index] = { ...users[index], ...updates };
    this.setItem(STORAGE_KEYS.USERS, users);
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
    const initialLength = users.length;
    users = users.filter(u => u.userId !== userId);
    this.setItem(STORAGE_KEYS.USERS, users);

    // Also clean up associated attendance records
    let records = this.getAttendanceRecords();
    records = records.filter(r => r.studentId !== userId);
    this.setItem(STORAGE_KEYS.ATTENDANCE, records);

    return users.length < initialLength;
  }

  // Class Management
  public static getClasses(): ClassItem[] {
    return this.getItem<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  }

  public static getClassById(classId: string): ClassItem | undefined {
    return this.getClasses().find(c => c.classId === classId);
  }

  public static addClass(classItem: ClassItem): ClassItem {
    const classes = this.getClasses();
    classes.push(classItem);
    this.setItem(STORAGE_KEYS.CLASSES, classes);
    return classItem;
  }

  public static deleteClass(classId: string): void {
    let classes = this.getClasses();
    classes = classes.filter(c => c.classId !== classId);
    this.setItem(STORAGE_KEYS.CLASSES, classes);
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
    
    // First look in active sessions
    const active = sessions.filter(s => s.status === 'active');
    
    // 1. Match active dailyCode
    const matchActiveCode = active.find(s => s.dailyCode && s.dailyCode.replace(/[-\s]/g, '').toLowerCase() === clean);
    if (matchActiveCode) return matchActiveCode;

    // 2. Match active sessionId
    const matchActiveId = active.find(s => s.sessionId.toLowerCase() === clean || s.sessionId.toLowerCase().includes(clean));
    if (matchActiveId) return matchActiveId;

    // 3. Match any session dailyCode
    const matchAnyCode = sessions.find(s => s.dailyCode && s.dailyCode.replace(/[-\s]/g, '').toLowerCase() === clean);
    if (matchAnyCode) return matchAnyCode;

    // 4. Match any session ID
    return sessions.find(s => s.sessionId.toLowerCase() === clean);
  }

  public static startSession(classId: string, subject: string, teacherId: string): AttendanceSession {
    const sessions = this.getSessions();
    
    // Close any previous active session for this class
    sessions.forEach(s => {
      if (s.classId === classId && s.status === 'active') {
        s.status = 'completed';
        s.endTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    });

    const now = new Date();
    const newDailyCode = generateDailyCode(`${classId}_${now.toISOString()}`);

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
        records.push({
          attendanceId: `ATT_${student.userId}_${sessionId}`,
          studentId: student.userId,
          sessionId: sessionId,
          classId: session.classId,
          date: session.date,
          time: new Date().toLocaleTimeString(),
          status: 'ABSENT',
        });
      }
    });

    this.setItem(STORAGE_KEYS.ATTENDANCE, records);
    this.setItem(STORAGE_KEYS.SESSIONS, sessions);
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
    studentLon?: number,
    bypassGeofence: boolean = false
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

    // Geofence Validation
    const classItem = this.getClassById(session.classId);
    const isFenceActive = classItem ? (classItem.geofenceActive !== false) : true;
    if (!bypassGeofence && isFenceActive && classItem && classItem.latitude !== undefined && classItem.longitude !== undefined) {
      if (studentLat !== undefined && studentLon !== undefined) {
        const radius = classItem.radius ?? 50; // default 50 metres
        const distance = calculateDistanceMeters(studentLat, studentLon, classItem.latitude, classItem.longitude);

        if (distance > radius) {
          return {
            success: false,
            message: `Outside classroom area (${Math.round(distance)}m away, limit is ${radius}m).`,
            distance: Math.round(distance),
            session,
          };
        }
      }
    }

    const records = this.getAttendanceRecords();
    const existing = records.find(r => r.sessionId === session.sessionId && r.studentId === student.userId);

    if (existing) {
      existing.status = 'PRESENT';
      existing.time = new Date().toLocaleTimeString();
      this.setItem(STORAGE_KEYS.ATTENDANCE, records);
      return { success: true, message: `✓ Attendance Verified & Recorded for ${student.name}!`, record: existing, session };
    }

    const now = new Date();
    const newRecord: AttendanceRecord = {
      attendanceId: `ATT_${student.userId}_${Date.now()}`,
      studentId: student.userId,
      sessionId: session.sessionId,
      classId: session.classId,
      date: session.date,
      time: now.toLocaleTimeString(),
      status: 'PRESENT',
    };

    records.push(newRecord);
    this.setItem(STORAGE_KEYS.ATTENDANCE, records);
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
      // Get today's total records across completed sessions today
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

  public static updateClassGeofence(classId: string, data: { classroomName?: string; latitude: number; longitude: number; radius: number; geofenceActive?: boolean }) {
    const classes = this.getClasses();
    const cls = classes.find(c => c.classId === classId);
    if (cls) {
      cls.classroomName = data.classroomName;
      cls.latitude = data.latitude;
      cls.longitude = data.longitude;
      cls.radius = data.radius;
      if (data.geofenceActive !== undefined) {
        cls.geofenceActive = data.geofenceActive;
      }
      this.setItem(STORAGE_KEYS.CLASSES, classes);
    }
  }

  // Timetable Management
  public static getTimeTable(): TimeTableLecture[] {
    return this.getItem<TimeTableLecture[]>(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE);
  }

  public static addTimeTableLecture(lecture: Omit<TimeTableLecture, 'id'>): TimeTableLecture {
    const list = this.getTimeTable();
    const newLecture: TimeTableLecture = {
      ...lecture,
      id: `TT_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };
    list.push(newLecture);
    this.setItem(STORAGE_KEYS.TIMETABLE, list);
    return newLecture;
  }

  public static updateTimeTableLecture(lecture: TimeTableLecture): void {
    const list = this.getTimeTable();
    const idx = list.findIndex(l => l.id === lecture.id);
    if (idx !== -1) {
      list[idx] = lecture;
      this.setItem(STORAGE_KEYS.TIMETABLE, list);
    }
  }

  public static deleteTimeTableLecture(id: string): void {
    const list = this.getTimeTable().filter(l => l.id !== id);
    this.setItem(STORAGE_KEYS.TIMETABLE, list);
  }

  public static getDayName(date: Date): DayOfWeek {
    const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  public static getLecturesForDay(day: DayOfWeek): TimeTableLecture[] {
    return this.getTimeTable()
      .filter(l => l.dayOfWeek === day && !l.specificDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  public static getLecturesForDate(date: Date): { lectures: TimeTableLecture[]; dayOfWeek: DayOfWeek; dateStr: string } {
    const dayOfWeek = this.getDayName(date);
    const dateStr = date.toISOString().split('T')[0];
    const all = this.getTimeTable();

    // Matching day of week OR specific date override
    const matching = all.filter(l => {
      if (l.specificDate) {
        return l.specificDate === dateStr;
      }
      return l.dayOfWeek === dayOfWeek;
    });

    // Helper sort function for "09:00 AM" style times
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

// Ensure storage is initialized on module load
StorageService.init();
