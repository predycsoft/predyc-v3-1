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
    orderExam:boolean
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
        public vimeoFolderId: string = "",
        public orderExam: boolean = false

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
            liveCourseTemplateJson.orderExam
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
            orderExam:this.orderExam,
        }
    }
}

export interface LiveCourseJson {
    canTakeDiagnosticTest: boolean
	canTakeFinalTest: boolean
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
    orderExam:boolean
}

export class LiveCourse {

    public static collection = 'live-course'

    constructor (
        public canTakeDiagnosticTest: boolean,
		public canTakeFinalTest: boolean,
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
        public orderExam:boolean = false,
    ) {}

    public static fromJson(liveCourseJson: LiveCourseJson): LiveCourse {
        return new LiveCourse(
            liveCourseJson.canTakeDiagnosticTest,
			liveCourseJson.canTakeFinalTest,
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
            liveCourseJson.orderExam
        )
    }

    public toJson(): LiveCourseJson {
        return {
            canTakeDiagnosticTest: this.canTakeDiagnosticTest,
			canTakeFinalTest: this.canTakeFinalTest,
            id: this.id,
            title: this.title,
            photoUrl: this.photoUrl,
            description: this.description,
            instructorRef : this.instructorRef,
            proximamente : this.proximamente,
            skillsRef : this.skillsRef,
            duration : this.duration,
            vimeoFolderId : this.vimeoFolderId,
            liveCourseTemplateRef : this.liveCourseTemplateRef,
            meetingLink : this.meetingLink,
            identifierText : this.identifierText,
            emailLastDate : this.emailLastDate,
            orderExam:this.orderExam,
        }
    }
}
