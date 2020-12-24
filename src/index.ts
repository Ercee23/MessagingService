import "reflect-metadata";
import {createConnection} from "typeorm";
import {Request, Response} from "express";
import * as express from "express";
import * as bodyParser from "body-parser";
import {AppRoutes} from "./routes";
import * as http from 'http';
import { Server, Socket } from "socket.io";
import MessagingSocket from "./ws/MessagingSocket";
import { Logger, ILogObject } from "tslog";
import { appendFileSync }  from "fs";

function logToTransport(logObject: ILogObject) {
    appendFileSync("app.log", JSON.stringify(logObject) + "\n");
}

export const log: Logger = new Logger({name: "app", type: "json"})
log.attachTransport(
    {
        silly: logToTransport,
        debug: logToTransport,
        trace: logToTransport,
        info: logToTransport,
        warn: logToTransport,
        error: logToTransport,
        fatal: logToTransport,
    },
    "debug"
);


const init = () => createConnection().then(async _ => {

    // create express app
    const app = express();
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    // register all application routes
    AppRoutes.forEach(route => {
        app[route.method](route.path, (request: Request, response: Response, next: Function) => {
            route.action(request, response)
                .then(() => next)
                .catch(err => next(err));
        });
    });

    // run app
    const server = http.createServer(app);

    const io = new Server(server)
    io.on('connection', (socket: Socket) => {
        new MessagingSocket(socket)
    })

    server.listen(8000);
    log.info("Server started to listen on port: " + 8000)
    return app;

}).catch(err => log.fatal("DB Connection error!! " + err));

// if env is not test
// @ts-ignore
if(!process.env.TS_NODE_COMPILER_OPTIONS) {
    init();
}
export default init;