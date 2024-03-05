import { Component } from '@angular/core';
import { LoaderService } from 'projects/predyc-business/src/shared/services/loader.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EditValidationTestComponent } from './edit-validation-test/edit-validation-test.component';
import { SkillService } from 'projects/predyc-business/src/shared/services/skill.service';
import { ActivityClassesService } from 'projects/predyc-business/src/shared/services/activity-classes.service';
import { Activity } from 'projects/predyc-business/src/shared/models/activity-classes.model';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { AlertsService } from 'projects/predyc-business/src/shared/services/alerts.service';

@Component({
  selector: 'app-validation',
  templateUrl: './validation.component.html',
  styleUrls: ['./validation.component.css']
})
export class ValidationComponent {

  constructor(
    private loaderService: LoaderService,
    private modalService: NgbModal,
    private skillsService: SkillService,
    private activityService: ActivityClassesService,
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService
  ) {}

  openEditValidationTestModal(targetActivity=null): NgbModalRef {
    const modalRef = this.modalService.open(EditValidationTestComponent, {
      animation: true,
      centered: true,
      size: 'xl'
    })
    if (targetActivity) {
      modalRef.componentInstance.existingActivity = targetActivity
    }
    return modalRef
  }

  createValidationTest() {
    const modalRef = this.openEditValidationTestModal()
    // modalRef.closed(result => {
    //   // this.activityService.addActivity()
    // })
    modalRef.result.then(async result => {
      console.log("result", result)
      const skillsRef = result.modalPage2.testSkills.map(skill => {
        return this.skillsService.getSkillRefById(skill.id)
      })
      const questions = result.modalPage3.questions.map(question => {
        const skillsRef = question.skills.map(skill => {
          return this.skillsService.getSkillRefById(skill.id)
        })
        delete question['skills']
        return {
          id: null,
          ...question,
          image: question.image.url,
          skillsRef
        }
      })
      const skillTest = {
        ...result.modalPage1,
        enterpriseRef: this.enterpriseService.getEnterpriseRef(),
        skillsRef,
      }
      const activity = Activity.createSkillTest(skillTest)
      try {
        await this.activityService.addActivity(activity)
        for (let question of questions) {
          await this.activityService.addQuestion(activity.id, question)
        }
        this.alertService.succesAlert('Examen de validación agregado exitosamente')
      } catch (error) {
        this.alertService.errorAlert(error)
      }
      console.log(activity)
    }).catch(error => console.log("error", error))
  }

  editValidationTest() {
    const modalRef = this.openEditValidationTestModal({
      title: 'test activity',
      description: 'test description',
      instructions: 'test instructions',
    })
    modalRef.result.then(result => {
      console.log("result", result)
    }).catch(error => console.log("error", error))
  }

}

// Formato que devuelve el modal
// {
//   "modalPage1": {
//       "title": "Titulo",
//       "description": "descripcion",
//       "duration": 60
//   },
//   "modalPage2": {
//       "testSkills": [
//           {
//               "id": "9sqOPfIwMy6MFDpMvPBz",
//               "name": "Desgaste y fallos",
//               "categoryId": "pTNp9maHykYmi7ed8aSZ"
//           },
//           {
//               "id": "Hz0edH9w7ageUCUXZKCC",
//               "name": "Mecánica de materiales",
//               "categoryId": "pTNp9maHykYmi7ed8aSZ"
//           },
//           {
//               "id": "zjK7tu4WGMEflAkiFPI1",
//               "name": "Diagnóstico de problemas",
//               "categoryId": "pTNp9maHykYmi7ed8aSZ"
//           }
//       ]
//   },
//   "modalPage3": {
//       "questions": [
//           {
//               "text": "Pregunta",
//               "type": "single_choice",
//               "image": {
//                   "url": "",
//                   "file": null
//               },
//               "options": [
//                   {
//                       "text": "Opcion 1",
//                       "isCorrect": true,
//                       "placeholder": null
//                   },
//                   {
//                       "text": "Opcion 2",
//                       "isCorrect": false,
//                       "placeholder": null
//                   }
//               ],
//               "points": 10,
//               "skills": [
//                   {
//                       "id": "9sqOPfIwMy6MFDpMvPBz",
//                       "name": "Desgaste y fallos",
//                       "categoryId": "pTNp9maHykYmi7ed8aSZ"
//                   }
//               ]
//           }
//       ]
//   }
// }
