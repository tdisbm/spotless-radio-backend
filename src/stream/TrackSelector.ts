import {StreamInfoBundle} from "./types";
import {Stream} from "../database/models/Stream";
import {Track} from "../database/models/Track";
import {getTracksOrdered} from "../database/repository/PlaylistRepository";
import {fetchStream} from "../database/repository/StreamRepository";


export async function orderedTrackSelector(streamInfo: StreamInfoBundle) {
    const currentTrackId: string = streamInfo.currentTrackId;
    const stream: Stream = await fetchStream(streamInfo.streamId);
    const tracks: Track[] = await getTracksOrdered(stream.playlist.id);
    if (currentTrackId === null) {
        return tracks[0];
    }
    for (let index = 0; index < tracks.length; index++) {
        const track: Track = tracks[index];
        if (track.id === currentTrackId) {
            if (index === tracks.length - 1) {
                return stream.isRecursive ? tracks[0] : null;
            } else {
                return tracks[index + 1];
            }
        }
    }
    return null;
}