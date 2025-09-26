// services/index.ts
import { sharedApiService } from './sharedApiService.ts';
import { AdminApiService } from './adminApiService.ts';
import { PrincipalApiService } from './principalApiService.ts';
import { RegistrarApiService } from './registrarApiService.ts';
import { TeacherApiService } from './teacherApiService.ts';
import { StudentApiService } from './studentApiService.ts';
import { ParentApiService } from './parentApiService.ts';
import { LibrarianApiService } from './librarianApiService.ts';

export { sharedApiService };
export const adminApiService = new AdminApiService();
export const principalApiService = new PrincipalApiService();
export const registrarApiService = new RegistrarApiService();
export const teacherApiService = new TeacherApiService();
export const studentApiService = new StudentApiService();
export const parentApiService = new ParentApiService();
export const librarianApiService = new LibrarianApiService();
