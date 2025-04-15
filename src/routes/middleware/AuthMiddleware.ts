import {JWTTokenVerify} from "../../utils/AuthUtils";
import {AuthUser} from "../../database/models/AuthUser";
import {isAdmin} from "../../service/AuthUserService";


export async function IsAdminMiddleware(request: any, response: any, next: any) {
    try {
        const authHeader = request.headers.authorization;
        const token = authHeader.split(" ")[1];
        const tokenDecoded = JWTTokenVerify(token);
        const user: AuthUser = await AuthUser.findOne(tokenDecoded.id)
        if (!(await isAdmin(user))) {
            throw Error("You're not an admin! Nice try haha!")
        }
        next()
    } catch (error: any) {
        response.status(401).json({message: String(error)})
    }

}

export async function AuthMiddleware(request: any, response: any, next: any) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({message: "Unauthorized: No token provided"});
        }
        const token = authHeader.split(" ")[1];
        const tokenDecoded: any = JWTTokenVerify(token);
        const user: AuthUser = await AuthUser.findOne(tokenDecoded.id)
        Object.assign(request, {user});
        next();
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            response.status(401).json({message: "Unauthorized: Token expired"});
        } else {
            response.status(403).json({message: "Forbidden: Invalid token"});
        }
    }
}
