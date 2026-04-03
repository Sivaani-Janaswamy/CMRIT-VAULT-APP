import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { adminRepository } from '../admin/admin.repository';
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
    const subject = await subjectsRepository.createSubject(input, userId);
    await adminRepository.logAction({
      actorId: userId,
      action: 'admin.subject.created',
      entityType: 'subject',
      entityId: subject.id,
      metadata: {
        code: subject.code,
        name: subject.name,
        department: subject.department,
        semester: subject.semester,
        isActive: subject.isActive
      }
    });

    return subject;
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

    const metadata: Record<string, unknown> = { ...input };

    await adminRepository.logAction({
      actorId: userId,
      action: 'admin.subject.updated',
      entityType: 'subject',
      entityId: subjectId,
      metadata
    });

    return subject;
  }

  async deleteSubject(userId: string, subjectId: string): Promise<SubjectDetail> {
    await this.requireAdmin(userId);
    const subject = await subjectsRepository.softDeleteSubject(subjectId);
    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    await adminRepository.logAction({
      actorId: userId,
      action: 'admin.subject.deleted',
      entityType: 'subject',
      entityId: subjectId,
      metadata: { isActive: false }
    });

    return subject;
  }
}

export const subjectsService = new SubjectsService();
