import {AuthMiddleware, IsAdminMiddleware} from "./middleware/AuthMiddleware";
import {Request, Response, Router} from "express";
import {createTracks, deleteTracks, renameTracks} from "../service/TrackService";
import {Track} from "../database/models/Track";


const router: Router = Router();

router.post("/upload", [AuthMiddleware, IsAdminMiddleware], async (req: any, res: Response) => {
    await createTracks(req.files?.files);
    res.status(201).json({});
});


router.delete('/delete', [AuthMiddleware, IsAdminMiddleware], async (req: Request, res: Response) => {
    await deleteTracks(req.body); // [id1, id2, id3]
    res.status(201).json({});
});


router.put('/rename', [AuthMiddleware, IsAdminMiddleware], async (req: Request, res: Response) => {
    await renameTracks(req.body); // [{id: string, newName: string}, {...}]
    res.status(201).json({});
});


router.get('/list', [AuthMiddleware, IsAdminMiddleware], async (req: Request, res: Response) => {
    const tracks: Track[] = await Track.findAll();
    res.status(200).json(tracks.map(t => t.dataValues));
});


export default router;
