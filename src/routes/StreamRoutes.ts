import {AuthMiddleware, IsAdminMiddleware} from "./middleware/AuthMiddleware";
import {startStreams, stopStreams} from "../redis/stream-pub";
import {Stream} from "../database/models/Stream";
import {Router} from "express";
import {getALlStreamInfo} from "../redis/stream-store";


const router: Router = Router();


router.get('/stream/list', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    try {
        const streams: Stream[] = await Stream.findAll();
        response.status(200);
        response.send(streams.map(s => s.dataValues));
    } catch (e) {
        response.status(500);
        response.send({message: e.toString()});
    }
});

router.get('/stream/stats', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    try {
        response.status(200);
        response.send(await getALlStreamInfo());
    } catch (e) {
        response.status(500);
        response.send({message: e.toString()});
    }
});

router.post('/stream/create', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    try {
        await Stream.create(request.body);
        response.status(200);
        response.send({message: "Stream created!"});
    } catch (e) {
        response.status(500);
        response.send({message: e.toString()});
    }
});

router.put('/stream/update', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    try {
        const stream = await Stream.findOne({where: {id: request.body.id}});
        await stream.update(request.body);
        response.status(200);
        response.send({message: "Stream updated!"})
    } catch (e) {
        response.status(500);
        response.send({message: e.toString()});
    }
});

router.delete('/stream/delete', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    try {
        await Stream.destroy({where: {id: request.body.streamIds}});
        await stopStreams(request.body.streamIds);
        response.status(200);
        response.send({message: "Streams deleted!"});
    } catch (e) {
        response.status(500);
        response.send({message: e.toString()});
    }
});

router.post('/stream/start', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    try {
        await startStreams(request.body.streamIds);
        response.status(200);
        response.send({message: 'Streams started!'});
    } catch (e) {
        response.status(500);
        response.send({message: e.toString()});
    }
});


router.post('/stream/stop', [AuthMiddleware, IsAdminMiddleware], async (request, response) => {
    try {
        await stopStreams(request.body.streamIds);
        response.status(200);
        response.send({message: 'Streams stopped!'});
    } catch (e) {
        response.status(500);
        response.send({message: e.toString()});
    }
});


export default router;
