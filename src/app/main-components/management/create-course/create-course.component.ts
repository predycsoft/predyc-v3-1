import { Component, OnInit } from '@angular/core';
import { IconService } from '../../../shared/services/icon.service';
import { FormControl, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';

import { Curso } from "../../../shared/models/curses.model"
import { Modulo } from "../../../shared/models/module.model"
import { Clase } from "../../../shared/models/course-class.model"

import { AngularFireStorage } from '@angular/fire/compat/storage';
import Swal from 'sweetalert2';
import { Observable, Subject, finalize, firstValueFrom, switchMap, tap, filter } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AngularFirestore,DocumentReference } from '@angular/fire/compat/firestore';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Activity, Question,QuestionOption,QuestionType, QuestionValidationResponse } from '../../../shared/models/activity-classes.model';
//import { compareByString } from 'src/app/utils';
//import * as competencias from '../../../../assets/data/competencias.json';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { VimeoUploadService } from 'src/app/shared/services/vimeo-upload.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { CategoryService } from 'src/app/shared/services/category.service';
import { SkillService } from '../../../shared/services/skill.service';
import { Category } from 'src/app/shared/models/category.model';
import { Skill } from 'src/app/shared/models/skill.model';


export const compareByString = (a: string, b: string): number => {
  if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  } else {
    return 0;
  }
};


interface Categoria {
  id: number;
  name: string;
}

interface Competencia {
  id: number;
  name: string;
  selected: boolean;
  categoriaId: number;
}

@Component({
  selector: 'app-create-course',
  templateUrl: './create-course.component.html',
  styleUrls: ['./create-course.component.css']
})
export class CreateCourseComponent implements OnInit {

  constructor(
    public icon: IconService,
    public router: Router,
    private storage: AngularFireStorage,
    //private service: GeneralService,
    private modalService: NgbModal,
    private uploadControl: VimeoUploadService,
    private afs: AngularFirestore,
    private dialog: DialogService,
    public sanitizer: DomSanitizer,
    private enterpriseService: EnterpriseService,
    public categoryService : CategoryService,
    public skillService: SkillService


  ) { }

  formNuevoCurso: FormGroup;
  formNuevaActividadBasica: FormGroup;
  formNuevaActividadGeneral: FormGroup;
  formNuevaComptencia: FormGroup;
  questionTypesIn = QuestionType;

  competenciasArray

  curso : Curso;

  questionTypes: Array<QuestionType> = QuestionType.TYPES.sort((a, b) =>
  compareByString(a.displayName, b.displayName)
  );

  modulos : Modulo[] = [];
  actividades : Activity[] = [];
  examen : Activity;
  public zoom = '100%';

  private access_token = "73f2eb055ec905e9a48175cd3c87b6af" // token  de vimeo
  file_name = "assets/videos/test-video.mp4"
  //859408918?h=6e44212c1a&amp nuevo formato de id en vimeo

  panelOpenState = false;

  imagenesCurso = [
    "../../../assets/images/cursos/placeholder1.jpg",
    "../../../assets/images/cursos/placeholder2.jpg",
    "../../../assets/images/cursos/placeholder3.jpg",
    "../../../assets/images/cursos/placeholder4.jpg",
  ];

  avatarInstructor = [
    "../../../assets/images/cursos/avatar1.svg",
    "../../../assets/images/cursos/avatar2.svg",
    "../../../assets/images/cursos/avatar3.svg",
    "../../../assets/images/cursos/avatar4.svg",
  ];

  steps = [
    'Información del curso',
    'Competencias',
    'Clases',
    // 'Exámenen',
    'Examen',
    'Vista previa examen',
    'Resumen'
  ];

  stepsActividad = [
    'Información básica',
    'Instrucciones generales de la actividad',
    'Preguntas',
    'Previsualización de preguntas',
  ];

  stepsCompetencias = [
    'Clase',
    'Estructura Actividad',
  ];

  onPanelTitleClick(event: Event){
      event.stopPropagation();
  }

  activeStep = 1;
  activeStepActividad = 1;
  activeStepCompetencias = 1;


  empresa;
  competenciasEmpresa=[]

  competenciasSelected;

  getSelectedCategoriasCompetencias(competencia = null){
    console.log('getSelectedCategoriasCompetencias')
    let respuesta = [];
    console.log(this.categoriasArray)

    this.categoriasArray.forEach(categoria => {
      let selected = categoria.competencias.filter(competencia => competencia.selected)
      selected = selected.map(({ category, ...rest }) => ({
        ...rest,
        category: { id: category.id }
      }));      if(selected.length>0){
        let obj = {
          categoria : {name:categoria.name, id:categoria.id},
          competencias : selected,
          expanded: true
        }
        respuesta.push(obj)
      }
    });

    this.updateCompetenciasClases(competencia)
    console.log('respuesta',respuesta)
    this.competenciasSelected = respuesta;
  }

  competenciasSelecttedClase = [];

  getSelectedCategoriasCompetenciasClase(competencia = null){//estoy aqui
    console.log('getSelectedCategoriasCompetencias')
    let respuesta = [];
    console.log(this.competenciasSelectedClase)

    this.competenciasSelectedClase.forEach(categoria => {
      let selected = categoria.competencias.filter(competencia => competencia.selected)
      if(selected.length>0){
        console.log('categoria revisar',categoria)
        let categoriaR;
        if(categoria.categoria){
          categoriaR = categoria.categoria
        }
        else{
          categoriaR={
            id:categoria.id,
            name:categoria.name,
            expanded:false
          }
        }
        let obj = {
          categoria : categoriaR,
          competencias : selected,
          expanded: true
        }
        respuesta.push(obj)
      }
    });

    console.log(respuesta)
    //this.updateCompetenciasClases(competencia)
    this.competenciasSelecttedClase = respuesta;
  }


  updateCompetenciasClases(competencia){
    this.modulos.forEach(modulo => {
      modulo.clases.forEach(clase => {
        console.log(clase,competencia);
      });
    });
  }

  isOverflowRequired(): boolean {
    const container = document.querySelector('.contenedor-chips-selected');
    return container.scrollHeight > container.clientHeight;
  }

  anidarCompetencias(categorias: any[], competencias: any[]): any[] {
    return categorias.map(categoria => {
      return {
        ...categoria,
        competencias: competencias.filter(comp => comp.category.id === categoria.id)
      };
    });
  }

  categoriasArray;


  ngOnInit(): void {

    console.log(this.competenciasArray)

    // Usando la función:
    // const categorias: Categoria[] = this.competenciasArray.categorias;
    // const competencias: Competencia[] = this.competenciasArray.competencias;

    this.inicializarFormNuevoCurso();
    this.activeStep = 1;
    this.activeStepActividad = 1;


    this.categoryService.getCategoriesObservable().subscribe(category => {
      console.log('category from service',category);
      this.skillService.getSkillsObservable().subscribe(skill => {
        console.log('skill from service',skill);

        this.categoriasArray = this.anidarCompetencias(category,skill)
        console.log(this.categoriasArray)
    

        this.competenciasEmpresa = this.obtenerCompetenciasAlAzar(5);
        

      })
    })


    
    // this.enterpriseService.getEnterpriseObservable().subscribe(empresa => {
    //   if (!empresa) {
    //     return
    //   }
    //   console.log('empresa',empresa)
    //   this.empresa = empresa
    // })
    this.empresa = this.enterpriseService.getEnterprise()
  }

