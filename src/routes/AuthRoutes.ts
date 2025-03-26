import {AppExpress} from "../app";
import bcrypt from "bcryptjs";
import {AuthUser} from "../database/models/AuthUser";
import {JWTTokenGenerate} from "../utils/AuthUtils";
import {createUserSignUp, findUserByUsername, UserNotFoundError} from "../database/repository/AuthUserRepository";


AppExpress.post('/auth/sign-in', async (request, response) => {
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

AppExpress.post('/auth/sign-up', async (request, response) => {
    let responseStat: number;
    let responseData: any;
    try {
        const passwordHashed = await bcrypt.hash(request.body.password, 10);
        const user: AuthUser = await createUserSignUp({...request.body, password: passwordHashed});
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
