import {isAdmin, userFromJWT} from "../../service/AuthUserService";

export async function SIOUserMiddleware(socket, next) {
    try {
        socket.user = await userFromJWT(socket.handshake.auth.token);
        socket.userIsAdmin = await isAdmin(socket.user);
        next();
    } catch (e) {
        socket.user = null;
    }
}