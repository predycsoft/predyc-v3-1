import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { LiveCourseByStudent } from 'projects/shared/models/live-course-by-student.model';
import { Observable, Subscription, combineLatest, map, switchMap } from 'rxjs';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { User, UserJson } from 'projects/shared/models/user.model';
import { LiveCourse } from 'projects/shared/models/live-course.model';
import { LiveCourseService } from 'projects/predyc-business/src/shared/services/live-course.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import Swal from 'sweetalert2';
import * as XLSX from "xlsx-js-style";
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DialogAssignLiveCoursesComponent } from './dialog-assign-live-courses/dialog-assign-live-courses.component';
import { CreateUserComponent } from 'projects/predyc-business/src/app/business-pages/management/my-team/student/create-user/create-user.component';


interface DataToShow {
	id: string
	userEmail: string
	userName: string
	diagnosticTest: string
	finalTest: string
	certificate: string
	isAttending: boolean
}

@Component({
  selector: 'app-live-course-student-list',
  templateUrl: './live-course-student-list.component.html',
  styleUrls: ['./live-course-student-list.component.css']
})
export class LiveCourseStudentListComponent {
	constructor(
		private router: Router,
		private activatedRoute: ActivatedRoute,
		public icon: IconService,
		public liveCourseService: LiveCourseService,
		public userService: UserService,
		private modalService: NgbModal,

		// test
		private afs: AngularFirestore,
	) {}

	@Input() liveCourseTemplateId: string
	@Input() liveCourseId: string
	@Output() userEmailsChanged = new EventEmitter<string[]>();

	displayedColumns: string[] = ["userEmail", "userName", "diagnosticTest", "finalTest", "certificate", "attendance"];

	dataSource = new MatTableDataSource<DataToShow>();

	@ViewChild(MatPaginator) paginator: MatPaginator;

	queryParamsSubscription: Subscription;
	pageSize: number = 7;
	totalLength: number;

	showSaveButton: boolean = false;
	
	liveCourseServiceSubscription: Subscription
	
	userEmails: string[] = []
	
	liveCourseRef: DocumentReference<LiveCourse>


	ngOnInit() {
		this.liveCourseRef = this.liveCourseService.getLiveCourseRefById(this.liveCourseId)
		this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe((params) => {
			const page = Number(params["page"]) || 1;
			this.performSearch(page);
		});
	}

	ngAfterViewInit() {
		this.dataSource.paginator = this.paginator;
		this.dataSource.paginator.pageSize = this.pageSize;
	}

	performSearch(page: number) {
		this.liveCourseServiceSubscription = this.liveCourseService.getLiveCoursesByStudentByLivecourseSon$(this.liveCourseRef).pipe(
		  switchMap(liveCoursesByStudent => {
			const userObservables: Observable<DataToShow>[] = liveCoursesByStudent.map(liveCourseByStudent => {
			  return this.userService.getUser$(liveCourseByStudent.userRef.id).pipe(
				map(userData => ({
					id: liveCourseByStudent.id,
					userEmail: userData.email,
					userName: userData.displayName,
					diagnosticTest: null,
					finalTest: null,
					certificate: null,
					isAttending: liveCourseByStudent.isAttending
				}))
			  );
			});
	  
			return combineLatest(userObservables);
		  })
		).subscribe(dataTosShow => {
		//   console.log("dataTosShow", dataTosShow);
		  this.paginator.pageIndex = page - 1;
		  this.dataSource.data = dataTosShow;
		  this.totalLength = dataTosShow.length;
		  // Emit the user emails
		  this.userEmails = dataTosShow.map(data => data.userEmail);
		  this.userEmailsChanged.emit(this.userEmails);
		});
	}

	onPageChange(page: number): void {
		this.router.navigate([], {
			queryParams: { page },
			queryParamsHandling: "merge",
		});
	}

	async onAttendanceChange(event: Event, data: DataToShow) {
		// Get the current checkbox state
		const target = event.target as HTMLInputElement;
		const newValue = target.checked;
	  
		// Store the original value to revert if necessary
		const originalValue = data.isAttending;
		
		// Temporarily update the isAttending value
		data.isAttending = newValue;
	  
		// Show confirmation dialog
		Swal.fire({
		  title: "Actualizaremos tu asistencia",
		  text: "¿Deseas continuar?",
		  icon: "info",
		  showCancelButton: true,
		  confirmButtonText: "Guardar",
		  confirmButtonColor: 'var(--blue-5)',
		}).then(async (result) => {
		  if (result.isConfirmed) {
			// Proceed with updating the database
			await this.liveCourseService.updateIsAttendingLiveCourseByStudent(data.id, newValue);
			console.log("Attendance updated:", data);
		  } else {
			// Revert the change if not confirmed
			data.isAttending = originalValue;
			target.checked = originalValue;
		  }
		});
	}

