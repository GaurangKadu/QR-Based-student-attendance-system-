import { User, ClassItem, AttendanceSession, AttendanceRecord } from '../types';

const STORAGE_KEYS = {
  USERS: 'qr_attendance_users',
  CLASSES: 'qr_attendance_classes',
  SESSIONS: 'qr_attendance_sessions',
  ATTENDANCE: 'qr_attendance_records',
  CURRENT_USER: 'qr_attendance_current_user',
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
  },
  {
    classId: 'CLASS_SE_IT_B',
    className: 'SE IT - Div B',
    year: '2nd Year',
    semester: 'Semester IV',
    division: 'B',
    subject: 'Database Management Systems',
    totalStudents: 60,
  },
  {
    classId: 'CLASS_TE_IT_A',
    className: 'TE IT - Div A',
    year: '3rd Year',
    semester: 'Semester VI',
    division: 'A',
    subject: 'Software Engineering',
    totalStudents: 55,
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

const INITIAL_SESSIONS: AttendanceSession[] = [
  {
    sessionId: 'SESS_001',
    classId: 'CLASS_SE_IT_A',
    subject: 'Data Structures & Algorithms',
    teacherId: 'Teacher1',
    date: getPastDateStr(2),
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    status: 'completed',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    sessionId: 'SESS_002',
    classId: 'CLASS_SE_IT_A',
    subject: 'Data Structures & Algorithms',
    teacherId: 'Teacher1',
    date: getPastDateStr(1),
    startTime: '11:15 AM',
    endTime: '12:15 PM',
    status: 'completed',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    sessionId: 'SESS_003',
    classId: 'CLASS_SE_IT_A',
    subject: 'Data Structures & Algorithms',
    teacherId: 'Teacher1',
    date: TODAY_STR,
    startTime: '09:30 AM',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  // Session 001
  { attendanceId: 'ATT_101_1', studentId: 'STU101', sessionId: 'SESS_001', classId: 'CLASS_SE_IT_A', date: getPastDateStr(2), time: '10:02:15', status: 'PRESENT' },
  { attendanceId: 'ATT_102_1', studentId: 'STU102', sessionId: 'SESS_001', classId: 'CLASS_SE_IT_A', date: getPastDateStr(2), time: '10:03:10', status: 'PRESENT' },
  { attendanceId: 'ATT_103_1', studentId: 'STU103', sessionId: 'SESS_001', classId: 'CLASS_SE_IT_A', date: getPastDateStr(2), time: '10:05:40', status: 'PRESENT' },
  { attendanceId: 'ATT_104_1', studentId: 'STU104', sessionId: 'SESS_001', classId: 'CLASS_SE_IT_A', date: getPastDateStr(2), time: '10:15:00', status: 'ABSENT' },

  // Session 002
  { attendanceId: 'ATT_101_2', studentId: 'STU101', sessionId: 'SESS_002', classId: 'CLASS_SE_IT_A', date: getPastDateStr(1), time: '11:18:22', status: 'PRESENT' },
  { attendanceId: 'ATT_102_2', studentId: 'STU102', sessionId: 'SESS_002', classId: 'CLASS_SE_IT_A', date: getPastDateStr(1), time: '11:20:00', status: 'PRESENT' },
  { attendanceId: 'ATT_103_2', studentId: 'STU103', sessionId: 'SESS_002', classId: 'CLASS_SE_IT_A', date: getPastDateStr(1), time: '11:22:11', status: 'PRESENT' },
  { attendanceId: 'ATT_104_2', studentId: 'STU104', sessionId: 'SESS_002', classId: 'CLASS_SE_IT_A', date: getPastDateStr(1), time: '11:25:30', status: 'PRESENT' },

  // Session 003 (Today active session)
  { attendanceId: 'ATT_101_3', studentId: 'STU101', sessionId: 'SESS_003', classId: 'CLASS_SE_IT_A', date: TODAY_STR, time: '09:32:05', status: 'PRESENT' },
  { attendanceId: 'ATT_102_3', studentId: 'STU102', sessionId: 'SESS_003', classId: 'CLASS_SE_IT_A', date: TODAY_STR, time: '09:34:12', status: 'PRESENT' },
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
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
      this.setItem(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
      this.setItem(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      this.setItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    }
  }

  public static resetToDemo(): void {
    this.setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.setItem(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    this.setItem(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    this.setItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
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
    const newSession: AttendanceSession = {
      sessionId: `SESS_${Date.now()}`,
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

  public static markAttendance(sessionId: string, studentIdOrQuery: string): { success: boolean; message: string; record?: AttendanceRecord } {
    const session = this.getSessions().find(s => s.sessionId === sessionId);
    if (!session) {
      return { success: false, message: 'Invalid or expired attendance session.' };
    }
    if (session.status !== 'active') {
      return { success: false, message: 'Attendance session is already completed or inactive.' };
    }

    const student = this.findStudent(studentIdOrQuery) || this.getUserById(studentIdOrQuery);
    if (!student) {
      return { success: false, message: `Student '${studentIdOrQuery}' not found. Please check Roll No or QR code.` };
    }

    if (student.status === 'deactivated') {
      return { success: false, message: `Student account for ${student.name} is currently deactivated.` };
    }

    if (student.classId !== session.classId) {
      const studentClass = this.getClassById(student.classId || '');
      return {
        success: false,
        message: `${student.name} (Roll: ${student.rollNo}) belongs to ${studentClass?.className || 'another class'}, not this session class.`
      };
    }

    const records = this.getAttendanceRecords();
    const existing = records.find(r => r.sessionId === sessionId && r.studentId === student.userId);

    if (existing) {
      if (existing.status === 'PRESENT') {
        return { success: false, message: `Duplicate scan! ${student.name} (Roll: ${student.rollNo}) is already marked PRESENT.` };
      } else {
        // Update ABSENT to PRESENT if previously auto-marked absent
        existing.status = 'PRESENT';
        existing.time = new Date().toLocaleTimeString();
        this.setItem(STORAGE_KEYS.ATTENDANCE, records);
        return { success: true, message: `Attendance updated to PRESENT for ${student.name}`, record: existing };
      }
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
    return { success: true, message: `Attendance marked PRESENT for ${student.name} (Roll: ${student.rollNo})`, record: newRecord };
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
}

// Ensure storage is initialized on module load
StorageService.init();
