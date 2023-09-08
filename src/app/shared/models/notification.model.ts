export interface Notification {
    id: string,
    readByUsers: [],
    readByAdmin: boolean,
    message: string,
    date: number, // timestamp
    userId: string,
    empresaId: string,
    type: 'alert' | 'activity' | 'request'
}

// export interface NotificationJson {
//     id: string,
//     readByUsers: [],
//     readByAdmin: boolean,
//     message: string,
//     date: number, // timestamp
//     userId: string,
//     empresaId: string,
//     type: 'alert' | 'activity' | 'request'
// }

// export class Notification {

//     public static TYPE_ALERT: string = 'alert'
//     public static TYPE_ACTIVITY: string = 'activity'
//     public static TYPE_REQUEST: string = 'request'

//     public id: string
//     public readByUsers: []
//     public readByAdmin: boolean
//     public message: string
//     public date: number // timestamp
//     public userId: string
//     public empresaId: string
//     public type: 'alert' | 'activity' | 'request'

//     constructor(
//         id: string,
//         readByUsers: [],
//         readByAdmin: boolean,
//         message: string,
//         date: number, // timestamp
//         userId: string,
//         empresaId: string,
//         type: string
//     ) {
//         this.id = 
//         this.readByUsers = 
//         this.readByAdmin = 
//         this.message = 
//         this.date = 
//         this.userId = 
//         this.empresaId = 
//         this.type = 
//     }
// }