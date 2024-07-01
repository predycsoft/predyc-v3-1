import { HttpClient } from "@angular/common/http";
import { Component } from "@angular/core";
import { environment } from "projects/predyc-business/src/environments/environment";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";


@Component({
	selector: "app-freebies",
	templateUrl: "./freebies.component.html",
	styleUrls: ["./freebies.component.css"],
})
export class FreebiesComponent {
	constructor(
		public icon: IconService,
		private http: HttpClient,
	) {}

	environment = environment
	// endPoint = environment.cloudFunc + "/getAllCourseIds"
	endPoint = environment.cloudFunc + "/getAllFreebiesIds"

	ngOnInit() {
		this.http.get(this.endPoint).subscribe( data => {
			console.log("data:", data);
		});
	}
}
