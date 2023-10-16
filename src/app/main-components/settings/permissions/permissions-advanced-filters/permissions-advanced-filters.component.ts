import { Component } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Profile } from 'src/app/shared/models/profile.model';

@Component({
  selector: 'app-permissions-advanced-filters',
  templateUrl: './permissions-advanced-filters.component.html',
  styleUrls: ['./permissions-advanced-filters.component.css']
})
export class PermissionsAdvancedFiltersComponent {
  constructor(
    private afs: AngularFirestore,
  ){}

  displayedColumns: string[] = ['departamento', 'perfil', 'horas', 'libertad', 'generacion', 'intentos'];
  dataSource = [
    {departamento: 'Confiabilidad', perfil: 'Ingeniero de Confiabilidad', horas: '7:00', libertad: 'Libre', generacion: 'Optimizada', intentos: 5},
    {departamento: 'Planificación', perfil: 'Especialista en Programación de la Producción', horas: '8:00', libertad: 'Estricto', generacion: 'Confirmar', intentos: 3},
    {departamento: 'Mantenimiento', perfil: 'Técnico de Mantenimiento Eléctrico', horas: '4:00', libertad: 'Solicitudes', generacion: 'Por defecto', intentos: 4}
  ];

  libertyOpts = {
    "Libre": 1,
    "Estricto": 2,
    "Solicitudes": 3,
  }

  generationOpts = {
    "Optimizada": 1,
    "Confirmar": 2,
    "Por defecto": 3,
  }

  ngOnInit() {
    this.dataSource.forEach(element => {
      element.libertad = this.libertyOpts[element.libertad] ? this.libertyOpts[element.libertad] : 0
      element.generacion = this.generationOpts[element.generacion] ? this.generationOpts[element.generacion] : 0
    });
    console.log("this.dataSource", this.dataSource)
  }

  // getGeneracionNumeric(row: any): number {
  //   console.log("this.generationOpts[row.generacion]", this.generationOpts[row.generacion])
  //   return this.generationOpts[row.generacion];
  // }
  
  // setGeneracionNumeric(row: any, value: number) {
  //   // Encuentra la clave en el objeto 'generacionOptions' que corresponde al valor y asigna esa clave a 'generacion'
  //   row.generacion = Object.keys(this.generationOpts).find(key => this.generationOpts[key] === value);
  //   console.log("row.generacion", row.generacion)
  // }
  
  
  debug() {
    console.log("this.dataSource", this.dataSource)
  }

  debug2(value: number) {
    console.log("value", value)
  }

  // profiles = [
  //   {
  //     id: null,
  //     name: "Perfil de prueba 1",
  //     description: "Descripcion del 2do perfil",
  //     responsabilities: "Responsabilidad del 2do perfil",
  //     departmentRef: null,
  //     skillsRef: [],
  //     usersRef: [],
  //     coursesRef:[],
  //     enterpriseRef: [],
  //   },
  //   {
  //     id: null,
  //     name: "Perfil de prueba 2",
  //     description: "Descripcion del 3er perfil",
  //     responsabilities: "Responsabilidad del 3er perfil",
  //     departmentRef: null,
  //     skillsRef: [],
  //     usersRef: [],
  //     coursesRef:[],
  //     enterpriseRef: [],
  //   },
  //   {
  //     id: null,
  //     name: "Perfil de prueba 3",
  //     description: "Descripcion del 4to perfil",
  //     responsabilities: "Responsabilidad del 4to perfil",
  //     departmentRef: null,
  //     skillsRef: [],
  //     usersRef: [],
  //     coursesRef:[],
  //     enterpriseRef: [],
  //   },
  //   {
  //     id: null,
  //     name: "Perfil de prueba 4",
  //     description: "Descripcion del 5to perfil",
  //     responsabilities: "Responsabilidad del 5to perfil",
  //     departmentRef: null,
  //     skillsRef: [],
  //     usersRef: [],
  //     coursesRef:[],
  //     enterpriseRef: [],
  //   },
  //   {
  //     id: null,
  //     name: "Perfil de prueba 5",
  //     description: "Descripcion del 6to perfil",
  //     responsabilities: "Responsabilidad del 6to perfil",
  //     departmentRef: null,
  //     skillsRef: [],
  //     usersRef: [],
  //     coursesRef:[],
  //     enterpriseRef: [],
  //   },
  // ]


  // async addProfiles() {
  //   const departmentRef: DocumentReference = this.afs.doc('department/GV7Mn8c0e4inIBaqY3TC').ref;
  //   const skillsRef: DocumentReference = this.afs.doc('skill/6WqV0sdn0gi8DMsjvsAt').ref;
  //   const usersRef: DocumentReference = this.afs.doc('user/4S2my2ixk0imeZq0HKhQOAaHXx81').ref;
  //   const enterpriseRef: DocumentReference = this.afs.doc('enterprise/CT6ApoO3YMFvIbOEMzVM').ref;
  //   for (const profile of this.profiles) {
  //     const docRef = this.afs.collection(Profile.collection).doc();
  //     const id = docRef.ref.id;
  //     await docRef.set({
  //       ...profile, 
  //       id: id,
  //       departmentRef: departmentRef,
  //       skillsRef: [skillsRef],
  //       usersRef: [usersRef],
  //       enterpriseRef: [enterpriseRef],

  //     });
  //     console.log("id", id)
  //   }
  // }
  

}
