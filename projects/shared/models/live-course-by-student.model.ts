import { DocumentReference } from "@angular/fire/compat/firestore"
import { LiveCourse } from "./live-course.model";
// "inscritos" sub collection info

export interface LiveCourseByStudentJson {
	id: string;
	isActive: boolean;
	companyName: string;
	completed: boolean;
	userRef: DocumentReference;
	liveCourseRef: DocumentReference<LiveCourse>;
	isAttending: boolean;
	diagnosticTestPresented: boolean
	diagnosticTestScore: number | null
	finalTestPresented: boolean
	finalTestScore: number | null
}

export class LiveCourseByStudent {
	public static collection = "live-course-by-student";

	constructor(
		public id: string, 
		public isActive: boolean, 
		public companyName: string, 
		public completed: boolean, 
		public userRef: DocumentReference, 
		public liveCourseRef: DocumentReference<LiveCourse>, 
		public isAttending: boolean,
		public diagnosticTestPresented: boolean,
		public diagnosticTestScore: number | null,
		public finalTestPresented: boolean,
		public finalTestScore: number | null
	) {}

	public static fromJson(liveCourseByStudentJson: LiveCourseByStudentJson): LiveCourseByStudent {
		return new LiveCourseByStudent(
			liveCourseByStudentJson.id, 
			liveCourseByStudentJson.isActive, 
			liveCourseByStudentJson.companyName, 
			liveCourseByStudentJson.completed, 
			liveCourseByStudentJson.userRef, 
			liveCourseByStudentJson.liveCourseRef, 
			liveCourseByStudentJson.isAttending,
			liveCourseByStudentJson.diagnosticTestPresented,
			liveCourseByStudentJson.diagnosticTestScore,
			liveCourseByStudentJson.finalTestPresented,
			liveCourseByStudentJson.finalTestScore
		);
	
	}

	public toJson(): LiveCourseByStudentJson {
		return {
			id: this.id,
			isActive: this.isActive,
			companyName: this.companyName,
			completed: this.completed,
			userRef: this.userRef,
			liveCourseRef: this.liveCourseRef,
			isAttending: this.isAttending,
			diagnosticTestPresented: this.diagnosticTestPresented,
			diagnosticTestScore: this.diagnosticTestScore,
			finalTestPresented: this.finalTestPresented,
			finalTestScore: this.finalTestScore,
		};
	}
}