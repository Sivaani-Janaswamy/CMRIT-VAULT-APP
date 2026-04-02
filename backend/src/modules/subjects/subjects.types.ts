export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface SubjectDetail {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectInput {
  code: string;
  name: string;
  department: string;
  semester: number;
  isActive?: boolean;
}

export interface UpdateSubjectInput {
  code?: string;
  name?: string;
  department?: string;
  semester?: number;
  isActive?: boolean;
}
