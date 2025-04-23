export const DATABASE_NAME: string = process.env.DATABASE_NAME || "spotless_radio";
export const DATABASE_USERNAME: string = process.env.DATABASE_USERNAME || "spotless";
export const DATABASE_PASSWORD: string = process.env.DATABASE_PASSWORD || "hackme";
export const DATABASE_HOST: string = process.env.DATABASE_HOST || "localhost";
export const DATABASE_PORT: number = +process.env.DATABASE_PORT || 5432;
export const DATABASE_DIALECT: string = process.env.DATABASE_DIALECT || "postgres";