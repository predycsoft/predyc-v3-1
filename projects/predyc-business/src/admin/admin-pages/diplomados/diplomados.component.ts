import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";

@Component({
	selector: "app-diplomados",
	templateUrl: "./diplomados.component.html",
	styleUrls: ["./diplomados.component.css"],
})
export class DiplomadosComponent {
	constructor(
		public icon: IconService,
		private router: Router,

	) {}

	crearDiplomado(){
		this.router.navigate(["/admin/diplomados/form/new"])
	}
}
