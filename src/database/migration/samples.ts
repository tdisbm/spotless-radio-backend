import {createRole} from "../repository/AuthRoleRepository";
import {createUser} from "../repository/AuthUserRepository";
import {AuthRole} from "../models/AuthRole";
import {createPlaylist} from "../repository/PlaylistRepository";
import {Playlist} from "../models/Playlist";
import {Stream} from "../models/Stream";


export async function migrate() {
    const admin: AuthRole = await createRole({role: "ADMIN", isDefault: false});
    await createRole({role: "USER", isDefault: true});
    await createUser({
        username: "admin",
        password: "hackme",
        email: "vlad.cerchez@radiorelax.stress",
        firstName: "Vlad",
        lastName: "Cerchez",
        roles: [admin.dataValues]
    });
    const playlist: Playlist = await createPlaylist({
        name: "default-stream",
        description: "My default stream",
        coverImage: "No cover image for now",
        tracks: [],
        enabled: true,
        isRecursive: true
    });
    const stream: Stream = await Stream.create({
        name: "Some name",
        host: "localhost",
        port: 6969,
        endpoint: "teststream",
        username: "source",
        password: "hackme",
    });
    await playlist.setStream(stream);
    await stream.setPlaylist(playlist);
}
