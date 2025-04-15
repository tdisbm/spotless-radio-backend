import {readdir} from 'fs/promises';
import {join} from 'path';
import {sequelize} from "../database";

export async function runMigrations() {
    const migrationsPath = join(__dirname, '../database/migration');
    const files = await readdir(migrationsPath);

    for (const file of files) {
        if (!file.endsWith('.ts')) continue;
        const modulePath = join(migrationsPath, file);
        const migrationModule = await import(modulePath);

        if (typeof migrationModule.migrate === 'function') {
            console.log(`Running migration from ${file}...`);
            await migrationModule.migrate();
        } else {
            console.warn(`No migrate() function found in ${file}`);
        }
    }
}

sequelize.sync({force: true}).finally(() => {
    runMigrations().finally(() => {
        console.log('Migrations applied!');
    });
});
