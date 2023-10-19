import { Component, EventEmitter, Input, Output } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { IconService } from '../../services/icon.service';
import { LoaderService } from '../../services/loader.service';
import { SkillService } from '../../services/skill.service';
import { Skill } from '../../models/skill.model'

@Component({
  selector: 'app-skills-selector-v2',
  templateUrl: './skills-selector-v2.component.html',
  styleUrls: ['./skills-selector-v2.component.css']
})
export class SkillsSelectorV2Component {

  constructor(
    public icon: IconService,
    public loaderService: LoaderService,
    private categoryService: CategoryService,
    private skillService: SkillService
  ) {}

  // @Input() recommendedSkills;
  // @Input() categories;
  @Input() selectedSkills
  @Output() onSelectedSkillsUpdate  = new EventEmitter<any>();

  ngOnInit() {

  }

  // getSelectedSkills() {
  //   const selectedSkills = [];

  //   this.categories.forEach(category => {
  //     const selectedSkills = category.skills.filter(skill => skill.selected)
  //     if (selectedSkills.length > 0) {
  //       selectedSkills.push({
  //         category : { name: category.name, id: category.id },
  //         skills : selectedSkills,
  //         expanded: true
  //       })
  //     }
  //   });

  //   this.selectedSkills = [...selectedSkills];

  //   this.onSelectedSkillsUpdate.emit(this.selectedSkills);
  // }

}
