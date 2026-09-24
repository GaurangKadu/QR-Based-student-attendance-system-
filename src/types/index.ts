export interface User {
  userId: string;       // Unique ID e.g., Teacher1 or STU101
  name: string;
  email: string;        // Login ID or Email
  password?: string;    // Auth credential
  role: 'teacher' | 'student';
  rollNo?: string;      // e.g., 201
  classId?: string;     // Reference to classes collection
  qrId?: string;        // Unique QR payload identifier
  status: 'active' | 'deactivated';
  createdAt: string;
}

export interface ClassItem {
  classId: string;
  className: string;    // e.g., "SE IT - Division A"
  year?: string;         // e.g., "2nd Year"
  semester: string;     // e.g., "SEM IV"
  division: string;     // e.g., "A"
  subject: string;      // e.g., "Data Structures"
  totalStudents?: number; // e.g., 60
}

export interface AttendanceSession {
  sessionId: string;
  classId: string;
  subject: string;
  teacherId: string;
  date: string;         // YYYY-MM-DD
  startTime: string;    // HH:MM
  endTime?: string;     // HH:MM
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface AttendanceRecord {
  attendanceId: string;
  studentId: string;
  sessionId: string;
  classId: string;
  date: string;         // YYYY-MM-DD
  time: string;         // HH:MM:SS
  status: 'PRESENT' | 'ABSENT';
}

export interface AttendanceStats {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  percentage: number;
}
