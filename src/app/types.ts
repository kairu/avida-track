export enum Roles {
    SUPER_ADMINISTRATOR = 'SU_ADMIN',
    ADMINISTRATOR = 'ADMIN',
    OWNER = 'TENANT',
    GUEST = 'GUEST',
  }
  
//   export interface Role {
//     id: number;
//     name: string;
//     uid: string; // Unique identifier for access checks
//     extends?: number | null; // ID of the role to be extended (e.g., STAFF extends USER)
//   }
  
//   export interface User {
//     id: number;
//     name: string;
//     role: Role;
//   }
  