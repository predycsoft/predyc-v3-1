import { Component, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { Subscription } from "rxjs";
import { DialogFreebiesFormComponent } from "./dialog-freebies-form/dialog-freebies-form.component";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Freebie } from "projects/shared";
import { HttpClient } from "@angular/common/http";

@Component({
	selector: "app-freebies-list",
	templateUrl: "./freebies-list.component.html",
	styleUrls: ["./freebies-list.component.css"],
})
export class FreebiesListComponent {
	constructor(
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private modalService: NgbModal,
		public icon: IconService,
		private afs: AngularFirestore,
		private http: HttpClient
	) {}

	displayedColumns: string[] = ["name", "description", "type", "file"];

	dataSource = new MatTableDataSource<Freebie>();

	@ViewChild(MatPaginator) paginator: MatPaginator;

	queryParamsSubscription: Subscription;
	pageSize: number = 7;
	totalLength: number;

	freebiesSubscription: Subscription;

	showSaveButton: boolean = false;

	ngOnInit() {
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
		this.freebiesSubscription = this.afs
			.collection<Freebie>("freebie")
			.valueChanges()
			.subscribe((freebies) => {
				this.paginator.pageIndex = page - 1;
				this.dataSource.data = freebies;
				this.totalLength = freebies.length;
			});
	}

	onPageChange(page: number): void {
		this.router.navigate([], {
			queryParams: { page },
			queryParamsHandling: "merge",
		});
	}

	openFreebiesForm(freebie: Freebie | null): NgbModalRef {
		const modalRef = this.modalService.open(DialogFreebiesFormComponent, {
			animation: true,
			centered: true,
			size: "md",
			backdrop: "static",
			keyboard: false,
		});
		if (freebie) modalRef.componentInstance.freebie = freebie;
		return modalRef;
	}

	downloadFile(freebie) {
		const newWindow = window.open("", "_blank");
		this.http.get(freebie.file, { responseType: "blob" }).subscribe((data: Blob) => {
			const blob = new Blob([data]);

			// Create a URL for the blob
			const url = window.URL.createObjectURL(blob);

			// Create an anchor element
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = `download.${freebie.extension}`; // Set the file name
			anchor.click();

			// Close the new window after download
			newWindow.close();
		});
	}

	ngOnDestroy() {
		if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe();
		if (this.freebiesSubscription) this.freebiesSubscription.unsubscribe();
	}
}
