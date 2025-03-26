import {AppExpress} from "../app";
import {AuthenticationJWTMiddleware} from "./middleware/AuthenticationJWTMiddleware";
import {Request, Response} from "express";
import {
    createFileOrDirectory,
    deleteFileOrDirectory,
    listDirectory,
    moveFileOrDirectory,
    renameFileOrDirectory, uploadFiles
} from "../utils/FileSystemUtils";


AppExpress.post("/media/upload", AuthenticationJWTMiddleware, async (req: any, res: Response) => {
    try {
        if (!req.files || !req.body.pathname) {
            res.status(417).json({ error: "Files or directory not provided" });
            return;
        }
        const pathname = req.body.pathname; // Extract directory
        const files = (req.files as {files: any[]}).files;
        const filePaths = await uploadFiles(pathname, files);
        res.json({
            message: "Files uploaded successfully",
            paths: filePaths
        });

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


AppExpress.post('/media/create', AuthenticationJWTMiddleware, (req: Request, res: Response) => {
    const {pathname} = req.body;
    createFileOrDirectory(pathname, true);
    res.status(200).json({message: `Created directory ${pathname}`});
});


AppExpress.delete('/media/delete', AuthenticationJWTMiddleware, (req: Request, res: Response) => {
    const {pathname} = req.body;
    deleteFileOrDirectory(pathname);
    res.status(200).json({message: `Deleted: ${pathname}`});
});


AppExpress.put('/media/rename', AuthenticationJWTMiddleware, (req: Request, res: Response) => {
    const {pathnameOld, pathnameNew} = req.body;
    renameFileOrDirectory(pathnameOld, pathnameNew);
    res.status(200).json({message: `Renamed from ${pathnameOld} to ${pathnameNew}`});
});


AppExpress.get('/media/list', AuthenticationJWTMiddleware, (req: Request, res: Response) => {
    const pathname = req.query.path || '';
    const files = listDirectory(pathname as string);
    res.status(200).json({files});
});

AppExpress.post('/media/move', AuthenticationJWTMiddleware, (req: Request, res: Response) => {
    const {pathnameOld, pathnameNew} = req.body;
    moveFileOrDirectory(pathnameOld, pathnameNew);
    res.status(200).json({message: `Moved ${pathnameOld} to ${pathnameNew}`})
});
