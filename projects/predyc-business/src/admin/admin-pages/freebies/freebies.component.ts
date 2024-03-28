import { Component } from "@angular/core";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";

@Component({
	selector: "app-freebies",
	templateUrl: "./freebies.component.html",
	styleUrls: ["./freebies.component.css"],
})
export class FreebiesComponent {
	constructor(public icon: IconService) {}
}
