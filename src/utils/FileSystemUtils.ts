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
    const errors: string[] = [];

    for (const filePath of filePaths) {
        if (!filePath) {
            errors.push('File path is undefined or empty');
            continue;
        }

        try {
            const absolutePath = path.resolve(filePath);
            await fsPromises.unlink(absolutePath);
            console.log(`Successfully deleted file: ${absolutePath}`);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                errors.push(`File not found: ${filePath}`);
            } else if (error.code === 'EACCES') {
                errors.push(`Permission denied for file: ${filePath}`);
            } else {
                errors.push(`Failed to delete file ${filePath}: ${error.message}`);
            }
        }
    }

    if (errors.length > 0) {
        throw new Error(`Failed to delete some files: ${errors.join('; ')}`);
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
