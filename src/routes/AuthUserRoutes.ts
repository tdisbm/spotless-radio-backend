import {AuthMiddleware, IsAdminMiddleware} from "./middleware/AuthMiddleware";
import {createUser, findUserById, getUsers, updateUser} from "../database/repository/AuthUserRepository";
import {isAdmin} from "../service/AuthUserService";
import {Router} from "express";


const router: Router = Router();

router.get('/list', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    const params: { skip: string, take: string } = (request.query as { skip: string, take: string });
    const skip = +params.skip;
    const take = +params.take; //request.query.take
    const users = await getUsers(+skip, take);
    response.status(200);
    response.send(users.map(u => u.dataValues));
});


router.get('/details', [AuthMiddleware], async (request, response) => {
    const userId = request.query.id || request.user.id;
    const authUser = request.user;
    const isAuthUserAdmin = await isAdmin(authUser);
    let responseStat: number;
    let responseData: any;
    if (!isAuthUserAdmin && userId !== authUser.id) {
        responseStat = 405
        responseData = {message: "You can't see other user's data"}
    } else {
        responseStat = 200;
        responseData = (await findUserById(userId)).dataValues;
    }
    response.status(responseStat);
    response.send(responseData);
});

router.post('/create', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    await createUser(request.body);
    response.status(200)
    response.send({message: 'Created!'})
});


router.post('/update', [AuthMiddleware], async (request, response) => {
    const userId = request.query.id || request.user.id;
    const authUser = request.user;
    let responseStat: number;
    let responseData: any;
    const isAuthUserAdmin = await isAdmin(authUser);
    if (!isAuthUserAdmin && userId !== authUser.id) {
        responseStat = 405
        responseData = {message: "You can't update other user's data"}
    } else {
        responseStat = 200;
        responseData = updateUser(request.body);
    }
    response.status(responseStat);
    response.send(responseData);
});


export default router;
