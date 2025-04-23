import * as fs from "fs";
import * as fsPromises from "fs/promises";
import path from "node:path";
import {spawnSync} from "node:child_process";


export async function uploadFiles(root: string, files: any) {
    if (!fs.existsSync(root)) {
        fs.mkdirSync(root, {recursive: true});
    }

    const filePaths: string[] = [];
    try {
        for (const file of files) {
            const fileName = file.name;
            const savePath = path.join(root, fileName);
            await file.mv(savePath);
            filePaths.push(savePath);
        }
    } catch (e) {
        for (const path of filePaths) {
            fs.unlinkSync(path);
        }
        throw e;
    }

    return filePaths;
}

export async function deleteFiles(filePaths: string[]) {
    const tempDir: string = './.temp'
    const stagedFiles: { original: string; staged: string }[] = [];
    try {
        await fsPromises.mkdir(tempDir, {recursive: true});
        for (const file of filePaths) {
            const fileName: string = path.basename(file);
            const stagedPath: string = path.join(tempDir, fileName);
            await fsPromises.rename(file, stagedPath);
            stagedFiles.push({original: file, staged: stagedPath});
        }
        await Promise.all(stagedFiles.map(f => fsPromises.unlink(f.staged)));
    } catch (error) {
        for (const file of stagedFiles) {
            await fsPromises.rename(file.staged, file.original);
        }
        throw new Error(`Deletion failed and was rolled back. Reason: ${error}`);
    }
}

export async function renameFiles(renameOps: { id: string, oldPath: string; newName: string }[]) {
    const renamedFiles: { id: string, from: string, to: string }[] = [];
    try {
        for (const {id, oldPath, newName} of renameOps) {
            const oldPathDir = path.dirname(oldPath);
            const newPath = path.join(oldPathDir, newName);

            try {
                await fsPromises.access(newPath);
                throw new Error(`File already exists: ${newPath}`);
            } catch {
                // File does not exist, proceed
            }

            await fsPromises.rename(oldPath, newPath);
            renamedFiles.push({
                id: id,
                from: oldPath,
                to: newPath
            });
        }
        return renamedFiles;
    } catch (err) {
        // Rollback
        for (const {from, to} of renamedFiles.reverse()) {
            try {
                await fsPromises.rename(to, from);
            } catch (rollbackErr) {
                console.warn(`⚠️ Failed rollback ${to} → ${from}`, rollbackErr);
            }
        }
        throw new Error(`Filesystem rename failed: ${err.message}`);
    }
}

export function createDirRecursive(path, recursive: boolean = true) {
    fs.mkdirSync(path, {recursive});
}

export function createFifo(fifoPath: string) {
    createDirRecursive(path.dirname(fifoPath));
    if (!fs.existsSync(fifoPath)) {
        spawnSync('mkfifo', [fifoPath]);
    }
}
