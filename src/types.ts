export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  fullName: string;
  username?: string;
  admissionNumber?: string;
  classId?: string;
}

export interface School {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  principalSignatureUrl?: string;
  schoolStampUrl?: string;
  principalStampUrl?: string;
  adminId: string;
}

export interface Class {
  id: string;
  level: 'Nursery' | 'Primary' | 'Junior Secondary' | 'Senior Secondary';
  name: string;
  arm: string;
  schoolId: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  schoolId: string;
}

export interface Student {
  id: string;
  fullName: string;
  gender: 'Male' | 'Female';
  classId: string;
  admissionNumber: string;
  parentName?: string;
  parentPhone?: string;
  schoolId: string;
  userId?: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  schoolId: string;
  userId?: string;
}

export interface Assignment {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  schoolId: string;
}

export interface Session {
  id: string;
  name: string;
  isActive: boolean;
  schoolId: string;
}

export interface Term {
  id: string;
  name: string;
  isActive: boolean;
  sessionId: string;
  schoolId: string;
}

export interface Result {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  sessionId: string;
  termId: string;
  ca1: number;
  ca2: number;
  exam: number;
  total: number;
  grade: string;
  schoolId: string;
}
