import {AuthMiddleware, IsAdminMiddleware} from "./middleware/AuthMiddleware";
import {Stream} from "../database/models/Stream";
import {Router} from "express";
import {streamRequest} from "../redis/stream";
import {STREAMS_CHANNEL} from "../config/redis";
import {read} from "../redis/stream-store";


const router: Router = Router();


router.get('/list', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    const streams: Stream[] = await Stream.findAll();
    response.status(200);
    response.send(streams.map(s => s.dataValues));
});

router.get('/stats', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    response.status(200);
    response.send(await read());
});

router.post('/create', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    await Stream.create(request.body);
    response.status(200);
    response.send({message: "Stream created!"});
});

router.put('/update', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    const stream = await Stream.findByPk(request.body.id);
    await stream.update(request.body);
    response.status(200);
    response.send({message: "Stream updated!"})
});

router.delete('/delete', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    await Stream.destroy({where: {id: request.body.streamIds}});
    await streamRequest(STREAMS_CHANNEL, {streamIds: request.body.streamIds, action: 'stop'})
    response.status(200);
    response.send({message: "Streams deleted!"});
});

router.post('/action', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    const statuses = await streamRequest(STREAMS_CHANNEL, request.body, 20000);
    response.status(200);
    response.send({
        message: 'Action performed',
        action: request.body.action,
        statuses: statuses,
    });
});

export default router;
