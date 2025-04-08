import {sign, verify} from "jsonwebtoken";
import {JWT_TOKEN_TTL, SECRET_KEY} from "../config/security";

export function JWTTokenGenerate(payload: object): string {
    return sign(payload, SECRET_KEY, { expiresIn: JWT_TOKEN_TTL });
}

export function JWTTokenVerify(token: string): any {
    return verify(token, SECRET_KEY, { ignoreExpiration: false });
}
