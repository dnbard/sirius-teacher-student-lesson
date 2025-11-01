import { User } from './user.model';

export interface Student {
  id: string;
  user: User;
  instrument: string;
  assignmentId?: string; // Optional: ID of the assignment linking student to teacher
}

