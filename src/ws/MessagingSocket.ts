import {Socket} from "socket.io";
import {getRepository, Repository} from "typeorm";
import * as jwt from "jsonwebtoken";
import {User} from "../db/entities/User";
import {Message} from "../db/entities/Message";
import {checkContentValid} from "../helper";
import { Logger } from "tslog";

const log: Logger = new Logger({name: "ws.log"})

const SEND_MESSAGE = "SEND_MESSAGE";
const SEND_ID = "SEND_ID";
const disconnect = "disconnect";

let sockets: MessagingSocket[] = [];

const sendMessageFields = ["username", "content"]
const sendIdFields = ["token"]

class MessagingSocket {

    id: number
    socket: Socket
    user: User
    userRepository: Repository<User>
    messageRepository: Repository<Message>

    constructor(socket: Socket, id: number = 0) {
        this.id = id;
        this.socket = socket;
        this.userRepository = getRepository(User);
        this.messageRepository = getRepository(Message);

        sockets.push(this);
        this.socket_onConnection();
    }

    // username, content
    socket_onConnection = async () => {
        log.info("Connection request received")
        this.socket.on(SEND_ID, data => {
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
            this.id = token.id
            this.userRepository.findOne({id: this.id}).then(user => {
                if (user) {
                    log.info("User if found:" + user.id + "connection established")
                    this.user = user;
                }
            })
        })
        this.socket.on(SEND_MESSAGE,  async (data) => {
            if (this.user === null) {
                log.error("Sending message without authentication")
                this.socket.emit("error/", "Giriş yapmalısınız")
            }
            if(!checkContentValid(data, sendMessageFields)) {
                log.fatal("Wrong message content" + this.user ? this.user.id : "-")
                this.socket.emit("error/", "wrong message content")
                return;
            }
            const receiver: User = await this.userRepository.createQueryBuilder("user")
                .leftJoinAndSelect("user.blocked", "blockedUsers")
                .where("user.username = :username", {username: data.username}).getOne()
            if (!receiver) {
                log.error("Receiver couldnt find" + this.user ? this.user.id : "-");
                this.socket.emit("error/", "Kullanıcı bulunamadı")
                return;
            }
            const content = data.content;

            if (receiver.id === this.id) {
                log.warn("User tried to send message to himself" + this.user ? this.user.id : "-")
                this.socket.emit("error/", "Kendinize mesaj yollayamazsınız")
                return;
            }

            let socketFound = false;
            if (receiver.blocked.includes(this.user)) {
                log.warn("This message will not sent to receiver because the sender is blocked")
            } else {
                for (let i = 0; i < sockets.length; i++) {
                    if ( sockets[i].id === receiver.id) {
                        socketFound = true;
                        data.username = this.user.username;
                        sockets[i].socket.emit("message/", data)
                        log.info("Receiver is online message is sent" + this.user ? this.user.id : "-" + "Receiver: " + receiver.id)
                    }
                }
                if (!socketFound) {
                    log.warn("Receiver is not online" + this.user ? this.user.id : "-");
                }
            }



            if ( this.user && receiver) {
                const newMessage = new Message(this.user, receiver, content, new Date(Date.now()), socketFound)
                const message = this.messageRepository.create(newMessage)
                await this.messageRepository.save(message)
                log.info("Message is saved" + this.user ? this.user.id : "-")
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
        log.info("Client disconnected:" + this.user ? this.user.id : "-");
    }

}

export default MessagingSocket