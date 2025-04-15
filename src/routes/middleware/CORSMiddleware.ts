export function CORSMiddleware(request: any, response: any, next: any) {
    response.header("Access-Control-Allow-Origin", "*");
    response.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, CONNECT, OPTIONS, TRACE');
    response.header("Access-Control-Allow-Headers", "Authorization Origin, X-Requested-With, X-Auth-Token, Content-Type, Accept");
    next();
}