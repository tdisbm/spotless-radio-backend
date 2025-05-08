import bcrypt from 'bcryptjs';
import { AuthUser } from '../database/models/AuthUser';
import { JWTTokenGenerate } from '../utils/AuthUtils';
import { createUserSignUp, findUserByUsername, UserNotFoundError } from '../database/repository/AuthUserRepository';
import { Router } from 'express';

const router: Router = Router();

router.post('/sign-in', async (request, response) => {
    let responseStat: number;
    let responseData: any;
    try {
        const username: string = request.body.username;
        const password: string = request.body.password;
        const user: AuthUser = await findUserByUsername(username);
        if (!(await bcrypt.compare(password, user.password))) {
            responseStat = 417;
            responseData = { message: 'Incorrect password' };
        } else {
            const userData = await user.toJSON();
            const roles = userData.roles.map((role: any) => role.role); // Extrage rolurile
            responseStat = 200;
            responseData = {
                token: JWTTokenGenerate(userData),
                roles,
            };
        }
    } catch (e) {
        responseStat = e instanceof UserNotFoundError ? 404 : 500;
        responseData = { message: e.toString() };
    }
    response.status(responseStat).json(responseData);
});

router.post('/sign-up', async (request, response) => {
    const user: AuthUser = await createUserSignUp({ ...request.body });
    const userData = await user.toJSON();
    const authToken = JWTTokenGenerate(userData);
    const roles = userData.roles.map((role: any) => role.role); // extract roles
    response.status(200).json({ token: authToken, roles }); // add roles in response
});

export default router;