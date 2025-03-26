import * as config from '../config/storage.json'
import * as fs from "fs";
import path from "node:path";


const ROOT_PATH = __dirname + '../../../' + config.directory

export async function uploadFiles(pathname: string, files: any) {
    const targetPath = path.join(ROOT_PATH, pathname);
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
    }

    if (!Array.isArray(files)) {
        files = [files];
    }

    const filePaths: string[] = [];
    for (const file of files) {
        const fileName = file.name;
        const savePath = path.join(targetPath, fileName);
        await file.mv(savePath);
        filePaths.push(savePath);
    }
    return filePaths;
}

export function createFileOrDirectory(pathname: string, isDirectory: boolean = false): boolean {
    try {
        const absPath = ROOT_PATH + '/' + pathname;
        if (isDirectory) {
            fs.mkdirSync(absPath, {recursive: true});
        } else {
            fs.writeFileSync(absPath, '', 'utf8');
        }
        return true;
    } catch (error) {
        return false;
    }
}

export function deleteFileOrDirectory(pathname: string): boolean {
    try {
        const absPath = ROOT_PATH + '/' + pathname;
        if (fs.lstatSync(absPath).isDirectory()) {
            fs.rmdirSync(absPath, {recursive: true});
        } else {
            fs.unlinkSync(absPath);
        }
        return true;
    } catch (error) {
        return false;
    }
}

export function renameFileOrDirectory(oldPath: string, newPath: string): boolean {
    try {
        const absOldPath = ROOT_PATH + '/' + oldPath;
        const absNewPath = ROOT_PATH + '/' + newPath;
        fs.renameSync(absOldPath, absNewPath);
        return true;
    } catch (error) {
        return false;
    }
}

export function listDirectory(pathname: string): any[] {
    try {
        const absPath = ROOT_PATH + '/' + pathname;
        return fs.readdirSync(absPath, {withFileTypes: true}).map(f => ({
            name: f.name,
            isDirectory: f.isDirectory(),
            relativePath: absPath.replace(ROOT_PATH, '')
        }));
    } catch (error) {
        return [];
    }
}

/**
 * file -> dir: /Documents/file.txt, /Backup
 * dir -> dir (move): /Projects/Website, /Backup
 * dir -> dir (same parent): /Projects/OldName, /Projects/NewName
 * dir -> dir (merge): /Work/Reports, /Backup (assuming that Backup/Reports already exists)
 * dir -> dir (own parent): /lvl1/lvl2, /
 * @param oldPath
 * @param newPath
 */
export function moveFileOrDirectory(oldPath: string, newPath: string): void {
    oldPath = ROOT_PATH + '/' + oldPath;
    newPath = ROOT_PATH + '/' + newPath;

    if (!fs.existsSync(oldPath)) {
        throw new Error(`Source path does not exist: ${oldPath}`);
    }

    const isDirectory = fs.statSync(oldPath).isDirectory();
    const targetPath = path.join(newPath, path.basename(oldPath));

    if (oldPath === targetPath) {
        throw new Error("Source and destination paths are identical.");
    }

    if (targetPath.startsWith(oldPath)) {
        throw new Error("Cannot move a directory inside itself.");
    }

    // Ensure destination exists
    if (!fs.existsSync(newPath)) {
        fs.mkdirSync(newPath, { recursive: true });
    }

    try {
        if (isDirectory) {
            // Handle moving a directory
            if (fs.existsSync(targetPath)) {
                // Merge contents if destination directory exists
                fs.readdirSync(oldPath).forEach((file) => {
                    const srcFile = path.join(oldPath, file);
                    const destFile = path.join(targetPath, file);
                    fs.renameSync(srcFile, destFile);
                });
                fs.rmdirSync(oldPath); // Remove old empty directory
            } else {
                // Move the whole directory
                fs.renameSync(oldPath, targetPath);
            }
        } else {
            // Handle moving a file
            fs.renameSync(oldPath, targetPath);
        }
    } catch (error) {
        throw new Error(`Error moving: ${error}`);
    }
}
