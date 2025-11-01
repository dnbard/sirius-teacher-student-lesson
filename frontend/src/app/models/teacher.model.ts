import { User } from './user.model';

export interface Teacher {
  id: string;
  user: User;
  instrument: string;
  experience: number;
}

