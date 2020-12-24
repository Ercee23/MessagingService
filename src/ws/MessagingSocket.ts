import {Socket} from "socket.io";
import {getRepository, Repository} from "typeorm";
import * as jwt from "jsonwebtoken";
import {User} from "../db/entities/User";
import {Message} from "../db/entities/Message";
import {checkContentValid} from "../helper";
import { Logger, ILogObject } from "tslog";
import { appendFileSync }  from "fs";

function logToTransport(logObject: ILogObject) {
    appendFileSync("ws.log", JSON.stringify(logObject) + "\n");
}

export const log: Logger = new Logger({name: "ws", type: "json"})
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

const SEND_MESSAGE = "SEND_MESSAGE";
const SEND_ID = "SEND_ID";
const disconnect = "disconnect";

let sockets: MessagingSocket[] = [];

const sendMessageFields = ["username", "content"]
const sendIdFields = ["token"]

class MessagingSocket {

    socket: Socket
    user: User
    userRepository: Repository<User>
    messageRepository: Repository<Message>

    constructor(socket: Socket) {
        this.user = null;
        this.socket = socket;
        this.userRepository = getRepository(User);
        this.messageRepository = getRepository(Message);

        sockets.push(this);
        this.socket_onConnection();
    }

    // username, content
    socket_onConnection = async () => {
        log.info("Connection request received")
        this.socket.on(SEND_ID, async data => {
            if(!checkContentValid(data, sendIdFields)) {
                this.socket.emit("error/", "wrong message content")
                return;
            }
            let token;
            try {
                // @ts-ignore
                token = jwt.verify(data.token, process.env.SECRET);
                log.info("JWT is verified.")
            }
            catch {
                log.error("JWT is not verified")
                this.socket.emit("error/", "JWT hatalı")
                return;
            }
            // @ts-ignore
            await this.userRepository.findOne({id: token.id}).then(user => {
                if (user) {
                    log.info("User id found:" + user.username + " connection established");
                    this.user = user;
                }
            })
            if (this.user === null) {
                log.error("User not found " + token.id + " couldn't authenticated the user" )
            }
        })
        this.socket.on(SEND_MESSAGE,  async (data) => {
            if (this.user === null) {
                log.error("Sending message without authentication")
                this.socket.emit("error/", "Giriş yapmalısınız")
                return;
            }
            if(!checkContentValid(data, sendMessageFields)) {
                log.fatal("Wrong message content " + this.user.id)
                this.socket.emit("error/", "wrong message content")
                return;
            }
            const receiver: User = await this.userRepository.createQueryBuilder("user")
                .leftJoinAndSelect("user.blocked", "blockedUsers")
                .where("user.username = :username", {username: data.username}).getOne()
            if (!receiver) {
                log.error("Receiver couldnt find " + this.user.id );
                this.socket.emit("error/", "Kullanıcı bulunamadı")
                return;
            }
            const content = data.content;

            if (receiver.id === this.user.id) {
                log.warn("User tried to send message to himself" + this.user.id)
                this.socket.emit("error/", "Kendinize mesaj yollayamazsınız")
                return;
            }

            console.log(receiver.blocked.includes(this.user))
            console.log(this.user)
            console.log(receiver.blocked)

            let socketFound = false;
            if ((receiver.blocked.filter(blockedUser => blockedUser.id === this.user.id)).length !== 0) {
                log.warn("This message will not sent to receiver because the sender is blocked")
            } else {
                for (let i = 0; i < sockets.length; i++) {
                    if ( sockets[i].user && sockets[i].user.id === receiver.id) {
                        socketFound = true;
                        data.username = this.user.username;
                        sockets[i].socket.emit("message/", data)
                        log.info("Receiver is online message is sent" + this.user.id + "Receiver: " + receiver.id)
                    }
                }
                if (!socketFound) {
                    log.warn("Receiver is not online" + this.user.id );
                }
            }



            if ( this.user && receiver) {
                const newMessage = new Message(this.user, receiver, content, new Date(Date.now()), socketFound)
                const message = this.messageRepository.create(newMessage)
                await this.messageRepository.save(message)
                log.info("Message is saved" + (this.user !== null ?  this.user.id : "-"))
            }

        })
        this.socket.on(disconnect, () => {
            log.info("Disconnection request received")
            this.socket_onClose()
        })
    }


    socket_onClose = () => {
        for (let i = 0; i < sockets.length; i++) {
            if (sockets[i] === this) {
                sockets.splice(i, 1);
            }
        }
        log.info("Client disconnected:" + (this.user !== null ?  this.user.id : "-"))
    }

}

export default MessagingSocket