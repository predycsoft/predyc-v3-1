import { DocumentReference } from "@angular/fire/compat/firestore"

export interface StudyPlanClassJson {
    id: string,
    userRef: DocumentReference | null,
    classRef: DocumentReference | null
    coursesByStudentRef: DocumentReference | null
    completed: boolean
    dateStart: Date | null
    dateEnd: Date | null
    active: boolean
    review:string
    reviewDate: Date

}

export class StudyPlanClass {
    public static collection: string = 'classesByStudent'
    public id: string;
    public userRef: DocumentReference 
    public classRef: DocumentReference
    public coursesByStudentRef: DocumentReference
    public review: string = null
    public reviewDate: Date = null
    public completed:boolean = false;
    public dateStart: Date = null
    public dateEnd: Date = null
    public active: boolean = true;

    public static fromJson(StudyPlanClassJson: StudyPlanClass): StudyPlanClass {
        let classPlan = new StudyPlanClass();
        classPlan.id = StudyPlanClassJson.id
        classPlan.userRef = StudyPlanClassJson.userRef
        classPlan.classRef = StudyPlanClassJson.classRef
        classPlan.completed = StudyPlanClassJson.completed
        classPlan.dateStart= StudyPlanClassJson.dateStart
        classPlan.dateEnd = StudyPlanClassJson.dateEnd
        classPlan.coursesByStudentRef = StudyPlanClassJson.coursesByStudentRef
        classPlan.review = StudyPlanClassJson.review
        classPlan.reviewDate = StudyPlanClassJson.reviewDate

        classPlan.active = StudyPlanClassJson.active

        return classPlan
    }
      
    toJson(): StudyPlanClassJson {
        return {
            id: this.id,
            userRef: this.userRef,
            classRef: this.classRef,
            completed: this.completed,
            dateStart: this.dateStart,
            dateEnd: this.dateEnd,
            coursesByStudentRef: this.coursesByStudentRef,
            active: this.active,
            review: this.review,
            reviewDate: this.reviewDate

        }
    }
}