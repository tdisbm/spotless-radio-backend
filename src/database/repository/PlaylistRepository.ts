import {Playlist} from "../models/Playlist";
import {Transaction} from "sequelize";
import {sequelize} from "../index";
import {TrackPlaylist} from "../models/TrackPlaylist";


export async function createPlaylist(data: any) {
    const transaction: Transaction = await sequelize.transaction();
    try {
        const {["tracks"]: tracks, ...playlistData} = data
        const playlist = await Playlist.create(playlistData, {transaction});
        await TrackPlaylist.bulkCreate(tracks.map( track => ({
            trackId: track.id,
            playlistId: playlist.id,
            sortOrder: track.sortOrder
        })), {
            transaction
        });
        await transaction.commit();
        return playlist
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export async function updatePlaylist(data: any) {
    const transaction: Transaction = await sequelize.transaction();
    try {
        const {["tracks"]: tracks, ["id"]: id, ...playlistData} = data;
        const playlist = await Playlist.findOne(id);
        await playlist.update(playlistData as any, {transaction});
        await playlist.setTracks([])
        await TrackPlaylist.bulkCreate(tracks.map( track => ({
            trackId: track.id,
            playlistId: playlist.id,
            sortOrder: track.sortOrder
        })), {
            transaction
        });
        await transaction.commit();
        return playlist
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