  obtenerCompetenciasAlAzar(n: number): Competencia[] {
    // Aplanamos la estructura para obtener todas las competencias en un solo arreglo
    const todasLasCompetencias = this.categoriasArray.flatMap(categoria => categoria.competencias);
  
    // Barajamos (shuffle) el arreglo
    for (let i = todasLasCompetencias.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [todasLasCompetencias[i], todasLasCompetencias[j]] = [todasLasCompetencias[j], todasLasCompetencias[i]]; // Intercambio
    }
  
    // Tomamos las primeras 'n' competencias del arreglo barajado
    return todasLasCompetencias.slice(0, n);
  }

  inicializarFormNuevoCurso () {

    this.formNuevoCurso = new FormGroup({
      titulo: new FormControl(null, Validators.required),
      resumen: new FormControl(null, Validators.required),
      descripcion: new FormControl(null, Validators.required),
      nivel: new FormControl(null, Validators.required),
      //categoria: new FormControl(null, Validators.required),
      idioma: new FormControl(null, Validators.required),
      contenido: new FormControl(null, Validators.required),
      instructor: new FormControl(null, Validators.required),
      resumen_instructor: new FormControl(null, Validators.required),
      imagen: new FormControl(null, Validators.required),
      imagen_instructor: new FormControl(null, Validators.required),
    })
  }

  returnCursos(){
    this.router.navigate(["empresa/catalogo"])
  }

  addClassMode = false;

  obtenerNumeroMasGrande(): number {
    return this.modulos.reduce((maximoActual, modulo) => {
        const maximoModulo = modulo.clases.reduce((maximoClase, clase) => {
            return Math.max(maximoClase, clase.numero);
        }, -0);

        return Math.max(maximoActual, maximoModulo);
    }, -0);
}


  addClase(tipo,moduloIn){

    let modulo = this.modulos.find(modulo => modulo.numero == moduloIn.numero)
    console.log('modulo',modulo);
    let clases = modulo.clases;
    let clase = new Clase;
    clase.tipo = tipo;
    clase.modulo;
    clase.id = Date.now();
    clase.modulo = moduloIn.numero;

    let numero = this.obtenerNumeroMasGrande()+1;
    clase.numero = numero;

    if(clase.tipo == 'lectura'){
      clase.HTMLcontent ='<h4><font face="Arial">Sesi&#243;n de lectura.</font></h4><h6><font face="Arial">&#161;Asegurate de descargar los archivos adjuntos!</font></h6><p><font face="Arial">Encu&#233;ntralos en la secci&#243;n de material descargable</font></p>'
    }

    if(clase.tipo == 'actividad'){
      let actividad = new Activity();
      actividad.id = Date.now().toString();
      actividad.title = clase.titulo;
      //this.actividades.push(actividad);
      console.log('actividades', this.actividades)
      actividad['isInvalid'] = true;
      clase['activity'] = actividad;
    }

    console.log(numero);
    clase['expanded'] = false;

    clases.push(clase);

    console.log(clases);

  }

  hideOtherModulos(moduloIn){
    this.modulos.map( modulo => {
      if(moduloIn.numero != modulo.numero)
      modulo['expanded'] = false;
      this.closeAllClasesModulo(modulo);
    })
  }

  hideOtherQuestion(questionIn){

    console.log(questionIn);
    console.log(this.selectedClase.activity.questions)

    this.selectedClase.activity.questions.map( question => {
      if(questionIn.id != question.id)
      question['expanded'] = false;
    })

  }



