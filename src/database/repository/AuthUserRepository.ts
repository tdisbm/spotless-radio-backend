import {AuthUser} from "../models/AuthUser";
import {sequelize} from "../index";
import {AuthRole} from "../models/AuthRole";
import {Transaction} from "sequelize";
import bcrypt from "bcryptjs";


export class UserNotFoundError extends Error {
}


export async function getUsers(skip: number, take: number) {
    return AuthUser.findAll({
        order: [['createdAt', 'DESC']],
        offset: skip,
        limit: take
    });
}

export async function createUserSignUp(userData: any) {
    if (userData.hasOwnProperty('roles')) {
        throw Error('Roles not allowed during sign-up');
    }
    return await createUser(userData);
}

export async function createUser(userData: any) {
    let userDataRoles = userData.roles;
    if (!userDataRoles || !(userDataRoles instanceof Array) || userDataRoles.length === 0) {
        const defaultUserRole: AuthRole = await AuthRole.findOne({where: {isDefault: true}})
        if (defaultUserRole) {
            userDataRoles = [{id: defaultUserRole.id}]
        } else {
            throw Error(
                'Cannot create user without any role assigned. Make sure to provide roles information ' +
                'or have at least one role in database with isDefault=true'
            );
        }
    }
    const transaction: Transaction = await sequelize.transaction();
    try {
        userData.password = await bcrypt.hash(userData.password, 10);
        const user: AuthUser = await AuthUser.create(userData, {transaction});
        await user.setRoles(userDataRoles.map(r => r.id), {transaction});
        await transaction.commit();
        return user;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export async function updateUser(userData: any) {
    if (!userData.hasOwnProperty('id')) {
        throw Error('Illegal update data. Missing "id" field');
    }
    const user: AuthUser = await AuthUser.findOne({where: {id: userData.id}});
    if (user === null) {
        throw Error('Cannot update user. User is missing');
    }
    const transaction: Transaction = await sequelize.transaction();
    try {
        if (userData.roles) {
            const roles = userData.roles;
            delete userData.roles;
            await user.setRoles(roles.map((r: { id: string }) => r.id), {transaction});
        }
        Object.assign(user, userData);
        await user.save({transaction});
        await transaction.commit();
    } catch (e) {
        await transaction.rollback()
    }
    return user;
}

export async function findUserByUsername(username: string) {
    const user: AuthUser = await AuthUser.findOne({
        where: {username},
    });
    validateUser(user);
    return user;
}

export async function findUserById(id: string) {
    const user: AuthUser = await AuthUser.findOne({where: {id}});
    validateUser(user);
    return user;
}

function validateUser(user: AuthUser) {
    if (!user) {
        throw new UserNotFoundError('User does not exist');
    }
}