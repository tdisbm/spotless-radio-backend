import {AuthMiddleware, IsAdminMiddleware} from "./middleware/AuthMiddleware";
import {Request, Response, Router} from "express";
import {
    createFileOrDirectory,
    deleteFileOrDirectory,
    listDirectory,
    moveFileOrDirectory,
    renameFileOrDirectory,
    uploadFiles
} from "../utils/FileSystemUtils";
import {deleteByPath, updateTracks} from "../service/TrackService";
import path from "node:path";


const router: Router = Router();

router.post("/media/upload", [AuthMiddleware, IsAdminMiddleware], async (req: any, res: Response) => {
    try {
        if (!req.files || !req.body.pathname) {
            res.status(417).json({error: "Files or directory not provided"});
            return;
        }
        const pathname = req.body.pathname; // Extract directory
        const files = (req.files as { files: any[] }).files;
        const filePaths = await uploadFiles(pathname, files);
        res.json({
            message: "Files uploaded successfully",
            paths: filePaths
        });

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({error: "Internal server error"});
    }
});


router.post('/media/create', [AuthMiddleware, IsAdminMiddleware], async (req: Request, res: Response) => {
    const {pathname} = req.body;
    createFileOrDirectory(pathname, true);
    res.status(200).json({message: `Created directory ${pathname}`});
});


router.delete('/media/delete', [AuthMiddleware, IsAdminMiddleware], async (req: Request, res: Response) => {
    const {pathname} = req.body;
    deleteFileOrDirectory(pathname);
    await deleteByPath(pathname);
    res.status(200).json({message: `Deleted: ${pathname}`});
});


router.put('/media/rename', [AuthMiddleware, IsAdminMiddleware], async (req: Request, res: Response) => {
    const {pathnameOld, pathnameNew} = req.body;
    const pathOld: string = path.normalize(pathnameOld);
    const pathNew: string = path.normalize(pathnameNew);
    renameFileOrDirectory(pathOld, pathNew);
    await updateTracks(pathOld, pathNew);
    res.status(200).json({message: `Renamed from ${pathnameOld} to ${pathnameNew}`});
});


router.get('/media/list', [AuthMiddleware, IsAdminMiddleware], async (req: Request, res: Response) => {
    const pathname = req.query.path || '';
    const files = listDirectory(pathname as string);
    res.status(200).json({files});
});

router.post('/media/move', [AuthMiddleware, IsAdminMiddleware], async (req: Request, res: Response) => {
    const {pathnameOld, pathnameNew} = req.body;
    const pathOld: string = path.normalize(pathnameOld);
    const pathNew: string = path.normalize(pathnameNew);
    moveFileOrDirectory(pathOld, pathNew);
    await updateTracks(pathOld, pathNew);
    res.status(200).json({message: `Moved ${pathnameOld} to ${pathnameNew}`})
});


export default router;
