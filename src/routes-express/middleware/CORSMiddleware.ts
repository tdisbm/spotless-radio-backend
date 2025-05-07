export function CORSMiddleware(request: any, response: any, next: any) {
    // CORS headers
    response.header("Access-Control-Allow-Origin", "http://localhost:4200");
    response.header("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS");
    response.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, X-Auth-Token, Content-Type, Accept");
    response.header("Access-Control-Allow-Credentials", "true");

    // request OPTIONS (preflight)
    if (request.method === "OPTIONS") {
        return response.status(200).end();
    }

    next();
}