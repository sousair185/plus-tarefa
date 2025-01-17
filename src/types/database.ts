import { Timestamp } from 'firebase/firestore';

export type Profile = {
  id: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Timestamp;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  assignedTo: string | null;
  assignedUserName?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  subtasks: Subtask[];
};

export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};