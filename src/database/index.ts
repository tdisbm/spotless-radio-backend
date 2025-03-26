import {Sequelize} from 'sequelize-typescript';
import {Dialect} from "sequelize";
import * as config from '../config/database.json';

export const sequelize = new Sequelize({
    database: config.DATABASE,
    username: config.USERNAME,
    password: config.PASSWORD,
    dialect: config.DIALECT as Dialect,
    host: config.HOST,
    port: config.PORT,
    models: [__dirname + '/models'],
});