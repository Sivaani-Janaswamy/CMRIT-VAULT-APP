import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { usersRepository } from '../users/users.repository';
import { subjectsRepository } from './subjects.repository';
import type {
  CreateSubjectInput,
  Subject,
  SubjectDetail,
  UpdateSubjectInput
} from './subjects.types';

class SubjectsService {
  async listSubjects(): Promise<Subject[]> {
    return subjectsRepository.findAll();
  }

  async getSubject(_userId: string, subjectId: string): Promise<SubjectDetail> {
    const subject = await subjectsRepository.findById(subjectId);
    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    return subject;
  }

  private async requireAdmin(userId: string): Promise<void> {
    const currentUser = await usersRepository.findAccessContextById(userId);
    if (!currentUser || !currentUser.isActive || currentUser.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }
  }

  async createSubject(userId: string, input: CreateSubjectInput): Promise<SubjectDetail> {
    await this.requireAdmin(userId);
    return subjectsRepository.createSubject(input, userId);
  }

  async updateSubject(
    userId: string,
    subjectId: string,
    input: UpdateSubjectInput
  ): Promise<SubjectDetail> {
    await this.requireAdmin(userId);
    const subject = await subjectsRepository.updateSubject(subjectId, input);
    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    return subject;
  }

  async deleteSubject(userId: string, subjectId: string): Promise<SubjectDetail> {
    await this.requireAdmin(userId);
    const subject = await subjectsRepository.softDeleteSubject(subjectId);
    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    return subject;
  }
}

export const subjectsService = new SubjectsService();
