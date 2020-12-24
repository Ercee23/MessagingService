import {Request, Response} from "express";
import {getRepository} from "typeorm";
import * as jwt from 'jsonwebtoken';
import {Message} from "../db/entities/Message";
import {User} from "../db/entities/User";
import {checkBodyValid} from "../helper";
import { log } from "../index";

const sendMessageFields = ["token", "receiverName", "content"]
const getMessagesFields = ["token", "username"]
const getUnReadMessagesFields = ["token"]

export async function sendMessage(request: Request, response: Response) {
    let body = request.body
    if (!checkBodyValid(body, sendMessageFields, response)) {
        log.error("Invalid Type Body Type")
        return;
    }
    const messageRepository = getRepository(Message)
    const userRepository = getRepository(User)

    let token;
    try {
        // @ts-ignore
        token = jwt.verify(body.token, process.env.SECRET);
    }
    catch {
        log.error("JWT error")
        response.send({result: "JWT hatalı"})
        return;
    }
    const receiver: User = await userRepository.findOne({username: body.receiverName})
    if (receiver) {
        // @ts-ignore
        const sender: User = await userRepository.findOne({username: token.username})
        if (sender) {
            const newMessage = new Message(sender, receiver, body.content, new Date(Date.now()))
            const message = messageRepository.create(newMessage)
            messageRepository.save(message)
                .then(_ => {
                    response.send({result:""})
                    log.info("Message successfully send")
                });
        } else {
            log.error("JWT has wrong content")
            response.send({result: "Hatalı bilgi tekrar giriş yapın"})
        }
    } else {
        log.warn("User couldnt find to send message")
        response.send({result: "Alıcı bulunamadı"})
    }

}

export async function getMessages(request: Request, response: Response) {
    let body = request.body
    if (!checkBodyValid(body, getMessagesFields, response)) {
        log.error("Invalid Type Body Type")
        return;
    }
    const messageRepository = getRepository(Message)
    const userRepository = getRepository(User)
    let token;
    try {
        // @ts-ignore
        token = jwt.verify(body.token, process.env.SECRET);
    }
    catch {
        log.error("JWT error")
        response.send({result: "JWT hatalı"})
        return;
    }
    // @ts-ignore
    const friend: User = await userRepository.findOne({username: body.username});
    if (friend) {
        const messages: Message[] = await messageRepository.createQueryBuilder("message")
            .leftJoinAndSelect("message.receiver", "receiver")
            .leftJoinAndSelect("message.sender", "sender")
            .where(
                "(message.senderId = :senderId and message.receiverId = :receiverId) or " +
                "(message.senderId = :receiverId and message.receiverId = :senderId)",
                // @ts-ignore
                {receiverId: token.id, senderId: friend.id})
            .getMany()
        const result = messages.map((message: Message) => {
            return {senderName: message.sender.username, receiverName: message.receiver.username, content: message.content}
        })
        response.send({messages: result, result: ""});
        log.info("User received old messages successfully")
    } else {
        response.send({result: "Kullanıcı bulunamadı"})
        log.warn("User couldnt find to show messages")
    }

}

export async function getUnReadMessages(request: Request, response: Response) {
    let body = request.body
    if (!checkBodyValid(body, getUnReadMessagesFields, response)) {
        log.error("Invalid Type Body Type")
        return;
    }
    const messageRepository = getRepository(Message)
    const userRepository = getRepository(User)
    let token;
    try {
        // @ts-ignore
        token = jwt.verify(body.token, process.env.SECRET);
    }
    catch {
        log.error("JWT error")
        response.send({result: "JWT hatalı"})
        return;
    }
    // @ts-ignore
    const user = await userRepository.createQueryBuilder("user").leftJoinAndSelect("user.blocked", "blocked").where({username: token.username}).getOne();
    if (user) {
        // @ts-ignore
        const blocked = user.blocked ? user.blocked.map(blockedUser => blockedUser.id) : [];
        let query = messageRepository.createQueryBuilder("message")
            .leftJoinAndSelect("message.receiver", "receiver").leftJoinAndSelect("message.sender", "sender")
            // @ts-ignore
            .where("message.receiverId = :userId and message.read = FALSE", {userId: user.id});
        if (blocked.length) {
            // @ts-ignore
            query = query.andWhere("message.senderId not in (:...blocked)", {blocked: blocked})
        }
        const unReadMessages:Message[] = await query.getMany()
        const result = {};

        if (unReadMessages.length !== 0) {
            for (let i = 0; i < unReadMessages.length; i++) {
                if (!Object.keys(result).includes(unReadMessages[i].sender.username)) {
                    result[unReadMessages[i].sender.username] = []
                }
                const message = {
                    receiverName: unReadMessages[i].receiver.username,
                    content: unReadMessages[i].content
                }
                result[unReadMessages[i].sender.username].push(message)
                unReadMessages[i].read = true;
            }
            await getRepository(Message).save(unReadMessages)
        }
        response.send({messages: result, result: ""});
        log.info("User:" + user.username + "received his/her unread messages")
    } else {
        response.send({result: "Hatalı bilgi tekrar giriş yapın"})
        log.error("JWT has wrong content")
    }

}