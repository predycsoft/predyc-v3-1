import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { CategoryService } from '../../services/category.service';
import { SkillService } from '../../services/skill.service';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Skill } from 'projects/shared/models/skill.model';
import { EnterpriseService } from '../../services/enterprise.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Category } from 'projects/shared/models/category.model';

function twoWordsOrLess(control: AbstractControl): ValidationErrors | null {
  const words = (control.value || '').trim().split(/\s+/);
  return words.length <= 3 ? null : { tooManyWords: true };
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
  @Input() competenciasSelected
  @Input() origin = 'Crear Curso'

  @Output() competenciasSelectedOut  = new EventEmitter<any>();

  showErrorCompetencia = false
  formNuevaComptencia: FormGroup;
  categoriaNuevaCompetencia;
  modalCompetencia
  comepetenciaValid= true
  mensageCompetencias = "Selecciona una competencia para asignarla al curso";
  enterpriseRef

  ngOnInit() {
    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if (isLoaded) {
        this.enterpriseRef =this.enterpriseService.getEnterpriseRef()
      }
    })
  }

  openModalCompetencia(content,competencia){
    this.showErrorCompetencia = false
    this.formNuevaComptencia = new FormGroup({
      nombre: new FormControl(null, [Validators.required, twoWordsOrLess])
    })
    this.categoriaNuevaCompetencia = competencia
     this.modalCompetencia = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true
    });
  }

  getSelectedCategoriasCompetencias(){
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


    } else {
      this.showErrorCompetencia = true;
    }
  }

}
