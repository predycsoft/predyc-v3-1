import { DocumentReference } from "@angular/fire/compat/firestore";
import { User } from "./user.model";

export interface NotificationJson {
    date: number // timestamp
    enterpriseRef: DocumentReference | null
    id: string | null
    message: string
    readByUser: Date
    clearByUser: Date
    // readByAdmin: boolean
    type: 
        typeof Notification.TYPE_ALERT |
        typeof Notification.TYPE_EVENT
    subType: 
        typeof Notification.SUBTYPE_ALERT_DELAYED |
        typeof Notification.SUBTYPE_ALERT_PENDING | 
        typeof Notification.SUBTYPE_EVENT_SUCCEDED
    userRef: DocumentReference | null
}

export class Notification {

    public static collection: string = 'notification'

    public static TYPE_ALERT: string = 'alert'
    public static TYPE_EVENT: string = 'event'


    public static SUBTYPE_ALERT_DELAYED: string = 'delayed'
    public static SUBTYPE_ALERT_PENDING: string = 'pending' //Por vencer
    public static SUBTYPE_EVENT_SUCCEDED: string = 'succeded'

    public static subTypeToDisplayValueDict = {
        delayed: 'planes de estudio atrasados',
        pending: 'licencias por vencer',
        succeded: 'planes de estudio completados',
        request: 'solicitudes',
    };

    public user: User

    constructor(
        public date: number, // timestamp
        // public enterprise: Enterprise,
        public enterpriseRef: DocumentReference | null,
        public id: string | null,
        public message: string,
        public readByUser: Date,
        public ClearByUser: Date,
        // public readByAdmin: boolean,
        public type: 
            typeof Notification.TYPE_ALERT |
            typeof Notification.TYPE_EVENT,
        public subType: 
            typeof Notification.SUBTYPE_ALERT_DELAYED |
            typeof Notification.SUBTYPE_ALERT_PENDING | 
            typeof Notification.SUBTYPE_EVENT_SUCCEDED,
        public userRef: DocumentReference | null
    ) {}

    public static fromJson(notificationJson: NotificationJson): Notification {
        return new Notification(
            notificationJson.date,
            notificationJson.enterpriseRef,
            notificationJson.id,
            notificationJson.message,
            notificationJson.readByUser,
            notificationJson.clearByUser,
            // notificationJson.readByAdmin,
            notificationJson.type,
            notificationJson.subType,
            notificationJson.userRef
        )
    }

    public toJson(): NotificationJson {
        return {
            readByUser: this.readByUser,
            clearByUser: this.ClearByUser,
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