import { Role } from '../Types/Role';

export interface RoleRepositoryPort {
    loadRoles(): Promise<Role[]>;
}
