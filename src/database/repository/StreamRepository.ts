import {Stream} from "../models/Stream";
import {Playlist} from "../models/Playlist";
import {Track} from "../models/Track";

export async function fetchStream(streamId: string) {
    return await Stream.findByPk(streamId, {
        include: [{
            model: Playlist,
            include: [Track],
            order: [[Track, 'sortOrder', 'ASC']]
        }]
    });
}