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

// export class Notification {
//     constructor(
//         public
//     ) {

//     }
// }