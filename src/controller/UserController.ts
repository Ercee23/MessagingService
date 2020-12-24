import {Request, Response} from "express";
import {getRepository} from "typeorm";
import {User} from '../db/entities/User';
import {randomBytes, scrypt} from "crypto";
import * as jwt from "jsonwebtoken";
import {checkBodyValid} from "../helper";
import {log} from "../index";

const loginFields = ["username", "password"];
const registerFields = ["username", "firstname", "lastname", "password"];
const blockFields = ["token", "username"];
const unblockFields = ["token", "username"];

async function hash(password) : Promise<string>{
    return new Promise<string>((resolve, reject)  => {
        const salt = randomBytes(8).toString("hex")

        scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(salt + ":" + derivedKey.toString('hex'))
        });
    })
}

async function verify(password, hash) {
    return new Promise((resolve, reject) => {
        const [salt, key] = hash.split(":")
        scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(key == derivedKey.toString('hex'))
        });
    })
}


export async function login(request: Request, response: Response) {
    let body = request.body
    if (!checkBodyValid(body, loginFields, response)) {
        log.error("Invalid Type Body Type")
        return;
    }
    getRepository(User).findOne({username: body.username}).then(user => {
        if (user) {
            verify(body.password, user.password).then(result => {
                if (result) {
                    const payload = {
                        id: user.id,
                        username: user.username,
                        firstname: user.firstname,
                        lastname: user.lastname
                    }
                    // @ts-ignore
                    const token = jwt.sign(payload, process.env.SECRET)
                    log.info("User:" + user.username + "logged in successfully")
                    response.send({token: token, result: ""})
                } else {
                    log.warn("User:" + user.username + "provided wrong password")
                    response.send({result: "Hatalı şifre"})
                }
            })
        } else {
            log.warn("Non existing username provided")
            response.send({result: "Hatalı kullanıcı adı"})
        }
    }).catch(error => {
        if (error) {
            log.fatal("Connection error")
            response.send({result: "Bağlantı Hatası"})
        }
    });
}

export async function register(request: Request, response: Response) {
    let body = request.body;
    if (!checkBodyValid(body, registerFields, response)) {
        log.error("Invalid Type Body Type")
        return;
    }
    const userRepository = getRepository(User);
    userRepository.findOne({username: body.username}).then(user => {
        if (user){
            log.warn("Existing username provided")
            response.send({result: "Kullanıcı adı kullanılıyor"});
        } else {
            hash(body.password).then(hash => {
                const newUser = new User(body.username, hash, body.firstname, body.lastname)
                user = userRepository.create(newUser)
                userRepository.save(user)
                log.info("User" + body.username + "registered");
                response.send({result: ""});
            })
        }
    }).catch(error => {
        if (error) {
            log.fatal("Connection error")
            response.send({result: "Bağlantı Hatası"})
        }
    });
}

export async function block(request: Request, response: Response) {
    let body = request.body;
    if (!checkBodyValid(body, blockFields, response)) {
        log.error("Invalid Type Body Type")
        return;
    }
    const userRepository = getRepository(User)
    // @ts-ignore
    let token;
    try {
        // @ts-ignore
        token = jwt.verify(body.token, process.env.SECRET);
        log.info("JWT verified");
    }
    catch {
        log.error("JWT error")
        response.send({result: "JWT hatalı"})
        return;
    }

    const user: User = await userRepository.createQueryBuilder("user")
        .leftJoinAndSelect("user.blocked", "blockedUsers")
        // @ts-ignore
        .where("user.username = :username", {username: token.username}).getOne()"
    if (user) {
        // @ts-ignore
        const blockedUser: User = await userRepository.findOne({username: body.username})
        if (blockedUser) {
            if ((user.blocked.filter(blocked => blocked.id === blockedUser.id)).length !== 0 ) {
                log.info("User:" + blockedUser.username + "is already blocked by" + user.username)
                response.send({result: "Kullanıcı zaten engellenmiş"})
            } else {
                user.blocked.push(blockedUser);
                await userRepository.save(user)
                log.info("User:" + blockedUser.username + "successfully blocked by" + user.username)
                response.send({result: ""});
            }
        } else {
            log.warn("User couldnt find")
            response.send({result: "Kullanıcı bulunamadı"});
        }
    } else {
        log.error("JWT has wrong content")
        response.send({result: "Hatalı bilgi tekrar giriş yapın"})
    }
}

export async function unblock(request: Request, response: Response) {
    let body = request.body;
    if (!checkBodyValid(body, unblockFields, response)) {
        log.error("Invalid Type Body Type")
        return;
    }
    const userRepository = getRepository(User)
    // @ts-ignore
    let token;
    try {
        // @ts-ignore
        token = jwt.verify(body.token, process.env.SECRET);
        log.info("JWT verified");
    }
    catch {
        log.error("JWT error")
        response.send({result: "JWT hatalı"})
        return;
    }

    const user: User = await userRepository.createQueryBuilder("user")
        .leftJoinAndSelect("user.blocked", "blockedUsers")
        // @ts-ignore
        .where("user.username = :username", {username: token.username}).getOne()

    if (user) {
        // @ts-ignore
        const blockedUser: User = await userRepository.findOne({username: body.username})
        if (blockedUser) {
            let index = -1
            for (let i = 0; i < user.blocked.length; i++) {
                if (user.blocked[i].id === blockedUser.id) {
                    index = i;
                    break;
                }
            }
            if (index === -1) {
                log.warn("User:" + blockedUser.username + "isn't blocked by" + user.username)
                response.send({result: "Kullanıcı zaten engellenmemiş"})
            } else {
                user.blocked.splice(index,1);
                await userRepository.save(user)
                log.info("User:" + blockedUser.username + "successfully unblocked by" + user.username)
                response.send({result: ""});
            }
        } else {
            log.warn("User couldnt find to unblock")
            response.send({result: "Kullanıcı bulunamadı"});
        }
    } else {
        log.error("JWT has wrong content")
        response.send({result: "Hatalı bilgi tekrar giriş yapın"})
    }
}