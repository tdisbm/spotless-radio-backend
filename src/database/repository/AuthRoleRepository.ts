import {AuthRole} from "../models/AuthRole";


export async function getAllRoles() {
    return await AuthRole.findAll();
}

export async function createRole(authRoleData: any) {
    return await AuthRole.create(authRoleData);
}