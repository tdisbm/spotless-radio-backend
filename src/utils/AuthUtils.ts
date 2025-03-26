import * as config from "../config/security.json"
import {sign, verify} from "jsonwebtoken";

const ACCESS_EXPIRES_IN = "14d";

export function JWTTokenGenerate(payload: object): string {
    return sign(payload, config.SECRET_KEY, { expiresIn: ACCESS_EXPIRES_IN });
}

export function JWTTokenVerify(token: string): any {
    return verify(token, config.SECRET_KEY, { ignoreExpiration: false });
}
