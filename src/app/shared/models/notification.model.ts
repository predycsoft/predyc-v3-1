import { DocumentReference } from "@angular/fire/compat/firestore";
import { User } from "./user.model";

export interface NotificationJson {
    date: number // timestamp
    enterpriseRef: DocumentReference | null
    id: string | null
    message: string
    // readByUser: boolean
    // readByAdmin: boolean
    type: 
        typeof Notification.TYPE_ALERT |
        typeof Notification.TYPE_EVENT
    subType: 
        typeof Notification.SUBTYPE_ALERT_DELAYED |
        typeof Notification.SUBTYPE_ALERT_EXPIRED | 
        typeof Notification.SUBTYPE_ALERT_PENDING | 
        typeof Notification.SUBTYPE_EVENT_SUCCEDED|
        typeof Notification.SUBTYPE_EVENT_REQUEST 
    userRef: DocumentReference | null
}

export class Notification {

    public static collection: string = 'notification'

    public static TYPE_ALERT: string = 'alert'
    public static TYPE_EVENT: string = 'event'


    public static SUBTYPE_ALERT_DELAYED: string = 'delayed'
    public static SUBTYPE_ALERT_EXPIRED: string = 'expired'
    public static SUBTYPE_ALERT_PENDING: string = 'pending' //Por vencer
    public static SUBTYPE_EVENT_SUCCEDED: string = 'succeded'
    public static SUBTYPE_EVENT_REQUEST: string = 'request'

    public static subTypeToDisplayValueDict = {
        delayed: 'cursos atrasados',
        expired: 'licencias vencidas',
        pending: 'licencias por vencer',
        succeded: 'cursos completados',
        request: 'solicitudes',
    };

    public user: User

    constructor(
        public date: number, // timestamp
        // public enterprise: Enterprise,
        public enterpriseRef: DocumentReference | null,
        public id: string | null,
        public message: string,
        // public readByUser: boolean,
        // public readByAdmin: boolean,
        public type: 
            typeof Notification.TYPE_ALERT |
            typeof Notification.TYPE_EVENT,
        public subType: 
            typeof Notification.SUBTYPE_ALERT_DELAYED |
            typeof Notification.SUBTYPE_ALERT_EXPIRED | 
            typeof Notification.SUBTYPE_ALERT_PENDING | 
            typeof Notification.SUBTYPE_EVENT_SUCCEDED|
            typeof Notification.SUBTYPE_EVENT_REQUEST,  
        public userRef: DocumentReference | null
    ) {}

    public static fromJson(notificationJson: NotificationJson): Notification {
        return new Notification(
            notificationJson.date,
            notificationJson.enterpriseRef,
            notificationJson.id,
            notificationJson.message,
            // notificationJson.readByUser,
            // notificationJson.readByAdmin,
            notificationJson.type,
            notificationJson.subType,
            notificationJson.userRef
        )
    }

    public toJson(): NotificationJson {
        return {
            date: this.date,
            enterpriseRef: this.enterpriseRef,
            id: this.id,
            message: this.message,
            // readByUser: this.readByUser,
            // readByAdmin: this.readByAdmin,
            type: this.type,
            subType: this.subType,
            userRef: this.userRef,
        }
    }
}