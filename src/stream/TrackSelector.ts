import {Stream} from "../database/models/Stream";
import {Track} from "../database/models/Track";
import {getTracksOrdered} from "../database/repository/PlaylistRepository";
import {fetchStream} from "../database/repository/StreamRepository";


export async function orderedTrackSelector(streamId: string, lastTrackId: string) {
    const stream: Stream = await fetchStream(streamId);
    const tracks: Track[] = await getTracksOrdered(stream.playlistId);
    if (!lastTrackId) {
        return tracks[0];
    }
    for (let index = 0; index < tracks.length; index++) {
        const track: Track = tracks[index];
        if (track.id === lastTrackId) {
            if (index === tracks.length - 1) {
                return stream.isRecursive ? tracks[0] : null;
            } else {
                return tracks[index + 1];
            }
        }
    }
    return null;
}