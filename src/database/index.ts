import {Sequelize} from 'sequelize-typescript';
import {Dialect} from "sequelize";
import {
    DATABASE_DIALECT,
    DATABASE_HOST,
    DATABASE_NAME,
    DATABASE_PASSWORD,
    DATABASE_PORT,
    DATABASE_USERNAME
} from "../config/database";


export const sequelize = new Sequelize({
    database: DATABASE_NAME,
    username: DATABASE_USERNAME,
    password: DATABASE_PASSWORD,
    dialect: DATABASE_DIALECT as Dialect,
    host: DATABASE_HOST,
    port: DATABASE_PORT,
    models: [__dirname + '/models'],
});