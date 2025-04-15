import {Track} from "../database/models/Track";
import {sequelize} from "../database";
import {Op, Transaction} from "sequelize";
import {deleteFiles, renameFiles, uploadFiles} from "../utils/FileSystemUtils";
import {TRACKS_ROOT_PATH} from "../config/filesystem";
import path from "node:path";


export async function createTracks(files: any) {
    if (!Array.isArray(files)) {
        files = [files];
    }
    const transaction: Transaction = await sequelize.transaction();
    try {
        await Track.bulkCreate(
            files.map(f => ({
                location: path.normalize(TRACKS_ROOT_PATH + f.name)
            }))
        );
        await transaction.commit();
        return await uploadFiles(TRACKS_ROOT_PATH, files);
    } catch (e) {
        await transaction.rollback();
        throw e;
    }
}


export async function deleteTracks(trackIds: string[]) {
    const transaction: Transaction = await sequelize.transaction();
    try {
        const tracksLookup: any = {where: {id: {[Op.in]: trackIds}}}
        const tracks: Track[] = await Track.findAll({...tracksLookup, transaction, lock: transaction.LOCK.UPDATE});
        await deleteFiles(tracks.map((t: Track) => t.location));
        await Track.destroy(tracksLookup);
        await transaction.commit();
    } catch (e) {
        await transaction.rollback();
        throw e;
    }
}

export async function renameTracks(trackRenameOps: {id: string, newName: string}[]) {
    const transaction = await sequelize.transaction();
    try {
        const tracks = await Track.findAll({
            where: { id: trackRenameOps.map(op => op.id) },
        });
        const trackMap = new Map(tracks.map(track => [track.id, track]));
        const fileRenameOps = trackRenameOps.map(({ id, newName }) => {
            const track = trackMap.get(id);
            if (!track) throw new Error(`Track not found: ${id}`);
            return { id: id, oldPath: track.location, newName };
        });

        const renamed = await renameFiles(fileRenameOps);
        for (const { id, to } of renamed) {
            const track = await Track.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!track) throw new Error(`Track not found: ${id}`);
            track.location = to;
            await track.save({ transaction });
        }
        await transaction.commit();
    } catch (e) {
        await transaction.rollback();
        throw e;
    }
}
