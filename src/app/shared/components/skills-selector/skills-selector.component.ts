import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { IconService } from '../../../shared/services/icon.service';
import { CategoryService } from '../../services/category.service';
import { SkillService } from '../../services/skill.service';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Skill } from '../../models/skill.model';
import { EnterpriseService } from '../../services/enterprise.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Category } from '../../models/category.model';

interface Competencia {
  id: number;
  name: string;
  selected: boolean;
  categoriaId: number;
}

@Component({
  selector: 'app-skills-selector',
  templateUrl: './skills-selector.component.html',
  styleUrls: ['./skills-selector.component.css']
})
export class SkillsSelectorComponent implements OnInit {

  constructor(
    public icon: IconService,
    public categoryService : CategoryService,
    public skillService: SkillService,
    private modalService: NgbModal,
    private enterpriseService: EnterpriseService,
    private afs: AngularFirestore,
  ){

  }

  @Input() competenciasEmpresa;
  @Input() categoriasArray;
  @Input() modulos
  @Input()competenciasSelected
  @Input() origin = 'Crear Curso'

  @Output() competenciasSelectedOut  = new EventEmitter<any>();
  



  showErrorCompetencia = false
  formNuevaComptencia: FormGroup;
  categoriaNuevaCompetencia;
  modalCompetencia
  comepetenciaValid= true
  mensageCompetencias = "Selecciona una competencia para asignarla al curso";
  enterpriseRef



  async ngOnInit(): Promise<void> {
    await this.enterpriseService.whenEnterpriseLoaded()
    this.enterpriseRef =this.enterpriseService.getEnterpriseRef()
  }
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

  getSelectedCategoriasCompetencias(competencia = null){
    console.log('getSelectedCategoriasCompetencias')
    let respuesta = [];
    console.log(this.categoriasArray)

    this.categoriasArray.forEach(categoria => {
      let selected = categoria.competencias.filter(competencia => competencia.selected)
      if(selected.length>0){
        let obj = {
          categoria : {name:categoria.name, id:categoria.id},
          competencias : selected,
          expanded: true
        }
        respuesta.push(obj)
      }
    });

    console.log('respuesta',respuesta)
    this.competenciasSelected = respuesta;

    this.competenciasSelectedOut.emit(respuesta);
  }

  deleteCompetencia(categoria,competenciaIn){
    let competencias = categoria.competencias.filter(competencia => competencia.name != competenciaIn.name)
    categoria.competencias = competencias;

    this.skillService.deleteSkill(competenciaIn.id)
  }

  async GuardarNuevaCompetencia(){
    this.showErrorCompetencia = false
    console.log(this.formNuevaComptencia)
    if(this.formNuevaComptencia.valid){

      console.log(this.categoriaNuevaCompetencia)

      let competencia = {
        id:Date.now().toString(),
        name: this.formNuevaComptencia.value.nombre,
        selected: false,
        new : true,
        categoriaId: this.categoriaNuevaCompetencia.id
        
      }
      //this.categoriaNuevaCompetencia.competencias.unshift(competencia);
      this.modalCompetencia.close();
      let CategoryRef = this.afs.collection<Category>(Category.collection).doc(competencia.categoriaId).ref
      let skill = new Skill(competencia.id,competencia.name,CategoryRef,this.enterpriseRef)
      //this.categoriesObservable.unsubscribe();
      this.categoriaNuevaCompetencia.competencias.unshift(competencia);
      await this.skillService.addSkill(skill)


    }
    else{
      this.showErrorCompetencia = true;
    }
  }




}
