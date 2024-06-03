import { DocumentReference } from "@angular/fire/compat/firestore"
import { Skill } from "./skill.model"

export interface LiveCourseJson {
    id: string
    companyName: string
    title: string
    photoUrl: string
    // meetingLink: string
    description: string
    instructorRef: DocumentReference
    proximamente: boolean
    skillsRef: DocumentReference<Skill>[]
    duration: number,
    vimeoFolderId: string,
    // nivel: string,
    
}

export class LiveCourse {

    public static collection = 'live-course'

    constructor(
        public id: string,
        public companyName: string,
        public title: string,
        public photoUrl: string,
        // public meetingLink: string,
        public description: string,
        public instructorRef: DocumentReference,
        public proximamente: boolean,
        public skillsRef: DocumentReference<Skill>[],
        public duration: number,
        public vimeoFolderId: string = ""

    ) {}

    public static fromJson(liveCourseJson: LiveCourseJson): LiveCourse {
        return new LiveCourse(
            liveCourseJson.id,
            liveCourseJson.companyName,
            liveCourseJson.title,
            liveCourseJson.photoUrl,
            // liveCourseJson.meetingLink,
            liveCourseJson.description,
            liveCourseJson.instructorRef,
            liveCourseJson.proximamente,
            liveCourseJson.skillsRef,
            liveCourseJson.duration,
            liveCourseJson.vimeoFolderId,
        )
    }

    public toJson(): LiveCourseJson {
        return {
            id:this.id,
            companyName:this.companyName,
            title:this.title,
            photoUrl:this.photoUrl,
            // meetingLink:this.meetingLink,
            description:this.description,
            instructorRef : this.instructorRef,
            proximamente : this.proximamente,
            skillsRef : this.skillsRef,
            duration : this.duration,
            vimeoFolderId : this.vimeoFolderId,
        }
    }
}

export interface LiveCourseSonJson {
    id: string
    parentId: string
    meetingLink: string
    identifierText: string
    emailLastDate: any
}

export class LiveCourseSon {

    public static subCollection = 'live-course-son'

    constructor(
        public id: string,
        public parentId: string,
        public meetingLink: string,
        public identifierText: string,
        public emailLastDate: any,
    ) {}

    public static fromJson(liveCourseSon: LiveCourseSonJson): LiveCourseSon {
        return new LiveCourseSon(
            liveCourseSon.id,
            liveCourseSon.parentId,
            liveCourseSon.meetingLink,
            liveCourseSon.identifierText,
            liveCourseSon.emailLastDate,
        )
    }

    public toJson(): LiveCourseSonJson {
        return {
            id: this.id,
            parentId: this.parentId,
            meetingLink: this.meetingLink,
            identifierText: this.identifierText,
            emailLastDate: this.emailLastDate,
        }
    }
}

// export interface LiveCourseEmailJson {
//     id: string
//     content: string
//     liveCourseSonRef: DocumentReference<LiveCourseJson>
//     date: any
// }

// export class LiveCourseEmail {

//     public static subCollection = 'live-course-email'

//     constructor(
//         public id: string,
//         public content: string,
//         public liveCourseSonRef: DocumentReference<LiveCourseJson>,
//         public date: any,
//     ) {}

//     public static fromJson(liveCourseEmailJson: LiveCourseEmailJson): LiveCourseEmail {
//         return new LiveCourseEmail(
//             liveCourseEmailJson.id,
//             liveCourseEmailJson.content,
//             liveCourseEmailJson.liveCourseSonRef,
//             liveCourseEmailJson.date,
//         )
//     }

//     public toJson(): LiveCourseEmailJson {
//         return {
//             id:this.id,
//             content:this.content,
//             liveCourseSonRef:this.liveCourseSonRef,
//             date:this.date,
//         }
//     }
// }