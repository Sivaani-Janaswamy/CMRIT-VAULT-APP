import { subjectsRepository } from './subjects.repository';
import type { Subject } from './subjects.types';

class SubjectsService {
  async listSubjects(): Promise<Subject[]> {
    return subjectsRepository.findAll();
  }
}

export const subjectsService = new SubjectsService();
