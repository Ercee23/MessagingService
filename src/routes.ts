import {getMessages, getUnReadMessages, sendMessage} from './controller/MessageController';
import {login, register, block, unblock} from "./controller/UserController";

export let AppRoutes = [
    {
        path: "/getMessages",
        method: "get",
        action: getMessages
    },
    {
        path: "/getUnread",
        method: "get",
        action: getUnReadMessages
    },
    {
        path: "/login",
        method: "post",
        action: login
    },
    {
        path: "/register",
        method: "post",
        action: register
    },
    {
        path: "/sendMessage",
        method: "post",
        action: sendMessage
    },
    {
        path: "/block",
        method: "post",
        action: block
    },
    {
        path: "/unblock",
        method: "post",
        action: unblock
    }

]