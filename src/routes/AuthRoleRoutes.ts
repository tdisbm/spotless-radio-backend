import {AuthMiddleware, IsAdminMiddleware} from "./middleware/AuthMiddleware";
import {getAllRoles} from "../database/repository/AuthRoleRepository";
import {Router} from "express";


const router: Router = Router();

router.get('/auth/role/list', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    response.status(200);
    response.send((await getAllRoles()).map(r => r.dataValues));
});

export default router;