// services/index.ts

// ✅ STEP 1: Import all the service CLASSES.
import { SharedApiService } from "./sharedApiService.ts";
import { AdminApiService } from "./adminApiService.ts";
import { PrincipalApiService } from "./principalApiService.ts";
import { RegistrarApiService } from "./registrarApiService.ts";
import { TeacherApiService } from "./teacherApiService.ts";
import { StudentApiService } from "./studentApiService.ts";
import { ParentApiService } from "./parentApiService.ts";
import { LibrarianApiService } from "./librarianApiService.ts";

// ✅ STEP 2: Export the classes themselves, not instances.
// This is the modern, recommended pattern for flexibility and testability.
export {
  SharedApiService,
  AdminApiService,
  PrincipalApiService,
  RegistrarApiService,
  TeacherApiService,
  StudentApiService,
  ParentApiService,
  LibrarianApiService,
};
