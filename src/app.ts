import express, {Express} from "express";
import fileUpload from "express-fileupload";
import {createServer, Server as ServerHTTP} from "node:http";
import {sequelize} from "./database";
import {CORSMiddleware} from "./routes/middleware/CORSMiddleware";


export const AppExpress: Express = express();
export const AppServer: ServerHTTP = createServer(AppExpress);


AppExpress.use(express.json());
AppExpress.use(CORSMiddleware);
AppExpress.use(express.urlencoded({ extended: true })); // Parse form fields
AppExpress.use(fileUpload()); // Enable file uploads

import './routes/AuthRoutes';
import './routes/FileSystemRoutes';

sequelize.sync({force: false}).finally(async () => {
    AppServer.listen(3000);
});