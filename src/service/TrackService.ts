import path from "node:path";
import {Track} from "../database/models/Track";
import {sequelize} from "../database";
import {Op, Transaction} from "sequelize";
import {deleteFiles, renameFiles, uploadFiles} from "../utils/FileSystemUtils";
import {TRACKS_ROOT_PATH} from "../config/filesystem";
import {getAudioMetadata} from "../utils/AudioUtils";


export async function createTracks(files: any) {
    if (!Array.isArray(files)) {
        files = [files];
    }
    const transaction: Transaction = await sequelize.transaction();
    try {
        await uploadFiles(TRACKS_ROOT_PATH, files);
        const filesData: { name, location, metadata }[] = [];
        for (const file of files) {
            const filePath: string = path.normalize(path.join(TRACKS_ROOT_PATH, file.name));
            filesData.push({
                name: file.name,
                location: filePath,
                metadata: await getAudioMetadata(filePath)
            });
        }
        await Track.bulkCreate(filesData);
        await transaction.commit();
    } catch (e) {
        await transaction.rollback();
        throw e;
    }
}

export async function deleteTracks(trackIds: string[]) {
    if (!Array.isArray(trackIds) || trackIds.length === 0) {
        throw new Error('Invalid track IDs: Must be a non-empty array');
    }

    const transaction: Transaction = await sequelize.transaction();
    try {
        console.log('Deleting tracks with IDs:', trackIds);
        const tracksLookup: any = { where: { id: { [Op.in]: trackIds } } };
        const tracks: Track[] = await Track.findAll({
            ...tracksLookup,
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (tracks.length === 0) {
            throw new Error('No tracks found for the provided IDs');
        }

        console.log('Tracks found:', tracks.map(t => ({ id: t.id, location: t.location })));

        const fileLocations = tracks.map((t: Track) => t.location).filter(location => location);
        if (fileLocations.length > 0) {
            await deleteFiles(fileLocations);
        } else {
            console.log('No file locations to delete');
        }

        await Track.destroy({ ...tracksLookup, transaction });
        await transaction.commit();
        console.log('Tracks deleted successfully');
    } catch (e: any) {
        await transaction.rollback();
        console.error('Error in deleteTracks:', e.message);
        throw new Error(`Failed to delete tracks: ${e.message}`);
    }
}

export async function renameTracks(trackRenameOps: { id: string, newName: string }[]) {
    const transaction = await sequelize.transaction();
    try {
        const tracks = await Track.findAll({
            where: {id: trackRenameOps.map(op => op.id)},
        });
        const trackMap = new Map(tracks.map(track => [track.id, track]));
        const fileRenameOps = trackRenameOps.map(({id, newName}) => {
            const track = trackMap.get(id);
            if (!track) throw new Error(`Track not found: ${id}`);
            return {id: id, oldPath: track.location, newName};
        });

        const renamed = await renameFiles(fileRenameOps);
        for (const {id, to} of renamed) {
            const track = await Track.findByPk(id, {transaction, lock: transaction.LOCK.UPDATE});
            if (!track) throw new Error(`Track not found: ${id}`);
            track.location = to;
            await track.save({transaction});
        }
        await transaction.commit();
    } catch (e) {
        await transaction.rollback();
        throw e;
    }
}
