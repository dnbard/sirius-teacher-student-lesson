import { User } from './user.model';
import { Student } from './student.model';

export interface Teacher {
  id: string;
  user: User;
  instrument: string;
  experience: number;
  students?: Student[];
}

