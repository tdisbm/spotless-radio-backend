import {AuthMiddleware, IsAdminMiddleware} from "./middleware/AuthMiddleware";
import {createPlaylist, updatePlaylist} from "../database/repository/PlaylistRepository";
import {Playlist} from "../database/models/Playlist";
import {Router} from "express";


const router: Router = Router();

router.get('/playlist/list', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    try {
        response.status(200);
        response.send((await Playlist.findAll()).map(p => p.dataValues));
    } catch (e) {
        response.status(500);
        response.send({message: e.toString()});
    }
});

router.get('/playlist/details', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    try {
        response.status(200);
        response.send((await Playlist.findOne({where: {id: request.query.id}})).dataValues);
    } catch (e) {
        response.status(500);
        response.send({message: e.toString()});
    }
});

router.post('/playlist/create', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    try {
        await createPlaylist(request.body);
        response.status(200);
        response.send({message: 'Created'});
    } catch (e) {
        response.status(500);
        response.send({message: e.toString()});
    }
});


router.post('/playlist/update', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    try {
        await updatePlaylist(request.body);
        response.status(200);
        response.send({message: 'Updated'});
    } catch (e) {
        response.status(500);
        response.send({message: e.toString()});
    }
})


export default router;
