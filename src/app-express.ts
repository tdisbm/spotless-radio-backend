import express, {Express} from "express";
import fileUpload from "express-fileupload";
import {createServer, Server as ServerHTTP} from "node:http";
import {sequelize} from "./database";
import {CORSMiddleware} from "./routes/middleware/CORSMiddleware";

import authRoleRoutes from "./routes/AuthRoleRoutes";
import authRoutes from "./routes/AuthRoutes";
import authUserRoutes from "./routes/AuthUserRoutes";
import trackRoutes from "./routes/TrackRoutes";
import playlistRoutes from "./routes/PlaylistRoutes";
import streamRoutes from "./routes/StreamRoutes";


export const AppExpress: Express = express();
export const AppServer: ServerHTTP = createServer(AppExpress);


AppExpress.use(fileUpload()); // Enable file uploads
AppExpress.use(express.json());
AppExpress.use(CORSMiddleware);
AppExpress.use(express.urlencoded({extended: true})); // Parse form fields


AppExpress.use(authRoleRoutes);
AppExpress.use(authRoutes);
AppExpress.use(authUserRoutes);
AppExpress.use(trackRoutes);
AppExpress.use(playlistRoutes);
AppExpress.use(streamRoutes);


sequelize.sync({force: false}).finally(() => {
    AppServer.listen(3000);
});