	onSelect(data) {
		
	}

	downloadExcel() {
		const columnTitles = [ 'Correo del estudiante', 'Nombre del estudiante', 'Diagnostico', 'Fin', 'Certificado', 'Asistencia'];
	  
		const dataToExport = this.dataSource.data.map(row => {
		  const obj = {};
		  obj[columnTitles[0]] = row.userEmail;
		  obj[columnTitles[1]] = row.userName;
		  obj[columnTitles[2]] = row.diagnosticTest;
		  obj[columnTitles[3]] = row.finalTest;
		  obj[columnTitles[4]] = row.certificate;
		  obj[columnTitles[5]] = row.isAttending ? 'Sí' : 'No';
		  return obj;
		});
	  
		const worksheet = XLSX.utils.json_to_sheet(dataToExport);
	  
		// Set the width for each column
		const columnWidths = columnTitles.map(title => ({ wch: title.length + 2 }));
		worksheet['!cols'] = columnWidths;
	  
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');
	  
		XLSX.writeFile(workbook, 'Estudiantes.xlsx');
	}
	
	openModal() {
		const modalRef = this.modalService.open(DialogAssignLiveCoursesComponent, {
			animation: true,
			centered: true,
			size: "",
			backdrop: "static",
			keyboard: false,
		});

		modalRef.componentInstance.emailsAssigned = this.userEmails

		modalRef.componentInstance.userSelected.subscribe((user: User) => {
			this.handleUserSelected(user);
		});
		
	}

	async handleUserSelected(user: User) {
		console.log('Selected user:', user);
		if (user) await this.assignLiveCourse(user.uid)
		else this.openCreateUserModal()
	}

	async assignLiveCourse(userId: string) {
		const userRef = this.userService.getUserRefById(userId)
		const liveCourseByStudent = new LiveCourseByStudent("", false, userRef, this.liveCourseRef, false)
		try {
			await this.liveCourseService.createLiveCourseByStudent(liveCourseByStudent)
			console.log("***liveCourseByStudent created***")
		} catch (error) {
			console.log("XXXerror creating liveCourseByStudentXXX", error)			
		}
	}

	async openCreateUserModal(): Promise<NgbModalRef> {
		const modalRef = this.modalService.open(CreateUserComponent, {
		animation: true,
		centered: true,
		size: 'lg',
		backdrop: 'static',
		keyboard: false 
		})

		modalRef.result.then(async userData => {
			// console.log("userData", userData)
			await this.assignLiveCourse(userData.uid)
		})

		return modalRef
	}

	ngOnDestroy() {
		if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe();
	}
	
	
	// async createTestData() {
	// 	console.log("Started")
	// 	const querySnapshot = await this.afs.collection(User.collection).ref.where("email", "==", "arturo.r@test.com").get();
	// 	// const querySnapshot = await this.afs.collection(User.collection).ref.where("email", "==", "fabi.negrette@test.com").get();
	// 	let userRef = null
	// 	if (!querySnapshot.empty) userRef = querySnapshot.docs[0].ref

	// 	const liveCourseSonquerySnapshot = await this.afs.collection(LiveCourse.collection).doc(this.liveCourseTemplateId).collection(LiveCourseSon.subCollection).ref.where("id", "==", this.liveCourseId).get();
	// 	let liveCourseSonrRef = null
	// 	if (!querySnapshot.empty) liveCourseSonrRef = liveCourseSonquerySnapshot.docs[0].ref

	// 	let liveCourseByStudent = new LiveCourseByStudent("", false, userRef, liveCourseSonrRef, false)
	// 	const liveCourseByStudentRef = this.afs.collection<LiveCourseByStudent>(LiveCourseByStudent.collection).doc().ref;
	// 	await liveCourseByStudentRef.set({...liveCourseByStudent.toJson(), id: liveCourseByStudentRef.id}, { merge: true });
	// 	liveCourseByStudent.id = liveCourseByStudentRef.id;
	// 	console.log("Finished")
	// }


}