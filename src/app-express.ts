import express, {Express} from "express";
import 'express-async-errors';
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
import {
    genericExpressErrorHandler,
    processException,
    processRejection
} from "./routes/middleware/ErrorHandlerMiddleware";


process.on('unhandledRejection', processRejection);
process.on('uncaughtException', processException);

const AppExpress: Express = express();
const AppServer: ServerHTTP = createServer(AppExpress);

AppExpress.use(fileUpload());
AppExpress.use(express.json());
AppExpress.use(CORSMiddleware);
AppExpress.use(express.urlencoded({extended: true}));

AppExpress.use('/auth/role', authRoleRoutes);
AppExpress.use('/auth', authRoutes);
AppExpress.use('/auth/user', authUserRoutes);
AppExpress.use('/track', trackRoutes);
AppExpress.use('/playlist', playlistRoutes);
AppExpress.use('/stream', streamRoutes);

AppExpress.use(genericExpressErrorHandler);

sequelize.authenticate().finally(() => {
    const port: string | number = process.env.EXPRESS_PORT || 3000
    AppServer.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});