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
  classroomName?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;      // in metres
  geofenceActive?: boolean; // whether GPS geofence boundary is currently active
}

export interface AttendanceSession {
  sessionId: string;
  dailyCode?: string;   // 6-digit unique daily attendance passcode e.g., "849201"
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

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface TimeTableLecture {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;      // e.g. "09:00 AM"
  endTime: string;        // e.g. "10:00 AM"
  subject: string;        // e.g. "Data Structures & Algorithms"
  subjectCode: string;    // e.g. "IT401"
  classId: string;        // e.g. "CLASS_SE_IT_A"
  className: string;      // e.g. "SE IT - Div A"
  room: string;           // e.g. "Room 201"
  lectureType: 'Theory' | 'Practical Lab' | 'Tutorial';
  teacherName?: string;   // e.g. "Prof. Rajesh Sharma"
  colorTag?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'rose';
  specificDate?: string;  // Optional specific date YYYY-MM-DD
}
