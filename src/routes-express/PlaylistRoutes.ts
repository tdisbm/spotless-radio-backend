import {AuthMiddleware, IsAdminMiddleware} from "./middleware/AuthMiddleware";
import {createPlaylist, updatePlaylist} from "../database/repository/PlaylistRepository";
import {Playlist} from "../database/models/Playlist";
import {Router} from "express";
import {Track} from "../database/models/Track";


const router: Router = Router();

router.get('/list', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    try {
        response.status(200);
        response.send((await Playlist.findAll({
            include: [{model: Track}]
        })).map(p => p.dataValues));
    } catch (e) {
        response.status(500);
        response.send({message: e.toString()});
    }
});

router.get('/details', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    response.status(200);
    response.send((await Playlist.findByPk(request.query.id)).dataValues);
});

router.post('/create', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    await createPlaylist(request.body);
    response.status(200);
    response.send({message: 'Created'});
});


router.post('/update', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    await updatePlaylist(request.body);
    response.status(200);
    response.send({message: 'Updated'});
})


export default router;
