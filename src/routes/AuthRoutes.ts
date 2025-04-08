import bcrypt from "bcryptjs";
import {AuthUser} from "../database/models/AuthUser";
import {JWTTokenGenerate} from "../utils/AuthUtils";
import {createUserSignUp, findUserByUsername, UserNotFoundError} from "../database/repository/AuthUserRepository";
import {Router} from "express";


const router: Router = Router();

router.post('/auth/sign-in', async (request, response) => {
    let responseStat: number;
    let responseData: any;
    try {
        const username: string = request.body.username;
        const password: string = request.body.password
        const user: AuthUser = await findUserByUsername(username);
        if (!(await bcrypt.compare(password, user.password))) {
            responseStat = 417;
            responseData = {message: 'Incorrect password'};
        } else {
            responseStat = 200;
            responseData = JWTTokenGenerate(await user.toJSON());
        }
    } catch (e) {
        responseStat = e instanceof UserNotFoundError ? 417 : 500;
        responseData = {message: e.toString()}
    }
    response.status(responseStat);
    response.send(responseData);
});

router.post('/auth/sign-up', async (request, response) => {
    let responseStat: number;
    let responseData: any;
    try {
        const user: AuthUser = await createUserSignUp({...request.body});
        const authToken = JWTTokenGenerate(await user.toJSON())
        responseStat = 200;
        responseData = authToken;
    } catch (e) {
        responseStat = 500;
        responseData = {message: e.toString()};
    }
    response.status(responseStat);
    response.send(responseData);
});


export default router;
