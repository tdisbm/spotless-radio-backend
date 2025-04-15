import {AuthMiddleware, IsAdminMiddleware} from "./middleware/AuthMiddleware";
import {Request, Response, Router} from "express";
import {createTracks, deleteTracks, renameTracks} from "../service/TrackService";
import {Track} from "../database/models/Track";
import path from "node:path";
import {parseFile} from "music-metadata";


const router: Router = Router();

router.post("/track/upload", [AuthMiddleware, IsAdminMiddleware], async (req: any, res: Response) => {
    try {
        await createTracks(req.files?.files);
        res.status(201).json({});
    } catch (error) {
        res.status(500).json({error: String(error)});
    }
});


router.delete('/track/delete', [AuthMiddleware, IsAdminMiddleware], async (req: Request, res: Response) => {
    try {
        await deleteTracks(req.body); // [id1, id2, id3]
        res.status(201).json({});
    } catch (error) {
        res.status(500).json({error: String(error)});
    }
});


router.put('/track/rename', [AuthMiddleware, IsAdminMiddleware], async (req: Request, res: Response) => {
    try {
        await renameTracks(req.body); // [{id: string, newName: string}, {...}]
        res.status(201).json({});
    } catch (error) {
        res.status(500).json({error: String(error)});
    }
});


router.get('/track/list', [AuthMiddleware, IsAdminMiddleware], async (req: Request, res: Response) => {
    const tracks: Track[] = await Track.findAll();
    const tracksData: any[] = [];
    for (const track of tracks) {
        tracksData.push({
            ...track.dataValues,
            filename: path.basename(track.location),
            meta: await parseFile(track.location)
        })
    }
    res.status(200).json(tracksData);
});


export default router;
