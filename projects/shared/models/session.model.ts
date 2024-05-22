import { DocumentReference } from "@angular/fire/compat/firestore"

export interface SessionJson {
    id: string
    title: string
    date: any
    description: string
    liveCourseRef: DocumentReference
    duration: number
    vimeoId1: number,
    files: []
}

export class Session {

    public static collection = 'live-course-session'

    constructor(
        public id: string,
        public title: string,
        public date: any,
        public description: string,
        public liveCourseRef: DocumentReference,
        public duration: number,
        public vimeoId1: number,
        public files: [],
    ) {}

    public static fromJson(SessionJson: SessionJson): Session {
        return new Session(
            SessionJson.id,
            SessionJson.title,
            SessionJson.date,
            SessionJson.description,
            SessionJson.liveCourseRef,
            SessionJson.duration,
            SessionJson.vimeoId1,
            SessionJson.files,
        )
    }

    public toJson(): SessionJson {
        return {
            id:this.id,
            title:this.title,
            date:this.date,
            description:this.description,
            liveCourseRef : this.liveCourseRef,
            duration : this.duration,
            vimeoId1 : this.vimeoId1,
            files : this.files,
        }
    }
}