import {AuthUser} from "../database/models/AuthUser";
import {AuthRole} from "../database/models/AuthRole";

export async function isAdmin(user: AuthUser) {
    const roles: AuthRole[] = await user.getRoles();
    for (const role of roles) {
        if (role.role === 'ADMIN') {
            return true;
        }
    }
    return false;
}