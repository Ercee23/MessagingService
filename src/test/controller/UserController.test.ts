import * as chai from 'chai';
import init from "../../index";
import chaiHttp = require('chai-http');
import 'mocha';
import {getRepository, getConnectionManager} from "typeorm";
import {User} from "../../db/entities/User";
import * as jwt from "jsonwebtoken";

chai.use(chaiHttp);

let app;

describe("UserController", () => {

    let userRepo;

    before(async function() {
        await init();
        app = "http://localhost:8000"//await init();
        userRepo = getRepository(User)

    });


    const username1 = "ercee"
    const username2 = "ercee1"
    const firstname = "erce"
    const lastname = "eren"
    const password = "1"

    let user1_token = "";

    it ("register missing field case", (done) => {
        const data = {username: username1, password: password, firstname: firstname};
        chai.request(app).post("/register")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            .end((err, response) => {
                if (response.body.result === "Hatalı mesaj formatı") {
                    done();
                } else {
                    done(err)
                }
            });
    })


    it ("register normal case", (done) => {
        const data = {username: username1, password: password, firstname: firstname, lastname: lastname};
        chai.request(app).post("/register")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            .end((err, response) => {
                if (response.body.result === "") {
                    done();
                } else {
                    done(response.body.result)
                }
        });
    })

    it ("register duplicate case", (done) => {
        const data = {username: username1, password: password, firstname: firstname, lastname: lastname};
        chai.request(app).post("/register")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            .end((err, response) => {
                if (response.body.result === "Kullanıcı adı kullanılıyor") {
                    done()
                } else {
                    done("Kullanıcı adı zaten mevcut HATA!")
                }
            })
    })

    it ("register normal case 2", (done) => {
        const data = {username: username2, password: password, firstname: firstname, lastname: lastname};
        chai.request(app).post("/register")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            .end((err, response) => {
                if (response.body.result === "") {

                    done();
                } else {
                    done(response.body.result)
                }
            });
    })

    it ("login normal case", (done) => {
        const data = {username: username1, password: password};
        chai.request(app).post("/login")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            .end((err, response) => {
                if (response.body.result === "") {
                    user1_token = response.body.token;
                    done();
                } else {
                    done(response.body.result)
                }
            });
    })

    it ("login wrong password", (done) => {
        const data = {username: username1, password: password + "!"};
        chai.request(app).post("/login")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            .end((err, response) => {
                if (response.body.result === "Hatalı şifre") {
                    done();
                } else {
                    done("Şifre yanlış HATA!")
                }
            });
    })

    it ("login wrong username", (done) => {
        const data = {username: username1 + "!", password: password};
        chai.request(app).post("/login")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            .end((err, response) => {
                if (response.body.result === "Hatalı kullanıcı adı") {
                    done();
                } else {
                    done("Kullanıcı adı mevcut değil HATA!")
                }
            });
    })

    it ("block", (done) => {
        const data = {username: username2, token: user1_token};
        // @ts-ignore
        chai.request(app).post("/block")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            // @ts-ignore
            .end(async (err, response) => {
                // @ts-ignore
                const token = jwt.verify(user1_token, process.env.SECRET);
                if (response.body.result === "") {
                    const user = await userRepo.createQueryBuilder("user")
                        .leftJoinAndSelect("user.blocked", "blockedUsers")
                        // @ts-ignore
                        .where("user.username = :username", {username: token.username}).getOne()
                    if (user.blocked.length === 1 && user.blocked[0].username === username2) {
                        done();
                    } else {
                        done("Kullanıcı blocked length != 1 HATA!");
                    }
                } else {
                    done("Kullanıcı block HATA!")
                }
            });
    })

    it ("unblock", (done) => {
        const data = {username: username2, token: user1_token};
        // @ts-ignore
        chai.request(app).post("/unblock")
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(data)
            // @ts-ignore
            .end(async (err, response) => {
                // @ts-ignore
                const token = jwt.verify(user1_token, process.env.SECRET);
                if (response.body.result === "") {
                    const user = await userRepo.createQueryBuilder("user")
                        .leftJoinAndSelect("user.blocked", "blockedUsers")
                        // @ts-ignore
                        .where("user.username = :username", {username: token.username}).getOne()
                    if (user.blocked.length === 0) {
                        done();
                    } else {
                        done("Kullanıcı unblocked length != 0 HATA!");
                    }
                } else {
                    done("Kullanıcı unblock HATA!")
                }
            });
    })

    after(() => {

        userRepo.delete({username: username1})
        userRepo.delete({username: username2})
    })
})
