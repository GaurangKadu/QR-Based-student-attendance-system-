import { User } from '../types';
import { StorageService } from './storageService';

const AUTH_KEY = 'qr_attendance_auth_user';

export class AuthService {
  public static getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore parsing error
    }
    return null;
  }

  public static setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }

  public static login(
    idOrEmail: string,
    pass: string,
    expectedRole?: 'teacher' | 'student'
  ): { success: boolean; user?: User; message: string } {
    const trimmedId = idOrEmail.trim();
    if (!trimmedId) {
      return { success: false, message: 'Please enter your ID, Email, or Roll Number.' };
    }

    const users = StorageService.getUsers();

    const found = users.find(
      u => (u.userId.toLowerCase() === trimmedId.toLowerCase() ||
            u.email.toLowerCase() === trimmedId.toLowerCase() ||
            (u.rollNo && u.rollNo.toLowerCase() === trimmedId.toLowerCase()))
    );

    if (!found) {
      return { success: false, message: 'User not found. Please check your ID or Roll Number.' };
    }

    if (expectedRole && found.role !== expectedRole) {
      const otherTab = found.role === 'teacher' ? 'Teacher Login' : 'Student Login';
      return {
        success: false,
        message: `Account "${found.name}" is a ${found.role.toUpperCase()}. Please switch to the ${otherTab} tab.`
      };
    }

    if (found.status === 'deactivated') {
      return { success: false, message: 'This account has been deactivated. Please contact your administrator.' };
    }

    if (found.password && found.password !== pass) {
      return { success: false, message: 'Incorrect Password. Please check your credentials.' };
    }

    this.setCurrentUser(found);
    return { success: true, user: found, message: `Successfully logged in as ${found.name}` };
  }

  public static logout(): void {
    localStorage.removeItem(AUTH_KEY);
  }
}
