import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryService } from 'projects/predyc-business/src/shared/services/category.service';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { CategoryJson, Category } from 'projects/shared/models/category.model';
import { Subscription, Observable, startWith, map } from 'rxjs';
import { EnterpriseJson } from 'shared';
import Swal from 'sweetalert2';
import { CategoryInList } from '../pillars-list/pillars-list.component';
import { SkillService } from 'projects/predyc-business/src/shared/services/skill.service';
import { Skill, SkillJson } from 'projects/shared/models/skill.model';

@Component({
  selector: 'app-dialog-pillars-form',
  templateUrl: './dialog-pillars-form.component.html',
  styleUrls: ['./dialog-pillars-form.component.css']
})

export class DialogPillarsFormComponent {
  @Input() pillar: CategoryInList;

  pillarForm: FormGroup;
  showFormError: boolean = false;

  formNewSkill: FormGroup;
  createSkillModal: any;

  pillarSkills = []

  constructor(
    public icon: IconService,
    public modal: NgbActiveModal,
    private categoryService: CategoryService,
    private enterpriseService: EnterpriseService,
    private skillService: SkillService,
    private modalService: NgbModal,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.loadPillarForm(this.pillar);
    this.initSkillForm();
    if (this.pillar) this.pillarSkills = this.pillar.skills // In editing mode
  }

  loadPillarForm(pillar: CategoryJson) {
    this.pillarForm = this.fb.group({
      pillarName: [pillar ? pillar.name : '', Validators.required],
      skills: ['']
    });
  }

  initSkillForm() {
    this.formNewSkill = this.fb.group({
      nombre: ['', Validators.required]
    });
  }

  crearCompetencia(modal) {
    this.createSkillModal = this.modalService.open(modal, {
      ariaLabelledBy: "modal-basic-title",
      centered: true,
      size: "md",
    });
  }

  saveNewSkill(modal) {
    if (this.formNewSkill.valid) {
      const newSkill = {
        name: this.formNewSkill.get('nombre').value,
        id: null,
        enterprise: null,
        categoryId: this.pillar ? this.pillar.id : null
      };

      // Add the new skill to the pillar's skills array
      this.pillarSkills.push(newSkill);
      this.formNewSkill.reset(); // Reset the form
      modal.close(); // Close the modal
    } else {
    }
  }

  deleteSkill(skill) {
    if (skill.id) { // Delete skill in database
      Swal.fire({
        title: "Se eliminará la competencia",
        text: "¿Deseas continuar?",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Guardar",
        confirmButtonColor: 'var(--blue-5)',
      }).then(async (result) => {
        if (result.isConfirmed) {
          this.skillService.deleteSkill(skill.id)          
        }
      });
    }
    const index = this.pillarSkills.indexOf(skill);
    if (index > -1) this.pillarSkills.splice(index, 1);
  }

  async savePillar() {
    Swal.fire({
      title: "Generando pilar...",
      text: "Por favor, espera.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    if (this.pillarForm.valid) {
      const pillarName = this.pillarForm.get('pillarName').value;
      const newPillar: CategoryJson = {
        name: pillarName,
        id: this.pillar ? this.pillar.id : null,
        enterprise: null
      };
      try {
        console.log("newPillar", newPillar)
        const pillarId = await this.categoryService.addCategory(Category.fromJson(newPillar));
        console.log("Pillar saved")
        if (this.pillarSkills) {
          const newSkillsToSave: SkillJson[] = []
          for (let skill of this.pillarSkills) {
            const skillToSave = new Skill(null, skill.name, this.categoryService.getCategoryRefById(pillarId), null).toJson();
            if (!skill.id) newSkillsToSave.push(skillToSave)
          }
          console.log("newSkillsToSave", newSkillsToSave)
          await this.skillService.addSkills(newSkillsToSave)
          console.log("Skills saved")
        }
        Swal.close();
        this.modal.close();
      } catch (error) {
        console.error("Error: ", error);
        Swal.fire({
          title: "Error!",
          text: `Ha ocurrido un error guardando el pilar. Intentalo de nuevo más tarde.`,
          icon: "warning",
          confirmButtonColor: "var(--blue-5)",
        });
      }
    }
    else {
      this.showFormError = true;
      Swal.close();
    }
  }

  ngOnDestroy() {
    
  }
}
