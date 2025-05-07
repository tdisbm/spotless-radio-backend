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
            responseStat = 200;
            responseData = { token: JWTTokenGenerate(await user.toJSON()) }; // returning JSON object
        }
    } catch (e) {
        responseStat = e instanceof UserNotFoundError ? 404 : 500;
        responseData = { message: e.toString() };
    }
    response.status(responseStat).json(responseData); // using .json() for Content-Type: application/json
});

router.post('/sign-up', async (request, response) => {
    const user: AuthUser = await createUserSignUp({ ...request.body });
    const authToken = JWTTokenGenerate(await user.toJSON());
    response.status(200).json({ token: authToken }); // JSON object
});

export default router;