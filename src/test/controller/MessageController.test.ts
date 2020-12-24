import * as chai from 'chai';
import init from "../../index";
import chaiHttp = require('chai-http');
import 'mocha';
import {getRepository} from "typeorm";
import {User} from "../../db/entities/User";
import * as jwt from "jsonwebtoken";
import {Message} from "../../db/entities/Message";

chai.use(chaiHttp);

let app;


describe("MessageController", () => {

    let userRepo;
    let messageRepo;

    let user1_id;
    let user2_id;
    const username1 = "ercee"
    const username2 = "ercee1"
    const firstname = "erce"
    const lastname = "eren"
    const password = "1"
    const message1 = "message1";
    const message2 = "message2";

    let user1_token = "";
    let user2_token = "";

    before(async () => {
        await init();
        app = "http://localhost:8000"//await init();

        userRepo = getRepository(User)
        messageRepo = getRepository(Message);

        // @ts-ignore
        const user1data = new User(username1, password, firstname, lastname)
        const user2data = new User(username2, password, firstname, lastname)
        await userRepo.save(user1data)
        await userRepo.save(user2data)
        const user1 = await userRepo.createQueryBuilder("user").where("username = :username", {username: username1}).getOne();
        const user2 = await userRepo.createQueryBuilder("user").where("username = :username", {username: username2}).getOne();
        user1_id = user1.id;
        user2_id = user2.id;
        const data1 = {
            id: user1.id,
            username: user1.username,
            firstname: user1.firstname,
            lastname: user1.lastname
        }
        const data2 = {
            id: user2.id,
            username: user2.username,
            firstname: user2.firstname,
            lastname: user2.lastname
        }
        // @ts-ignore
        user1_token = jwt.sign(data1, process.env.SECRET);
        // @ts-ignore
        user2_token = jwt.sign(data2, process.env.SECRET);

    });



    it ("send message", (done) => {
        const data = {receiverName: username2, content: message1, token: user1_token};
        chai.request(app).post("/sendMessage")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            // @ts-ignore
            .end(async (err, response) => {
                if (response.body.result === "") {
                    const messages = await messageRepo.createQueryBuilder("message")
                        .where("message.senderId = :sender and message.receiverId = :receiver", {sender: user1_id, receiver: user2_id})
                        .getMany()
                    if (messages.length === 1 && messages[0].content === message1) {
                        done();
                    } else {
                        done("SEND MESSAGE NO MESSAGE HATA!");
                    }
                } else {
                    done("SEND MESSAGE HATA!")
                }
            });
    })

    it ("send message reverse users", (done) => {
        const data = {receiverName: username1, content: message1, token: user2_token};
        chai.request(app).post("/sendMessage")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            // @ts-ignore
            .end(async (err, response) => {
                if (response.body.result === "") {
                    const messages = await messageRepo.createQueryBuilder("message")
                        .where("message.senderId = :sender and message.receiverId = :receiver", {sender: user2_id, receiver: user1_id})
                        .getMany()
                    if (messages.length === 1 && messages[0].content === message1) {
                        done();
                    } else {
                        done("SEND MESSAGE NO MESSAGE HATA!");
                    }
                } else {
                    done("SEND MESSAGE HATA!")
                }
            });
    })

    it ("get message", (done) => {
        const data = {username: username2, content: message1, token: user1_token};
        chai.request(app).get("/getMessages")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            // @ts-ignore
            .end(async (err, response) => {
                if (response.body.result === "") {
                    const messages = response.body.messages;
                    if (messages.length === 2 && (messages[0].senderName === messages[1].receiverName && messages[0].senderName === messages[1].receiverName)) {
                        done();
                    } else {
                        done(messages.length)
                    }
                } else {
                    done("GET MESSAGE HATA!")
                }
            });
    })

    it ("get message wrong jwt", (done) => {
        const data = {username: username2, content: message1, token: user1_token + "!"};
        chai.request(app).get("/getMessages")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            // @ts-ignore
            .end(async (err, response) => {
                if (response.body.result === "JWT hatalı") {
                    done()
                } else {
                    done("GET MESSAGE HATA!")
                }
            });
    })

    it ("get message wrong username", (done) => {
        const data = {username: username2 + "!", content: message1, token: user1_token};
        chai.request(app).get("/getMessages")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            // @ts-ignore
            .end(async (err, response) => {
                if (response.body.result === "Kullanıcı bulunamadı") {
                    done()
                } else {
                    done("GET MESSAGE HATA!")
                }
            });
    })

    it ("get unread messages", (done) => {
        const data = {token: user1_token};
        chai.request(app).get("/getUnread")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            // @ts-ignore
            .end(async (err, response) => {
                if (response.body.result === "") {
                    const messages = response.body.messages;
                    if (Object.keys(messages).length === 1 && Object.keys(messages)[0] === username2 && messages[Object.keys(messages)[0]].length === 1 && messages[Object.keys(messages)[0]][0].content === message1) {
                        done();
                    } else {
                        done("UNREAD MESSAGES CONTENT HATA!")
                    }
                } else {
                    done("UNREAD MESSAGES HATA!")
                }
            });
    })

    it ("get unread messages again", (done) => {
        const data = {token: user1_token};
        chai.request(app).get("/getUnread")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            // @ts-ignore
            .end(async (err, response) => {
                if (response.body.result === "") {
                    const messages = response.body.messages;
                    if (Object.keys(messages).length === 0) {
                        done();
                    } else {
                        done("UNREAD MESSAGES CONTENT HATA!")
                    }
                } else {
                    done("UNREAD MESSAGES HATA!")
                }
            });
    })


    after(async () => {
        await messageRepo.delete(() => "")
        await userRepo.delete({username: username1})
        await userRepo.delete({username: username2})
    })
});