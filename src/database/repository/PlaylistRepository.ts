import {Playlist} from "../models/Playlist";
import {Transaction} from "sequelize";
import {sequelize} from "../index";
import {TrackPlaylist} from "../models/TrackPlaylist";
import {Track} from "../models/Track";

export async function createPlaylist(data: any) {
    const transaction: Transaction = await sequelize.transaction();
    try {
        const {["tracks"]: tracks, ...playlistData} = data;
        const playlist = await Playlist.create(playlistData, {transaction});
        await TrackPlaylist.bulkCreate(tracks.map(track => ({
            trackId: track.id,
            playlistId: playlist.id,
            sortOrder: track.sortOrder
        })), {
            transaction
        });
        await transaction.commit();
        return playlist;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export async function updatePlaylist(data: any) {
    const transaction: Transaction = await sequelize.transaction();
    try {
        const {["tracks"]: tracks, ["id"]: id, ...playlistData} = data;
        const playlist = await Playlist.findOne({ where: { id } }); // Adăugat `where` pentru a corecta `findOne`
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        await playlist.update(playlistData as any, { transaction });
        const existingTracks = await TrackPlaylist.findAll({
            where: { playlistId: id },
            transaction
        });
        const existingTrackIds = existingTracks.map(track => track.trackId);
        const newTracks = tracks.filter(track => !existingTrackIds.includes(track.id));
        if (newTracks.length > 0) {
            await TrackPlaylist.bulkCreate(newTracks.map(track => ({
                trackId: track.id,
                playlistId: playlist.id,
                sortOrder: track.sortOrder
            })), { transaction });
        }

        await transaction.commit();
        return playlist;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export async function getTracksOrdered(playlistId: string, ordering: string = 'ASC') {
    return await Track.findAll({
        attributes: {exclude: ['createdAt', 'updatedAt']},
        include: [{
            model: Playlist,
            as: 'playlists',
            where: {id: playlistId},
            attributes: [],
            through: {
                attributes: ['sortOrder']
            }
        }],
        order: [
            [{model: Playlist, as: 'playlists'}, TrackPlaylist, 'sortOrder', ordering],
            ['location', ordering]
        ]
    });
}