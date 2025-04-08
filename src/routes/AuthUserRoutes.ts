import {AuthMiddleware, IsAdminMiddleware} from "./middleware/AuthMiddleware";
import {createUser, findUserById, getUsers, updateUser} from "../database/repository/AuthUserRepository";
import {isAdmin} from "../service/AuthUserService";
import {Router} from "express";


const router: Router = Router();

router.get('/auth/user/list', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    let responseStat: number;
    let responseData: any;
    try {
        const params: { skip: string, take: string } = (request.query as { skip: string, take: string });
        const skip = +params.skip;
        const take = +params.take; //request.query.take
        const users = await getUsers(+skip, take);
        responseStat = 200;
        responseData = users.map(u => u.dataValues);
    } catch (e) {
        responseStat = 500;
        responseData = {message: e.toString()}
    }
    response.status(responseStat);
    response.send(responseData);
});


router.get('/auth/user/details', [AuthMiddleware], async (request, response) => {
    const userId = request.query.id || request.user.id;
    const authUser = request.user;
    const isAuthUserAdmin = await isAdmin(authUser);
    let responseStat: number;
    let responseData: any;
    try {
        if (!isAuthUserAdmin && userId !== authUser.id) {
            responseStat = 405
            responseData = {message: "You can't see other user's data"}
        } else {
            responseStat = 200;
            responseData = (await findUserById(userId)).dataValues;
        }
    } catch (e) {
        responseStat = 500;
        responseData = {message: e.toString()}
    }
    response.status(responseStat);
    response.send(responseData);
});

router.post('/auth/user/create', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    try {
        await createUser(request.body);
        response.status(200)
        response.send({message: 'Created!'})
    } catch (e) {
        response.status(500);
        response.send({message: e.toString()});
    }
});


router.post('/auth/user/update', [AuthMiddleware], async (request, response) => {
    const userId = request.query.id || request.user.id;
    const authUser = request.user;
    let responseStat: number;
    let responseData: any;
    try {
        const isAuthUserAdmin = await isAdmin(authUser);
        if (!isAuthUserAdmin && userId !== authUser.id) {
            responseStat = 405
            responseData = {message: "You can't update other user's data"}
        } else {
            responseStat = 200;
            responseData = updateUser(request.body);
        }
    } catch (e) {
        responseStat = 500;
        responseData = {message: e.toString()}
    }
    response.status(responseStat);
    response.send(responseData);
});


export default router;
