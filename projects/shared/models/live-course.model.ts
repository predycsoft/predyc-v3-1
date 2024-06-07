import { DocumentReference } from "@angular/fire/compat/firestore"
import { Skill } from "./skill.model"

export interface LiveCourseTemplateJson {
    id: string
    companyName: string // currently not in use
    title: string
    photoUrl: string
    description: string
    instructorRef: DocumentReference
    proximamente: boolean
    skillsRef: DocumentReference<Skill>[]
    duration: number,
    vimeoFolderId: string,
}

export class LiveCourseTemplate {

    public static collection = 'live-course-template'

    constructor(
        public id: string,
        public companyName: string,
        public title: string,
        public photoUrl: string,
        public description: string,
        public instructorRef: DocumentReference,
        public proximamente: boolean,
        public skillsRef: DocumentReference<Skill>[],
        public duration: number,
        public vimeoFolderId: string = ""

    ) {}

    public static fromJson(liveCourseTemplateJson: LiveCourseTemplateJson): LiveCourseTemplate {
        return new LiveCourseTemplate(
            liveCourseTemplateJson.id,
            liveCourseTemplateJson.companyName,
            liveCourseTemplateJson.title,
            liveCourseTemplateJson.photoUrl,
            liveCourseTemplateJson.description,
            liveCourseTemplateJson.instructorRef,
            liveCourseTemplateJson.proximamente,
            liveCourseTemplateJson.skillsRef,
            liveCourseTemplateJson.duration,
            liveCourseTemplateJson.vimeoFolderId,
        )
    }

    public toJson(): LiveCourseTemplateJson {
        return {
            id:this.id,
            companyName:this.companyName,
            title:this.title,
            photoUrl:this.photoUrl,
            description:this.description,
            instructorRef : this.instructorRef,
            proximamente : this.proximamente,
            skillsRef : this.skillsRef,
            duration : this.duration,
            vimeoFolderId : this.vimeoFolderId,
        }
    }
}

export interface LiveCourseJson {
    companyName: string // currently not in use
    description: string
    duration: number,
    id: string
    instructorRef: DocumentReference
    liveCourseTemplateRef: DocumentReference
    photoUrl: string
    proximamente: boolean
    skillsRef: DocumentReference<Skill>[]
    title: string
    meetingLink: string
    identifierText: string
    emailLastDate: any
    vimeoFolderId: string,
}

export class LiveCourse {

    public static collection = 'live-course'

    constructor(
        public companyName: string,
        public description: string,
        public duration: number,
        public emailLastDate: any,
        public id: string,
        public identifierText: string,
        public instructorRef: DocumentReference,
        public liveCourseTemplateRef: DocumentReference,
        public meetingLink: string,
        public photoUrl: string,
        public proximamente: boolean,
        public skillsRef: DocumentReference<Skill>[],
        public title: string,
        public vimeoFolderId: string = "",
    ) {}

    public static fromJson(liveCourseJson: LiveCourseJson): LiveCourse {
        return new LiveCourse(
            liveCourseJson.companyName,
            liveCourseJson.description,
            liveCourseJson.duration,
            liveCourseJson.emailLastDate,
            liveCourseJson.id,
            liveCourseJson.identifierText,
            liveCourseJson.instructorRef,
            liveCourseJson.liveCourseTemplateRef,
            liveCourseJson.meetingLink,
            liveCourseJson.photoUrl,
            liveCourseJson.proximamente,
            liveCourseJson.skillsRef,
            liveCourseJson.title,
            liveCourseJson.vimeoFolderId,
        )
    }

    public toJson(): LiveCourseJson {
        return {
            id:this.id,
            companyName:this.companyName,
            title:this.title,
            photoUrl:this.photoUrl,
            description:this.description,
            instructorRef : this.instructorRef,
            proximamente : this.proximamente,
            skillsRef : this.skillsRef,
            duration : this.duration,
            vimeoFolderId : this.vimeoFolderId,
            liveCourseTemplateRef : this.liveCourseTemplateRef,
            meetingLink : this.meetingLink,
            identifierText : this.identifierText,
            emailLastDate : this.emailLastDate,
        }
    }
}


// export interface LiveCourseJson {
//     id: string
//     companyName: string
//     title: string
//     photoUrl: string
//     // meetingLink: string
//     description: string
//     instructorRef: DocumentReference
//     proximamente: boolean
//     skillsRef: DocumentReference<Skill>[]
//     duration: number,
//     vimeoFolderId: string,
//     // nivel: string,
    
// }

// export class LiveCourse {

//     public static collection = 'live-course'

//     constructor(
//         public id: string,
//         public companyName: string,
//         public title: string,
//         public photoUrl: string,
//         // public meetingLink: string,
//         public description: string,
//         public instructorRef: DocumentReference,
//         public proximamente: boolean,
//         public skillsRef: DocumentReference<Skill>[],
//         public duration: number,
//         public vimeoFolderId: string = ""

//     ) {}

//     public static fromJson(liveCourseJson: LiveCourseJson): LiveCourse {
//         return new LiveCourse(
//             liveCourseJson.id,
//             liveCourseJson.companyName,
//             liveCourseJson.title,
//             liveCourseJson.photoUrl,
//             // liveCourseJson.meetingLink,
//             liveCourseJson.description,
//             liveCourseJson.instructorRef,
//             liveCourseJson.proximamente,
//             liveCourseJson.skillsRef,
//             liveCourseJson.duration,
//             liveCourseJson.vimeoFolderId,
//         )
//     }

//     public toJson(): LiveCourseJson {
//         return {
//             id:this.id,
//             companyName:this.companyName,
//             title:this.title,
//             photoUrl:this.photoUrl,
//             // meetingLink:this.meetingLink,
//             description:this.description,
//             instructorRef : this.instructorRef,
//             proximamente : this.proximamente,
//             skillsRef : this.skillsRef,
//             duration : this.duration,
//             vimeoFolderId : this.vimeoFolderId,
//         }
//     }
// }

// export interface LiveCourseSonJson {
//     id: string
//     parentId: string
//     meetingLink: string
//     identifierText: string
//     emailLastDate: any
// }

// export class LiveCourseSon {

//     public static subCollection = 'live-course-son'

//     constructor(
//         public id: string,
//         public parentId: string,
//         public meetingLink: string,
//         public identifierText: string,
//         public emailLastDate: any,
//     ) {}

//     public static fromJson(liveCourseSon: LiveCourseSonJson): LiveCourseSon {
//         return new LiveCourseSon(
//             liveCourseSon.id,
//             liveCourseSon.parentId,
//             liveCourseSon.meetingLink,
//             liveCourseSon.identifierText,
//             liveCourseSon.emailLastDate,
//         )
//     }

//     public toJson(): LiveCourseSonJson {
//         return {
//             id: this.id,
//             parentId: this.parentId,
//             meetingLink: this.meetingLink,
//             identifierText: this.identifierText,
//             emailLastDate: this.emailLastDate,
//         }
//     }
// }
