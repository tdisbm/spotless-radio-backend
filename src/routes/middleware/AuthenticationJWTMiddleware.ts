import {JWTTokenVerify} from "../../utils/AuthUtils";


export function AuthenticationJWTMiddleware(request: any, response: any, next: any) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return response.status(401).json({message: "Unauthorized: No token provided"});
    }

    try {
        const token = authHeader.split(" ")[1];
        const tokenDecoded: any = JWTTokenVerify(token);
        Object.assign(request, {user: tokenDecoded});
        next();
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            response.status(401).json({message: "Unauthorized: Token expired"});
        } else {
            response.status(403).json({message: "Forbidden: Invalid token"});
        }
    }
}
