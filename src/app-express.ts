import express, {Express} from "express";
import 'express-async-errors';
import fileUpload from "express-fileupload";
import {createServer, Server as ServerHTTP} from "node:http";
import {sequelize} from "./database";
import {CORSMiddleware} from "./routes-express/middleware/CORSMiddleware";

import authRoleRoutes from "./routes-express/AuthRoleRoutes";
import authRoutes from "./routes-express/AuthRoutes";
import authUserRoutes from "./routes-express/AuthUserRoutes";
import trackRoutes from "./routes-express/TrackRoutes";
import playlistRoutes from "./routes-express/PlaylistRoutes";
import streamRoutes from "./routes-express/StreamRoutes";
import {errorHandler,} from "./routes-express/middleware/ErrorHandlerMiddleware";
import {processException, processRejection} from "./utils/ErrorHandler";


process.on('unhandledRejection', processRejection);
process.on('uncaughtException', processException);

const AppExpress: Express = express();
const AppServer: ServerHTTP = createServer(AppExpress);

AppExpress.use(CORSMiddleware);
AppExpress.use(fileUpload());
AppExpress.use(express.json({limit: "500mb"}));
AppExpress.use(express.raw({limit: "500mb"}));
AppExpress.use(express.urlencoded({limit: "500mb", extended: true}));

AppExpress.use('/auth/role', authRoleRoutes);
AppExpress.use('/auth', authRoutes);
AppExpress.use('/auth/user', authUserRoutes);
AppExpress.use('/track', trackRoutes);
AppExpress.use('/playlist', playlistRoutes);
AppExpress.use('/stream', streamRoutes);

AppExpress.use(errorHandler);

sequelize.authenticate().finally(() => {
    const port: string | number = process.env.EXPRESS_PORT || 3000
    AppServer.listen(port, () => {
        console.log(`[Express]: Running on port ${port}`);
    });
});