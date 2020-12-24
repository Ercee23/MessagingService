import {Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable, Index} from "typeorm";
import {Message} from "./Message";

@Entity()
export class User {

    constructor(username: string, password: string, firstname: string, lastname: string) {
        this.username = username;
        this.password = password;
        this.firstname = firstname;
        this.lastname = lastname;
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    password: string;

    @Column()
    firstname: string;

    @Column()
    lastname: string;

    @Column()
    @Index({ unique: true })
    username: string;

    @JoinTable()
    @ManyToMany(() => User, user => user.blocked)
    blocked: User[];

    @OneToMany(() => Message, message => message.receiver)
    receivedMessages: Message[]

    @OneToMany(() => Message, message => message.sender)
    sentMessages: Message[]

}
