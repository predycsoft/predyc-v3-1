import { Component, Input } from '@angular/core';
import { Category } from 'src/app/shared/models/category.model';
import { Profile } from 'src/app/shared/models/profile.model';
import { Skill } from 'src/app/shared/models/skill.model';
import { User } from 'src/app/shared/models/user.model';
import { CategoryService } from 'src/app/shared/services/category.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { SkillService } from 'src/app/shared/services/skill.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-student-profile-history',
  templateUrl: './student-profile-history.component.html',
  styleUrls: ['./student-profile-history.component.css']
})
export class StudentProfileHistoryComponent {

  @Input() student: User

  constructor(
    public icon: IconService,
    private profileService: ProfileService,
    private userService: UserService,
    private skillService: SkillService,
    private categoryService: CategoryService
  ){}
  
  profiles: Profile[]
  userProfileData 
  skills: Skill[]
  categories: Category[]
  profilesHistoricData: any[]

  async ngOnInit() {
    await this.profileService.loadProfiles(); // Caso es en recargar la pagina

    this.userProfileData = await this.profileService.getUserProfileLogs(this.userService.getUserRefById(this.student.uid))
    // console.log("this.userProfileData", this.userProfileData)
    this.profileService.getProfilesObservable().subscribe(profiles => {
      this.profiles = profiles
    })
    this.skillService.getSkillsObservable().subscribe(skills => {
      this.skills = skills
    })
    this.categoryService.getCategoriesObservable().subscribe(categories => {
      this.categories = categories
    })
    this.profilesHistoricData = this.userProfileData.map(profileData => 
      this.getSkillsByCategoryForProfile(profileData)
    );
    // console.log("this.profilesHistoricData", this.profilesHistoricData)

  }

  getSkillsByCategoryForProfile(profileData: any): any {
    const profileId = profileData.profileRef.id;
    const profile = this.profileService.getProfile(profileId);
    const userSkillsRefs = profile.skillsRef.map(skillRef => skillRef.id); // Obtener los IDs de skills para el perfil dado
    
    const categorizedSkills = this.categories.map(category => {
      let skills = this.skills
        .filter(skill => {
          // Comprobar si el skill pertenece a la categoría actual y su ID está presente en la lista de habilidades del usuario.
          return skill.category.id === category.id && userSkillsRefs.includes(skill.id);
        })
        .map(skill => {
          const { category, ...rest } = skill;
          return {
            ...rest,
            categoriaId: category.id
          };
        });
  
      return {
        ...category,
        skills: skills
      };
    }).filter(categoria => categoria.skills.length > 0); // Filtrar categorías que tienen el array competencias vacío;

    return {
      description: profile.description,
      profileName: profile.name,  // Asumiendo que el perfil tiene un campo "name"
      skillsByCategory: categorizedSkills,
      updatedAt: profileData.updatedAt.toDate().getFullYear(),
    };
  }
  
  
  
}
