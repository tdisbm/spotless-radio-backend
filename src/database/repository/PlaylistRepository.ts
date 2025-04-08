import {Playlist} from "../models/Playlist";
import {Track} from "../models/Track";
import {Transaction} from "sequelize";
import {sequelize} from "../index";


export async function createPlaylist(data: any) {
    const transaction: Transaction = await sequelize.transaction();
    try {
        const {["tracks"]: tracks, ...playlistData} = data
        const playlist = await Playlist.create(playlistData, {transaction});
        await playlist.setTracks((tracks || []).map(t => t.id), {transaction});
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
        const trackIds = await aggregateTrackIds(tracks);
        const playlist = await Playlist.findOne({
            where: {id: id}
        });
        await playlist.update(playlistData, {transaction});
        await playlist.setTracks(trackIds, {transaction});
        await transaction.commit();
        return playlist
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export async function createTracks(tracksData: any[]) {
    return await Track.bulkCreate(tracksData);
}


async function aggregateTrackIds(tracksData: {id: undefined | string, location: string, sortOrder: number}[]) {
    const tracksToCreate = [];
    const trackIds = [];
    for (let i = 0; i < tracksData.length; i++) {
        const track = tracksData[i];
        track.sortOrder = track.sortOrder || i;
        if (track.id !== undefined) {
            trackIds.push(track.id);
        } else {
            tracksToCreate.push(track);
        }
    }
    if (tracksToCreate.length) {
        const createdTracks = await Track.bulkCreate(tracksToCreate);
        for (const createdTrack of createdTracks) {
            trackIds.push(createdTrack.id);
        }
    }
    return trackIds;
}