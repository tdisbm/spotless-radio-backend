import {AuthUser} from "../database/models/AuthUser";
import {AuthRole} from "../database/models/AuthRole";
import {JWTTokenVerify} from "../utils/AuthUtils";


export async function isAdmin(user: AuthUser) {
    const roles: AuthRole[] = await user.getRoles();
    for (const role of roles) {
        if (role.role === 'ADMIN') {
            return true;
        }
    }
    return false;
}

export async function userFromJWT(token) {
    const tokenDecoded = JWTTokenVerify(token);
    return await AuthUser.findOne(tokenDecoded.id);
}