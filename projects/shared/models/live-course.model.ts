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

    public static fromJson(QuestionJson: LiveCourseJson): LiveCourse {
        return new LiveCourse(
            QuestionJson.id,
            QuestionJson.companyName,
            QuestionJson.title,
            QuestionJson.photoUrl,
            // QuestionJson.meetingLink,
            QuestionJson.description,
            QuestionJson.instructorRef,
            QuestionJson.proximamente,
            QuestionJson.skillsRef,
            QuestionJson.duration,
            QuestionJson.vimeoFolderId,
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
}

export class LiveCourseSon {

    public static subCollection = 'live-course-son'

    constructor(
        public id: string,
        public parentId: string,
        public meetingLink: string,
        public identifierText: string,
    ) {}

    public static fromJson(QuestionJson: LiveCourseSonJson): LiveCourseSon {
        return new LiveCourseSon(
            QuestionJson.id,
            QuestionJson.parentId,
            QuestionJson.meetingLink,
            QuestionJson.identifierText,
        )
    }

    public toJson(): LiveCourseSonJson {
        return {
            id:this.id,
            parentId:this.parentId,
            meetingLink:this.meetingLink,
            identifierText:this.identifierText,
        }
    }
}