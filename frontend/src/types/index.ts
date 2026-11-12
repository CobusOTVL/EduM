export type SubjectId = 
  | 'math_prof'
  | 'math_base'
  | 'russian'
  | 'physics'
  | 'informatics'
  | 'social'
  | 'chemistry'
  | 'biology'
  | 'history'
  | 'english';

export interface SubjectInfo {
  id: SubjectId;
  name: string;
  defaultTasksCount: number;
  defaultMaxScores: number[];
  conversionScale: Record<number, number>; // primary score -> secondary score (0..100)
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  name: string; // Полное ФИО (Фамилия Имя Отчество)
  role?: string;
  subject?: string;
  school?: string;
  bio?: string;
  phone?: string;
  password?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
}

export interface Student {
  id: string;
  userId?: string;
  classId: string;
  fullName: string;
  createdAt: string;
}

export interface SchoolClass {
  id: string;
  userId?: string;
  number: number;
  letter: string;
  subject: string;
  description?: string;
  createdAt: string;
}

export interface TaskSpec {
  taskNumber: number;
  maxScore: number;
}

export interface MockTest {
  id: string;
  userId?: string;
  title: string;
  date: string;
  classId: string;
  subject: string;
  academicYear: string;
  tasks: TaskSpec[];
  maxPrimaryScore: number;
  passingScoreSecondary: number;
  createdAt: string;
}

export interface StudentTaskScore {
  studentId: string;
  scores: Record<number, number>; // taskNumber -> score
  primaryScore: number;
  secondaryScore: number;
}

export interface MockTestResultSheet {
  id: string;
  mockTestId: string;
  studentScores: Record<string, StudentTaskScore>; // studentId -> StudentTaskScore
  updatedAt: string;
}

export interface ClassAnalyticsSummary {
  totalStudents: number;
  attendedStudents: number;
  avgPrimary: number;
  avgSecondary: number;
  maxSecondary: number;
  minSecondary: number;
  passingThreshold: number;
  passedCount: number;
  passedPercent: number;
  highAchieversCount: number; // 80+
  highAchieversPercent: number;
  scoreDistribution: {
    range: string;
    count: number;
    percent: number;
  }[];
  taskSolvability: {
    taskNumber: number;
    maxScore: number;
    avgScore: number;
    percent: number;
  }[];
}
