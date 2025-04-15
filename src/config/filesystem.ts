import path from "node:path";

export const TRACKS_ROOT_PATH = path.normalize(process.env.TRACKS_ROOT_PATH || __dirname + '/../../media/tracks/');