  borrarPregunta(pregunta,index){
    console.log(pregunta,index);

    Swal.fire({
      title: `<span class=" gray-9 ft20">Borrar pregunta ${index+ 1 }</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--red-5)',
      cancelButtonColor: 'var(--gray-4)',
      confirmButtonText: `Borrar pregunta`,
      cancelButtonText:'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteQuestionImage(pregunta);
        this.selectedClase.activity.questions.splice(index, 1); // El primer argumento es el índice desde donde quieres empezar a borrar, y el segundo argumento es la cantidad de elementos que quieres borrar.
        Swal.fire({
          title:'Borrado!',
          text:`La pregunta fué borrada`,
          icon:'success',
          confirmButtonColor: 'var(--blue-5)',
        })
      }
    })
  }

  crearPreguntaActividad(){

    let pregunta = new Question;
    pregunta.id = Date.now().toString();
    this.hideOtherQuestion(pregunta);
    pregunta['expanded'] = true;
    let activity : Activity = this.selectedClase.activity;
    console.log('activity',activity)
    let questions = activity.questions;
    console.log('questions',questions);

    questions.push(pregunta)

  }

  addModulo(){
     
    console.log(this.modulos);

    let number = 0;

    if(this.modulos.length>0){
      const objetoConMayorNumero = this.modulos.reduce((anterior, actual) => {
        return (anterior.numero > actual.numero) ? anterior : actual;
      });
      console.log(objetoConMayorNumero);
      number = objetoConMayorNumero.numero;
    }
    number++;
    let modulo = new Modulo;
    modulo.numero = number;
    modulo['expanded'] = true;
    let titulo = "";
    if (number == 1){
      titulo = 'Introducción'
    }
    modulo.titulo = titulo;

    this.modulos.map( modulo => {
      modulo['expanded'] = false;
    } )
    this.modulos.push(modulo);


  }

  borrarModulo(modulo){

    Swal.fire({
      title: `<span class=" gray-9 ft20">Borrar módulo ${modulo.numero} - ${modulo.titulo? modulo.titulo: 'Sin título'}</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--red-5)',
      cancelButtonColor: 'var(--gray-4)',
      confirmButtonText: `Borrar módulo`,
      cancelButtonText:'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {

        let numero = modulo.numero;
        this.modulos = this.modulos.filter ( modulo => modulo.numero != numero);
    
        this.modulos.forEach(modulo =>{
          if(modulo.numero > numero){
            modulo.numero--;
          }
        })

        Swal.fire({
          title:'Borrado!',
          text:`El módulo ${modulo.numero} - ${modulo.titulo? modulo.titulo: 'Sin título'} fué borrado`,
          icon:'success',
          confirmButtonColor: 'var(--blue-5)',
        })
      }
    })

  }

  borrarClase(moduloIn,claseIn){


    let modulo = this.modulos.find(modulo => modulo.numero == moduloIn.numero);
    let clases = modulo.clases;

    Swal.fire({
      title: `<span class=" gray-9 ft20">Borrar clase ${claseIn.numero} - ${claseIn.titulo? claseIn.titulo: 'Sin título'}</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--red-5)',
      cancelButtonColor: 'var(--gray-4)',
      confirmButtonText: `Borrar clase`,
      cancelButtonText:'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {

        clases = clases.filter(clase => clase.id != claseIn.id );
        modulo.clases = clases;
        
        Swal.fire({
          title:'Borrado!',
          text:`La clase ${claseIn.numero} - ${claseIn.titulo? claseIn.titulo: 'Sin título'} fué borrada`,
          icon:'success',
          confirmButtonColor: 'var(--blue-5)',
        })
      }
    })

  }

  tituloModuloTMP = '';
  tituloclaseTMP = '';

  tituloModuloChange(evento){
    let valor = evento.value;
    this.tituloModuloTMP = valor;
    this.tituloclaseTMP = valor;
  }

  preventDefault(event: any) {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.stopPropagation();
  }

  getnumerClassTipo(moduloIn,claseIn){

    let modulo = this.modulos.find(modulo=>modulo.numero == moduloIn.numero );
    let clases = modulo.clases.filter( clase => clase.tipo == claseIn.tipo);
    let valor = clases.findIndex( clase => clase.id == claseIn.id);
    return valor+1

  }


  getIconClase(clase){


    if (clase == 'lectura'){
      return 'catelog'
    }
    else if (clase == 'actividad'){
      return 'chess'
    }
    else if(clase == 'video'){
      return 'videoChat'
    }

    return "catelog";
  }


  getIconFileFormat(formato){
    
    if (formato == 'application/pdf'){
      return 'pdf'
    }
    else if (formato == 'actividad'){
      return 'chess'
    }
    else if(formato == 'video'){
      return 'videoChat'
    }

    return "catelog";
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Prevenir el comportamiento por defecto
  }

  onDrop(event: DragEvent,tipo,clase,modulo) {
    event.preventDefault(); // Prevenir el comportamiento por defecto
    const files = event.dataTransfer?.files;
  
    if (files && files.length > 0) {
      const imageFiles: File[] = this.filterFiles(files,tipo);
      if (imageFiles.length > 0) {

        console.log(imageFiles);
        // logica de subida archivo como tal
        this.onFileSelected(imageFiles,clase,true,modulo)


      } else {
        console.log('No se encontraron imágenes válidas.');
      }
    }
  }

  filterFiles(files: FileList, tipo: string): File[] {
    let tipoFile;

    if (tipo == 'video') {
        tipoFile = 'video/';
    } else if (tipo == 'lectura') {
        tipoFile = 'application/pdf';
    } else {
        return []; // Retorna un arreglo vacío si el tipo no es reconocido
    }

    const filteredFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (file && file.type.startsWith(tipoFile)) {
            filteredFiles.push(file);
        }
    }
    return filteredFiles;
  }


  uploadProgress$: Observable<number>

  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const base64content = event.target.result.split(',')[1];
        resolve(base64content);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  }


  base64view;


  viewFileActivity = false;
  viewVideoActivity = false;


  async onFileSelected(event,clase,local = false,modulo,adicional = false,tipo= null) {
    clase['uploading'] = true;

    let file;
    if(!local){
      file = event.target.files[0];
    }
    else{
      file = event[0];
    }
    if (file) {
      let fileBaseName = file.name.split('.').slice(0, -1).join('.');
      let fileExtension = file.name.split('.').pop();

      const base64content = await this.fileToBase64(file);
      //console.log('base64',base64content);  // Aquí tienes el contenido en base64

      if(clase.tipo == 'lectura' || adicional){
        let idFile = Date.now();
        let fileInfo = {
          id: idFile,
          nombre: fileBaseName+'.'+fileExtension,
          size: file.size,
          type: file.type,
          uploading : true,
          uploading_file_progress : 0,
          url: null,
          base64:base64content
        }
        console.log('adicional',adicional)
        if(tipo == 'archivoActividad'){
          adicional = false;
          this.viewFileActivity= false;
          this.selectedClase.activity['recursosBase64'] = fileInfo;
        }

        if(!adicional && clase.archivos.length>0){
          clase.archivos[0] = fileInfo;

        }else{
          clase.archivos = clase.archivos.concat(fileInfo);
        }
  
        // Reorganizar el nombre para que el timestamp esté antes de la extensión
        let newName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;
  
        let nombreCurso = this.formNuevoCurso.get('titulo').value?  this.formNuevoCurso.get('titulo').value : 'Temporal';
  
        const filePath = `Clientes/${this.empresa.nombre}/Cursos/${nombreCurso}/${newName}`;
        const task = this.storage.upload(filePath, file);
  
        // Crea una referencia a la ruta del archivo.
        const fileRef = this.storage.ref(filePath);
  
        // Obtener el progreso como un Observable
        this.uploadProgress$ = task.percentageChanges();
  
        // Suscríbete al Observable para actualizar tu componente de barra de progreso
        this.uploadProgress$.subscribe(progress => {
          console.log(progress);
          fileInfo.uploading_file_progress = Math.floor(progress) ;
        });
  
        // Observa el progreso de la carga del archivo y haz algo cuando se complete.
        task.snapshotChanges().pipe(
          finalize(() => {
            // Obtén la URL de descarga del archivo.
            fileRef.getDownloadURL().subscribe(url => {
              //clase['uploading'] = false;
              console.log(`File URL: ${url}`);
              fileInfo.url = url;
              //clase.archivos = clase.archivos.concat(fileInfo);
              console.log('clase',clase);
              if(tipo == 'archivoActividad'){
                this.formNuevaActividadGeneral.get('recursos').patchValue(newName);
              }
            });
          })
        ).subscribe();
      }
      else if(clase.tipo == 'video'){
        let nombre =  fileBaseName+'.'+fileExtension;
        clase['base64Video'] = base64content
        clase['videoFileName'] = nombre;
        console.log(this.selectedClase)
        this.uploadVideo(file,clase,false,modulo);

      }
      else if(clase.tipo == 'actividad'){
        if(tipo == 'videoActividad'){
          let nombre =  fileBaseName+'.'+fileExtension;
          clase['base64Video'] = base64content
          clase['videoFileName'] = nombre;
          this.viewVideoActivity = false
          this.uploadVideo(file,clase,false,modulo,'actividad');
        }
      }
    }
  }



  selectedClase;
  selectedModulo;
  fileViewTipe= null;
  categoriaNuevaCompetencia;
  modalCompetencia;
  modalCompetenciaAsignar;

  twoWordsOrLess(control: AbstractControl): { [key: string]: any } | null {
    const words = (control.value || '').trim().split(/\s+/);
    return words.length <= 3 ? null : { tooManyWords: true };
  }

  openModalCompetencia(content,competencia){

    this.showErrorCompetencia = false

    this.formNuevaComptencia = new FormGroup({
      nombre: new FormControl(null, [Validators.required, this.twoWordsOrLess])
    })

    this.categoriaNuevaCompetencia = competencia

     this.modalCompetencia = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true
    });
  }



  

  competenciasSelectedClase;
  selectedPregunta;



  openModalAsignarCompetenciaExamen(content,pregunta){

    this.selectedPregunta = pregunta;

    if(pregunta.competencias.length > 0){

      this.competenciasSelectedClase=[]; //estoy aqui
      let competenciasTotal = structuredClone(this.competenciasSelected);
      let competenciasTotalProcesdo=[]
      let categorias=[];
      competenciasTotal.forEach(categoria => {
        let item = categoria.categoria;
        item.expanded = true;
        categorias.push(item)
        categoria.competencias.forEach(competencia => {
          competencia.selected = false;
          competenciasTotalProcesdo.push(competencia)
        });
      });
      //console.log(competencias);
      pregunta.competencias.forEach(competencia => {
        console.log(competencia)
        let competenciaP = competenciasTotalProcesdo.find(competenciaeach => competenciaeach.id == competencia.id);
        competenciaP.selected = true;
      });

      console.log(competenciasTotalProcesdo);
      
      let respueta  = this.anidarCompetencias(categorias,competenciasTotalProcesdo);
      console.log(respueta);
      this.competenciasSelectedClase = respueta;
    }
    else{
      this.competenciasSelectedClase = structuredClone(this.competenciasSelected);
      this.competenciasSelectedClase.forEach(categoria => {
        categoria.competencias.forEach(competencia=> {
          competencia.selected = false
        });
      });

      console.log(this.competenciasSelectedClase)

    }


    this.modalCompetenciaAsignar = this.modalCompetencia = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true,
      size:'lg'
    });

  }

  saveCompetenciasPregunta(close = true){

    console.log('this.competenciasSelectedClase',this.competenciasSelectedClase)
    //this.selectedClase.competencias = this.competenciasSelectedClase;
    let arrayCompetencias = [];
    this.competenciasSelectedClase.forEach(categoria => {
      let selected = categoria.competencias.filter(competencia => competencia.selected);
      arrayCompetencias = [...arrayCompetencias, ...selected];
    });
    console.log(arrayCompetencias);

    this.selectedPregunta.competencias = arrayCompetencias;

    if(close){
      this.modalCompetenciaAsignar.close()
    }
    
  }


  openModalAsignarCompetencia(content,clase){

    this.selectedClase = clase

    this.activeStepCompetencias=1

    if(clase.competencias.length > 0){

      this.competenciasSelectedClase=[]; //estoy aqui
      console.log('this.competenciasSelected',this.competenciasSelected)
      let competenciasTotal = structuredClone(this.competenciasSelected);
      let competenciasTotalProcesdo=[]
      let categorias=[];
      competenciasTotal.forEach(categoria => {
        let item = categoria.categoria;
        item.expanded = true;
        categorias.push(item)
        categoria.competencias.forEach(competencia => {
          competencia.selected = false;
          competenciasTotalProcesdo.push(competencia)
        });
      });
      //console.log(competencias);
      clase.competencias.forEach(competencia => {
        console.log(competencia)
        let competenciaP = competenciasTotalProcesdo.find(competenciaeach => competenciaeach.id == competencia.id);
        competenciaP.selected = true;
      });

      console.log(competenciasTotalProcesdo);
      
      let respueta  = this.anidarCompetencias(categorias,competenciasTotalProcesdo);
      console.log(respueta);
      this.competenciasSelectedClase = respueta;
    }
    else{
      this.competenciasSelectedClase = structuredClone(this.competenciasSelected);
      this.competenciasSelectedClase.forEach(categoria => {
        categoria.competencias.forEach(competencia=> {
          competencia.selected = false
        });
      });

      console.log(this.competenciasSelectedClase)

    }
    this.modalCompetenciaAsignar = this.modalCompetencia = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true,
      size:'lg'
    });
  }

  saveCompetenciasClase(close = true){
    console.log('this.competenciasSelectedClase',this.competenciasSelectedClase)
    //this.selectedClase.competencias = this.competenciasSelectedClase;
    let arrayCompetencias = [];
    this.competenciasSelectedClase.forEach(categoria => {
      let selected = categoria.competencias.filter(competencia => competencia.selected);
      arrayCompetencias = [...arrayCompetencias, ...selected];
    });
    console.log(arrayCompetencias);

    this.selectedClase.competencias = arrayCompetencias;

    if(close){
      this.modalCompetenciaAsignar.close()
    }

  }

  openModal(content,clase,modulo,tipo = 'crear'){

    this.selectedClase = clase
    this.selectedModulo = modulo
    this.viewFileActivity = false

    this.activeStepActividad = 1;

    //this.inicializarFormNuevaActividad();


    if(clase.tipo == 'lectura'){
      this.base64view = clase.archivos[0].base64;
      this.fileViewTipe = 'pdf'

    }
    else if(clase.tipo == 'video'){
      this.base64view = clase['base64Video'];
      this.fileViewTipe = 'video'
    }
    else if(clase.tipo == 'actividad'){

      let activity : Activity = this.selectedClase.activity

      console.log('activity',activity)

      console.log(clase.titulo)

      this.formNuevaActividadBasica = new FormGroup({
        titulo: new FormControl(clase.titulo , Validators.required),
        descripcion: new FormControl(activity.description, Validators.required),
        duracion: new FormControl(activity.duration, Validators.required),
      });


      this.formNuevaActividadGeneral = new FormGroup({
        instrucciones: new FormControl(activity.description, Validators.required),
        video: new FormControl(clase.idVideo, [Validators.required, this.NotZeroValidator()]),
        recursos: new FormControl(clase.archivos[0]?.nombre ? clase.archivos[0].nombre : null, Validators.required),

      });


    }

    if(tipo == 'crear'){
      console.log('modal crear actividad')
      this.modalService.open(content, {
        windowClass: 'custom-modal',
        ariaLabelledBy: 'modal-basic-title',
        size: 'lg',
        centered: true
      });
    }
    else{
      console.log('modal revisar actividad')
      this.modalService.open(content, {
        ariaLabelledBy: 'modal-basic-title',
        centered: true,
        size:'lg'
      });
    }




  }

  NotZeroValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value !== null && value !== undefined && value == 0) {
        return { notZero: true };
      }
      return null;
    };
  }

  trackByClase(index: number, clase: any): string {
    return clase.id; // Suponiendo que cada clase tiene un id único.
  }

  closeOtherClasesModulo(openedClase: Clase, modulo): void {
    // Recorrer todas las clases en el módulo.
    for (const clase of modulo.clases) {
        // Si la clase es la que se abrió, establecer expanded en true.
        // De lo contrario, establecer en false.
        if (clase === openedClase) {
            clase.expanded = true;
        } else {
            clase.expanded = false;
        }
    }
  }

  totalClases=0;
  
  closeAllClasesModulo( modulo): void {
    // Recorrer todas las clases en el módulo.

    for (const clase of modulo.clases) {
          clase.expanded = false;
          this.totalClases++;
      }
  }
  closeAllModulos(){
    this.totalClases=0;
    this.modulos.forEach(modulo => {
      this.closeAllClasesModulo(modulo)
      modulo['expanded'] = false;
    });

  }


  uploadVideo(videoFile,clase,local = false,modulo,origen = null ) {

    if (!videoFile) {
      console.log('No video file selected');
      return;
    }
    const file: File = videoFile;

     // Comprobar si el archivo es un video
     if (!file.type.startsWith('video/')) {
      console.error('No es un video');
      return;
  }

    // Supongamos que tienes el token de acceso almacenado en la variable `access_token`
    const access_token = this.access_token;

    let nombreCurso = this.formNuevoCurso.get('titulo').value?  this.formNuevoCurso.get('titulo').value : 'Temporal';
    
    console.log('modulo video',modulo);
    console.log('clase video',clase)

    let videoName =  `${nombreCurso} - Módulo ${modulo.titulo} (${modulo.numero}) - Clase ${clase.titulo} (${clase.numero})`
    let videoDescription =  videoName;

    clase['videoUpload'] = 0;

    // Crea el video en Vimeo
    //clase['uploading'] = true;
    this.uploadControl.createVideo(access_token,videoName,videoDescription)
    .subscribe({
      next : response =>{
        // Una vez creado el video, sube el archivo
        this.uploadControl.uploadVideo(file, response.upload.upload_link)
        .subscribe({
          // Maneja las notificaciones de progreso
          next: progress => {
            console.log('uplading video',progress)
            clase['videoUpload'] = progress-1
            //this.uploadPercent = progress;
          },
          // Maneja las notificaciones de error
          error: error => {
            clase['uploading'] = false;
            console.log('Upload Error:', error);
            this.dialog.dialogAlerta("Hubo un error");
            console.log(error?.error?.error);
            //this.videoFile=null;
            //URL.revokeObjectURL(this.videoSrc);
            clase['videoUpload'] = 0;
            //this.videoSrc=null;
          },
          // Maneja las notificaciones de completado
          complete: () => {
            console.log('Upload successful');
            //clase['uploading'] = false;
            // Obtén todos los proyectos
            this.uploadControl.getProjects(access_token).subscribe(projects => {
              console.log(this.empresa);
              // Busca un proyecto con el mismo nombre que el video
              // const project = projects.data.find(p => p.name === this.empresa.nombre);
              let projectOperation: Observable<any>;
              if (this.empresa.vimeoFolderId) { // si la empresa sitiene una carpeta
                // Si ya existe un proyecto con el nombre del video, agrega el video a él
                projectOperation = this.uploadControl.addVideoToProject(access_token, this.empresa.vimeoFolderId, response.uri);
              } else {
                console.log('aqui')
                projectOperation = this.uploadControl.createProject(access_token, this.empresa.name).pipe(
                    tap(newProject => { 
                        // Aquí es donde actualizamos Firebase
                        const projectId = newProject.uri.split('/').pop();
                        console.log('parent uri',newProject.uri)
                        this.updateForderVimeoEmperesa(projectId,newProject.uri);
                    }),
                    switchMap(newProject => this.uploadControl.addVideoToProject(access_token, newProject.uri.split('/').pop(), response.uri))
                );
            }
              projectOperation.subscribe({
                complete: () => {
                  console.log('Video added to Project successfully!');
                  console.log(response.uri)
                  this.uploadControl.getVideoData(access_token, response.uri).subscribe({
                    next: videoData => {
                        //this.dialog.dialogExito();
                        clase['videoUpload'] = 100;
                        console.log(`Video`,videoData);
                        let link = videoData.link;
                        link = link.split('/');
                        console.log(link);
                        clase.idVideo=link[3];
                        clase.idVideoNew=link[4];
                        if(origen == 'actividad'){
                          this.formNuevaActividadGeneral.get('video').patchValue(link[3]);
                        }
                        //URL.revokeObjectURL(this.videoSrc);
                        //this.videoFile=null;
                        //clase['videoUpload'] =0;
                        //this.videoSrc=null;
                        //clase['videoUpload'] = false;
                      },
                    error: (error) => {
                      this.dialog.dialogAlerta("Hubo un error")
                      console.log(error?.error?.error);
                      //URL.revokeObjectURL(this.videoSrc);
                      //this.videoFile=null;
                      clase['videoUpload'] =0;
                      //this.videoSrc=null;
                      clase['videoUpload'] = false;

                    }
                  })
                },
                error: (error)=>{
                  this.dialog.dialogAlerta("Hubo un error");
                  console.log(error?.error?.error);
                  //URL.revokeObjectURL(this.videoSrc);
                  //this.videoFile=null;
                  clase['videoUpload'] =0;
                  //this.videoSrc=null;
                  clase['uploading'] = false;
                }
              })
            });
          }
        });
      },
      error: (error) => {
        this.dialog.dialogAlerta("Hubo un error")
        console.log(error.error.error);
        //URL.revokeObjectURL(this.videoSrc);
        //this.videoFile=null;
        clase['videoUpload'] =0;
        //this.videoSrc=null;
        clase['uploading'] = false;
      }
    })
  }




  // Funciones de vimeo

  async updateForderVimeoEmperesa(idFolder,folderUri) {
    console.log(idFolder);
    console.log(this.empresa)
    await this.afs.collection("enterprise").doc(this.empresa.id).update({
      vimeoFolderId: idFolder,
      vimeoFolderUri: folderUri
    })
    this.empresa.vimeoFolderId = idFolder;

  }


  createInstructions: SafeHtml;

  onQuestionTypeChange(pregunta: Question,questionTypeValue: string): void {
    console.log(questionTypeValue,pregunta)
    pregunta.type = QuestionType.TYPES.find(
      (questionType) => questionType.value == questionTypeValue
    );
    // this.createInstructions = this.sanitizer.bypassSecurityTrustHtml(
    //   pregunta.type.createInstructions
    // );
  }

  questionInstruction(pregunta){

    return this.sanitizer.bypassSecurityTrustHtml(
      pregunta.type.createInstructions
    );

  }

  uploadQuestionImage(event, pregunta: Question): void {
    if (!event.target.files[0] || event.target.files[0].length === 0) {

      Swal.fire({
        title:'Borrado!',
        text:`Debe seleccionar una imagen`,
        icon:'warning',
        confirmButtonColor: 'var(--blue-5)',
      })
      return;
    }
    const file = event.target.files[0];
    if (file.type !== 'image/webp') {
      Swal.fire({
        title:'Borrado!',
        text:`El archivo es mayor a 1MB por favor incluya una imagen de menor tamaño`,
        icon:'warning',
        confirmButtonColor: 'var(--blue-5)',
      })
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (_event) => {
      //this.deleteQuestionImage(pregunta);

      if (file) {
        pregunta['uploading'] = true;
        let fileBaseName = file.name.split('.').slice(0, -1).join('.');
        let fileExtension = file.name.split('.').pop();
  
        const base64content = await this.fileToBase64(file);

        let nombre = fileBaseName+'.'+fileExtension;
        pregunta['fileName'] = nombre
        pregunta['imageHidden'] = false
        console.log(nombre)

        // Reorganizar el nombre para que el timestamp esté antes de la extensión
        let newName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;
  
        let nombreCurso = this.formNuevoCurso.get('titulo').value?  this.formNuevoCurso.get('titulo').value : 'Temporal';
  
        const filePath = `Clientes/${this.empresa.nombre}/Cursos/${nombreCurso}/Activities/${newName}`;
        const task = this.storage.upload(filePath, file);
  
        // Crea una referencia a la ruta del archivo.
        const fileRef = this.storage.ref(filePath);
  
        // Obtener el progreso como un Observable
        this.uploadProgress$ = task.percentageChanges();
  
        // Suscríbete al Observable para actualizar tu componente de barra de progreso
        this.uploadProgress$.subscribe(progress => {
          console.log(progress);
          pregunta['uploading_file_progress'] = Math.floor(progress) ;
        });
  
        // Observa el progreso de la carga del archivo y haz algo cuando se complete.
        task.snapshotChanges().pipe(
          finalize(() => {
            // Obtén la URL de descarga del archivo.
            fileRef.getDownloadURL().subscribe(url => {
              pregunta['uploading'] = false;
              console.log(`File URL: ${url}`);
              pregunta.image = url;
              //clase.archivos = clase.archivos.concat(fileInfo);
              console.log('pregunta',pregunta)
            });
          })
        ).subscribe();
      }

    };
  }

  deleteQuestionImage(question : Question,warnign = false): void {

    if (question.image){
      if(warnign){
        Swal.fire({
          title: `<span class=" gray-9 ft20">Borrar la imagen de la pregunta</span>`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: 'var(--red-5)',
          cancelButtonColor: 'var(--gray-4)',
          confirmButtonText: `Borrar imagen`,
          cancelButtonText:'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {

            firstValueFrom(
              this.storage.refFromURL(question.image).delete()
            ).catch((error) => console.log(error));
            question.image= '' ;
            question['uploading_file_progress']= 0
            
            Swal.fire({
              title:'Borrado!',
              text:`La imagen fué borrada`,
              icon:'success',
              confirmButtonColor: 'var(--blue-5)',
            })
          }
        })
      }
      else{
        firstValueFrom(
          this.storage.refFromURL(question.image).delete()
        ).catch((error) => console.log(error));
        question.image= '' ;
        question['uploading_file_progress']= 0

      }
    }

  }

  parseQuestionText(pregunta: Question): void {

    console.log('pregunta',pregunta)

    let existingPlaceholders = pregunta.getPlaceholders();
    pregunta['placeHolders'] = existingPlaceholders;

  }

  addChoice(question: Question, placeholder: string = ''): void {
    if (!question.options) {
      question.options = [];
    }
    let newOption: QuestionOption = {
      text: '',
      isCorrect: false,
      placeholder: placeholder,
    };
    question.options = [...question.options, newOption];
    console.log(question.options);
  }

  deleteOption(question: Question,optIndex: number): void {
    question.options = question.options.filter(
      (_, index) => index !== optIndex
    );
  }

  // QuestionType Multiple Choice
  toggleOptionValue(question : Question,optionIndex: number): void {
    const placeholder = question.options[optionIndex].placeholder;
    question.options[optionIndex].isCorrect = question.options[
      optionIndex
    ].isCorrect
      ? false
      : true;
    if (
      question.options[optionIndex].isCorrect &&
      question.type.value === QuestionType.TYPE_COMPLETE_VALUE
    ) {
      question.options.forEach((option, index) => {
        if (index != optionIndex && option.placeholder === placeholder) {
          option.isCorrect = false;
        }
      });
    }
    console.log(question.options);
  }

  showDisplayText(question:Question) {
    question['render'] = this.sanitizer.bypassSecurityTrustHtml(
      question.getDisplayText()
    );
  }

  // QuestionType Single Choice
  changeCorrectOption(question: Question,optionIndex: number): void {
    const placeholder = question.options[optionIndex].placeholder;
    console.log(optionIndex);
    console.log(question.options)
    question.options.forEach((option, index) => {
      if (index == optionIndex && option.placeholder === placeholder) {
        option.isCorrect = true;
        question['correctOption']=optionIndex;
      } else {
        option.isCorrect = false;
      }
    });
  }

  advanceTabActividad(){
    this.showErrorActividad = false;
    let valid = true

    console.log('tab actividad',this.activeStepActividad);

    if(this.activeStepActividad == 1){
      console.log(this.formNuevaActividadBasica)
      if(this.formNuevaActividadBasica.valid){
        this.selectedClase.titulo = this.formNuevaActividadBasica.value.titulo;
        this.selectedClase.activity.title =  this.formNuevaActividadBasica.value.titulo;
        this.selectedClase.activity.description =  this.formNuevaActividadBasica.value.descripcion;
        this.selectedClase.activity.duration = this.formNuevaActividadBasica.value.duracion;
      }
      else{
        this.showErrorActividad = true;
        valid = false
      }

    }
    if(this.activeStepActividad == 2){
      console.log(this.formNuevaActividadGeneral)
      if(this.formNuevaActividadGeneral.valid){
        this.selectedClase.activity.instrucciones =  this.formNuevaActividadGeneral.value.instrucciones;
      }
      else{
        this.showErrorActividad = true;
        valid = false
      }
    }
    //formNuevaActividadGeneral
    if(this.activeStepActividad == 3){
      if(!this.validatePreguntasActividad()){
        valid = false
      }
    }

    // pruebas desarrollo
    valid = true

    if (valid){
      if(this.validateActivity()){
        this.selectedClase.activity['isInvalid'] = false;
      }
      this.showErrorActividad = false;
      this.activeStepActividad = this.activeStepActividad+1
      console.log(this.selectedClase)
    }
    else{
      this.selectedClase.activity['isInvalid'] = true;
    }
  }

  validateActivity(){

    if(this.formNuevaActividadBasica.valid && this.formNuevaActividadGeneral.valid && this.validatePreguntasActividad()){
      return true
    }
    return false;
  }


  validatePreguntasActividad(){

    console.log(this.selectedClase.activity.questions);

    let preguntas = this.selectedClase.activity.questions;

    let valid = true;

    if(preguntas.length == 0){
      return false
    }
    
    preguntas.forEach(pregunta => {

      console.log('pregunta',pregunta)

      let response: QuestionValidationResponse = pregunta.isValidForm();
      if (!response.result) {
        console.log(response.messages)
        pregunta['isInvalid'] = true;
        pregunta['InvalidMessages'] = response.messages;
        valid = false;
      }
      else{
        if(pregunta.type.value == this.questionTypesIn.TYPE_COMPLETE_VALUE){
          this.showDisplayText(pregunta);
        }
        pregunta['isInvalid'] = false;
        pregunta['InvalidMessages'] = null;
      }
      
    });

    return valid;

  }

  
  crearPreguntaExamen(){

    if(!this.examen){
      this.examen = new Activity;
    }

    let pregunta = new Question;
    pregunta.id = Date.now().toString();
    this.hideOtherQuestionExamen(pregunta);
    pregunta['expanded'] = true;
    let activity : Activity = this.examen;
    console.log('activity',activity)
    let questions = activity.questions;
    console.log('questions',questions);

    questions.push(pregunta)

  }

  hideOtherQuestionExamen(questionIn){

    this.examen.questions.map( question => {
      if(questionIn.id != question.id)
      question['expanded'] = false;
    })

  }

  borrarPreguntaExamen(pregunta,index){
    console.log(pregunta,index);

    Swal.fire({
      title: `<span class=" gray-9 ft20">Borrar pregunta ${index+ 1 }</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--red-5)',
      cancelButtonColor: 'var(--gray-4)',
      confirmButtonText: `Borrar pregunta`,
      cancelButtonText:'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteQuestionImage(pregunta);
        this.examen.questions.splice(index, 1); // El primer argumento es el índice desde donde quieres empezar a borrar, y el segundo argumento es la cantidad de elementos que quieres borrar.
        Swal.fire({
          title:'Borrado!',
          text:`La pregunta fué borrada`,
          icon:'success',
          confirmButtonColor: 'var(--blue-5)',
        })
      }
    })
  }

  showErrorActividad= false;
  showErrorCompetencia = false
  isInvalidCases= false;
  isInvaliExamen= false;
  invalidMessages = [];


  validarModulosClases(){

    let valid = true;
    this.isInvalidCases= false;
    this.invalidMessages = [];
    if(this.modulos.length==0){
      valid = false
      this.isInvalidCases= true;
      this.invalidMessages.push('El curso debe contener al menos un módulo');
    }

    this.modulos.forEach(modulo => {
      modulo['InvalidMessages'] = [];
      modulo['isInvalid'] = false;
      if(modulo.clases.length==0){
        modulo['isInvalid'] = true;
        valid = false;
        modulo['InvalidMessages'].push('El módulo debe contener al menos una clase');
      }
      if(modulo.titulo==''){
        modulo['isInvalid'] = true;
        valid = false;
        modulo['InvalidMessages'].push('El módulo debe tener título');
      }
      else{
        let clases = modulo.clases;
        clases.forEach(clase => {
          console.log('clase',clase)
          clase['InvalidMessages'] = [];
          clase['isInvalid'] = false;

          if(clase.titulo==''){
            modulo['isInvalid'] = true;
            clase['isInvalid'] = true;
            valid = false;
            modulo['InvalidMessages'].push('El módulo tiene clases invalidas');
            clase['InvalidMessages'].push('La clase debe tener título');
          }

          if (clase.tipo == 'video'){
            if(clase.idVideo==0){
              modulo['isInvalid'] = true;
              clase['isInvalid'] = true;
              valid = false;
              modulo['InvalidMessages'].push('El módulo tiene clases invalidas');
              clase['InvalidMessages'].push('La clase debe tener el video cargado');
            }
          }
          else if (clase.tipo =='lectura'){

            if(clase.archivos.length==0){
              modulo['isInvalid'] = true;
              clase['isInvalid'] = true;
              valid = false;
              modulo['InvalidMessages'].push('El módulo tiene clases invalidas');
              clase['InvalidMessages'].push('La clase debe tener el archivo de la lectura');
            }

          }
          else if(clase.tipo == 'actividad'){

            console.log(clase['activity'].isInvalid)

            if(clase['activity'].isInvalid){
              modulo['isInvalid'] = true;
              clase['isInvalid'] = true;
              valid = false;
              modulo['InvalidMessages'].push('El módulo tiene clases invalidas');
              clase['InvalidMessages'].push('La actividad tiene la estructura incompleta');
            }
          }
          clase['InvalidMessages'] = [...new Set(clase['InvalidMessages'])];
          modulo['InvalidMessages'] = [...new Set(modulo['InvalidMessages'])];

        });
      }
    });

    console.log('modulos',this.modulos)

    return valid;

  }

  showErrorCusro = false;

  mensageCompetencias = "Selecciona una competencia para asignarla al curso";
  comepetenciaValid= true


  saveCompetenciasActividad(){
    let preguntas = this.selectedClase.activity.questions;
    
    preguntas.forEach(pregunta => {
      let arrayCompetencias = []
      console.log(pregunta);
      let competencias = pregunta.competencias_tmp;
      competencias.forEach(categoria => {
        let competenciasLocal = categoria.competencias.filter(competencia=> competencia.selected ==true)
        arrayCompetencias = [...arrayCompetencias, ...competenciasLocal];
      });
      pregunta.competencias = arrayCompetencias;
    });
    


    this.modalCompetencia.close();
  }


  advanceTabCompetencia(){

    let valid = true;

    if(this.activeStepCompetencias == 1){
      console.log(this.selectedClase,this.competenciasSelectedClase)
      this.getSelectedCategoriasCompetenciasClase();
      if(this.competenciasSelecttedClase.length>0){
        this.saveCompetenciasClase(false);
        console.log('revisar',this.selectedClase.competencias,this.selectedClase.activity.questions);
        this.selectedClase.activity.questions.forEach(question => {
          console.log(question);
          if(question.competencias.length>0){
            //this.getSelectedCategoriasCompetenciasClase();
            question['competencias_tmp']=[];
            let competenciasTotal = structuredClone(this.competenciasSelecttedClase);
            console.log('competenciasSelecttedClase',this.competenciasSelecttedClase)
            let competenciasTotalProcesdo=[]
            let categorias=[];
            competenciasTotal.forEach(categoria => {
              console.log('error',categoria)
              let item = categoria.categoria;
              console.log('error',item)
              item['expanded'] = true;
              categorias.push(item)
              categoria.competencias.forEach(competencia => {
                competencia.selected = false;
                competenciasTotalProcesdo.push(competencia)
              });
            });
            //console.log(competencias);
            question.competencias.forEach(competencia => {
              console.log(competencia)
              let competenciaP = competenciasTotalProcesdo.find(competenciaeach => competenciaeach.id == competencia.id);
              competenciaP.selected = true;
            });
      
            console.log(competenciasTotalProcesdo);
            
            let respueta  = this.anidarCompetencias(categorias,competenciasTotalProcesdo);
            console.log(respueta);
            question['competencias_tmp'] = respueta;
          }
          else{
            //this.getSelectedCategoriasCompetenciasClase();
            let preguntasCompetenciasTmp = structuredClone(this.competenciasSelecttedClase);//estoy aqui
            preguntasCompetenciasTmp.forEach(categoria => {
              console.log(categoria)
              categoria.expanded = true
              categoria.competencias.forEach(competencia => {
                competencia.selected = false;
              });
            });
            question['competencias_tmp']= preguntasCompetenciasTmp;
          }
        });
      }
      else{
        valid = false;
      }
    }

    if(valid){
      this.activeStepCompetencias++
    }
  }

  advanceTab(){

    this.showErrorCusro = false;
    this.mensageCompetencias = "Selecciona una competencia para asignarla al curso";
    this.comepetenciaValid= true


    let valid = true;
    console.log('tab general',this.activeStep);
    if(this.activeStep == 1){
      console.log(this.formNuevoCurso)
      if(!this.formNuevoCurso.valid){
        valid = false;
      }
      else{
        let newCurso = new Curso;
        newCurso.descripcion=''
        newCurso.duracion=0
        newCurso.foto=''
        newCurso.instructorDescripcion=''
        newCurso.instructorNombre=''
        newCurso.nivel=''
        newCurso.vimeoFolderId=''
        this.curso = newCurso
      }
    }
    if(this.activeStep == 2){
      this.getSelectedCategoriasCompetencias()
      console.log(this.competenciasSelected);
      if(!this.competenciasSelected || this.competenciasSelected?.length==0){
        valid = false;
        this.mensageCompetencias = "Por favor seleccione una competencia";
        this.comepetenciaValid = false;

      }
    }
    if(this.activeStep == 3){
      if(!this.validarModulosClases()){
        valid = false;
      }
    }
    if(this.activeStep == 4){
      if(!this.validatePreguntasExamen()){
        valid = false;
      }
      else{
        this.closeAllModulos();
      }
    }


    valid = true; // comentar luego de probar
    if(valid){
      this.activeStep = this.activeStep+1
    }
    else{
      this.showErrorCusro = true;
    }

  }

  validatePreguntasExamen(){

    this.isInvaliExamen= false; 
    this.invalidMessages = [];
    let preguntas = this.examen?.questions;

    let valid = true;
    
    if(preguntas?.length == 0 || !preguntas){
      this.isInvaliExamen= true;
      this.invalidMessages.push('El examen debe contener al menos una pregunta');
      return false
    }
    
    preguntas?.forEach(pregunta => {

      console.log('pregunta',pregunta)

      let response: QuestionValidationResponse = pregunta.isValidForm();
      if (!response.result) {
        console.log(response.messages)
        pregunta['isInvalid'] = true;
        pregunta['InvalidMessages'] = response.messages;
        valid = false;
      }
      else{
        if(pregunta.type.value == this.questionTypesIn.TYPE_COMPLETE_VALUE){
          this.showDisplayText(pregunta);
        }
        pregunta['isInvalid'] = false;
        pregunta['InvalidMessages'] = null;
      }
      
    });

    return valid;

  }

  seleccionarImagenCurso(imagen){
    this.formNuevoCurso.get('imagen').patchValue(imagen);
  }

  seleccionarImagenInstructor(imagen){
    this.formNuevoCurso.get('imagen_instructor').patchValue(imagen);
  }


  uploadingImgCurso = false;
  uploadingImgInstuctor = false;
  fileNameImgCurso = ''
  fileNameImgInstuctor = ''
  uploading_file_progressImgCurso=0
  uploading_file_progressImgInstuctor=0


  uploadCursoImage(event,tipo){

    if (!event.target.files[0] || event.target.files[0].length === 0) {

      Swal.fire({
        title:'Borrado!',
        text:`Debe seleccionar una imagen`,
        icon:'warning',
        confirmButtonColor: 'var(--blue-5)',
      })
      return;
    }
    const file = event.target.files[0];

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (_event) => {
      //this.deleteQuestionImage(pregunta);

      if (file) {
        if(tipo == 'instructor'){
          this.uploadingImgInstuctor = true;
        }
        else{
          this.uploadingImgCurso = true;
        }
        let fileBaseName = file.name.split('.').slice(0, -1).join('.');
        let fileExtension = file.name.split('.').pop();
  
        const base64content = await this.fileToBase64(file);

        let nombre = fileBaseName+'.'+fileExtension;
        if(tipo == 'instructor'){
          this.fileNameImgInstuctor = nombre
        }
        else{
          this.fileNameImgCurso = nombre
        }
        console.log(nombre)

        // Reorganizar el nombre para que el timestamp esté antes de la extensión
        let newName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;
  
        let nombreCurso = this.formNuevoCurso.get('titulo').value?  this.formNuevoCurso.get('titulo').value : 'Temporal';
        let nombreinstructor = this.formNuevoCurso.get('instructor').value?  this.formNuevoCurso.get('instructor').value : 'Temporal';

        let filePath;

        if(tipo == 'instructor'){
          filePath = `Clientes/${this.empresa.nombre}/Instructor/${nombreinstructor}/${newName}`;
        }
        else{
          filePath = `Clientes/${this.empresa.nombre}/Cursos/${nombreCurso}/Imagen/${newName}`;
        }
  
        const task = this.storage.upload(filePath, file);
  
        // Crea una referencia a la ruta del archivo.
        const fileRef = this.storage.ref(filePath);
  
        // Obtener el progreso como un Observable
        this.uploadProgress$ = task.percentageChanges();
  
        // Suscríbete al Observable para actualizar tu componente de barra de progreso
        this.uploadProgress$.subscribe(progress => {
          console.log(progress);
          if(tipo == 'instructor'){
            this.uploading_file_progressImgInstuctor = Math.floor(progress) ;
          }
          else{
            this.uploading_file_progressImgCurso = Math.floor(progress) ;
          }
        });
  
        // Observa el progreso de la carga del archivo y haz algo cuando se complete.
        task.snapshotChanges().pipe(
          finalize(() => {
            // Obtén la URL de descarga del archivo.
            fileRef.getDownloadURL().subscribe(url => {
              if(tipo == 'instructor'){
                this.uploadingImgInstuctor = false;
                this.formNuevoCurso.get('imagen_instructor').patchValue(url);
                this.avatarInstructor.unshift(url);
              }
              else{
                this.uploadingImgCurso = false;
                this.formNuevoCurso.get('imagen').patchValue(url);
                this.imagenesCurso.unshift(url)

              }
              console.log(`File URL: ${url}`);
            });
          })
        ).subscribe();
      }

    };

  }


  GuardarNuevaCompetencia(){
    this.showErrorCompetencia = false
    console.log(this.formNuevaComptencia)
    if(this.formNuevaComptencia.valid){

      console.log(this.categoriaNuevaCompetencia)

      let competencia = {
        id:Date.now(),
        name: this.formNuevaComptencia.value.nombre,
        selected: false,
        new : true,
        categoriaId: this.categoriaNuevaCompetencia.id
        
      }
      this.categoriaNuevaCompetencia.competencias.unshift(competencia);
      this.modalCompetencia.close();
    }
    else{
      this.showErrorCompetencia = true;
    }
  }


  deleteCompetencia(categoria,competenciaIn){
    let competencias = categoria.competencias.filter(competencia => competencia.name != competenciaIn.name)
    categoria.competencias = competencias;
  }


  finalizarCurso(content){

    this.openModalFonalizarCurso(content)

  }

  openModalFonalizarCurso(content){


    this.modalCompetencia = this.modalService.open(content, {
     ariaLabelledBy: 'modal-basic-title',
     centered: true,
     size:'lg'

   });
 }

  


}
