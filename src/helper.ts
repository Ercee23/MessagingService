import {Response} from "express";

export const checkBodyValid = (body, fields, response: Response) => {
    if (body === null || typeof body !== "object" || Object.keys(body).length === 0) {
        response.send({result: "Hatalı mesaj formatı"})
        return false;
    }
    const missingFields = []
    for (let key of fields) {
        if (!Object.keys(body).includes(key)) {
            missingFields.push(key);
        }
    }
    if (missingFields.length !== 0) {
        response.send({result: "Hatalı alanlar: " + missingFields.toString() + " Olması gerekenler: " + fields.toString()})
        return false;
    }
    return true;
}
/*
* field checker for ws message receivers
* content :
* */
export const checkContentValid = (content, fields) => {
    if (content === null || typeof content !== "object" || Object.keys(content).length === 0) {
        return false;
    }
    for (let key in content) {
        if (!fields.includes(key)) {
            return false;
        }
    }
    return true;
}