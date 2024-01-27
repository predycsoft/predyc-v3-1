import { DocumentReference } from "@angular/fire/compat/firestore"
import { Profile } from "./profile.model"
import { Enterprise } from "./enterprise.model"
import { Department } from "./department.model"

export interface UserJson {
  birthdate: number | null
  canEnrollParticularCourses: boolean
  city: string | null
  country: string | null
  courseQty: number
  createdAt: number | null // timestamp
  currentlyWorking: boolean
  degree: string | null
  departmentRef: DocumentReference<Department> | null
  displayName: string | null
  email: string | null
  enterprise: DocumentReference | null
  experience: number | null
  gender: string | null
  hasCollegeDegree: boolean
  hiringDate: number | null
  industry: string | null
  isSystemUser: boolean
  job: string | null
  lastConnection: number | null // timestamp
  mailchimpTag: string | null
  name: string | null
  phoneNumber: string | null
  photoUrl: string | null
  zipCode: number | null
  profile: DocumentReference<Profile> | null
  role: typeof User.ROLE_ADMIN | typeof User.ROLE_STUDENT
  isActive: boolean
  stripeId: string | null
  uid: string | null
  updatedAt: number | null
  avgScore: number
  certificatesQty: number
  performance: 'no plan'| 'low'| 'medium'| 'high'| null
  ratingPoints: number
  studyHours: number
  status: string // improve the type options
}

export class User {

  public static collection = 'user'
  public static storageProfilePhotoFolder = 'User/Profile photos'
  public static ROLE_ADMIN = 'admin'
  public static ROLE_STUDENT = 'student'

  public enterpriseData?: Enterprise
  public profileData?: Profile

  constructor(
    public birthdate: number | null,
    public canEnrollParticularCourses: boolean,
    public city: string | null,
    public country: string | null,
    public courseQty: number,
    public createdAt: number | null, // timestamp
    public currentlyWorking: boolean,
    public degree: string | null,
    public departmentRef: DocumentReference<Department> | null,
    public displayName: string | null,
    public email: string | null,
    public enterprise: DocumentReference | null,
    public experience: number | null,
    public gender: string | null,
    public hasCollegeDegree: boolean,
    public hiringDate: number | null,
    public industry: string | null, // Required?
    public isSystemUser: boolean,
    public job: string | null,
    public lastConnection: number | null, // timestamp
    public mailchimpTag: string | null,
    public name: string | null,
    public phoneNumber: string | null,
    public photoUrl: string | null,
    public zipCode: number | null,
    public profile: DocumentReference<Profile> | null,
    public role: typeof User.ROLE_ADMIN | typeof User.ROLE_STUDENT,
    public isActive: boolean,
    public stripeId: string | null,
    public uid: string | null,
    public updatedAt: number | null,
    

    // metrics
    public avgScore: number,
    public certificatesQty: number,
    public performance: 'no plan'| 'low'| 'medium'| 'high'| null,
    public ratingPoints: number,
    public studyHours: number,

    public status: string,

  ) {}

  public static getEnterpriseAdminUser(enterprise: DocumentReference) {
    return User.getNewUser({
      isSystemUser: false,
      role: User.ROLE_ADMIN,
      enterprise: enterprise,
    })
  }

  public static getEnterpriseStudentUser(enterprise: DocumentReference) {
    return User.getNewUser({
      isSystemUser: false,
      role: User.ROLE_STUDENT,
      enterprise: enterprise
    })
  }

  public static getSystemAdminUser() {
    return User.getNewUser({
      isSystemUser: true,
      role: User.ROLE_ADMIN,
    })
  }

  public static getSystemStudentUser() {
    return User.getNewUser({
      isSystemUser: true,
      role: User.ROLE_STUDENT,
    })
  }

  public static getStudentUser() {
    return User.getNewUser({
      isSystemUser: false,
      role: User.ROLE_STUDENT,
    })
  }

  private static getNewUser(configObj: {
    isSystemUser: boolean,
    role: typeof User.ROLE_ADMIN | typeof User.ROLE_STUDENT,
    enterprise?: DocumentReference,
  }): User {
    return User.fromJson({
      birthdate: null,
      canEnrollParticularCourses: false,
      city: null,
      country: null,
      courseQty: 0,
      createdAt: null,
      currentlyWorking: false,
      degree: null,
      departmentRef: null,
      displayName: null,
      email: null,
      enterprise: configObj.enterprise ? configObj.enterprise : null, 
      experience: null,
      gender: null,
      hasCollegeDegree: false,
      hiringDate: null,
      industry: null,
      isSystemUser: configObj.isSystemUser,
      job: null,
      lastConnection: null,
      mailchimpTag: null,
      name: null,
      phoneNumber: null,
      photoUrl: null,
      zipCode: null,
      profile: null,
      role: configObj.role,
      isActive: true,
      stripeId: null,
      uid: null,
      updatedAt: null,
      avgScore: 0,
      certificatesQty: 0,
      performance: null,
      ratingPoints: 0,
      studyHours: 0,
      status: 'incomplete'
    })
  }

  public static fromJson(userJson: UserJson): User {
    return new User(
      userJson.birthdate,
      userJson.canEnrollParticularCourses,
      userJson.city,
      userJson.country,
      userJson.courseQty,
      userJson.createdAt,
      userJson.currentlyWorking,
      userJson.degree,
      userJson.departmentRef,
      userJson.displayName,
      userJson.email,
      userJson.enterprise, 
      userJson.experience,
      userJson.gender,
      userJson.hasCollegeDegree,
      userJson.hiringDate,
      userJson.industry,
      userJson.isSystemUser,
      userJson.job,
      userJson.lastConnection,
      userJson.mailchimpTag,
      userJson.name,
      userJson.phoneNumber,
      userJson.photoUrl,
      userJson.zipCode,
      userJson.profile,
      userJson.role,
      userJson.isActive,
      userJson.stripeId,
      userJson.uid,
      userJson.updatedAt,
      userJson.avgScore,
      userJson.certificatesQty,
      userJson.performance,
      userJson.ratingPoints,
      userJson.studyHours,
      userJson.status
    )
  }

  toJson(): UserJson {
    return {
      birthdate: this.birthdate,
      canEnrollParticularCourses: this.canEnrollParticularCourses,
      city: this.city,
      country: this.country,
      courseQty: this.courseQty,
      createdAt: this.createdAt,
      currentlyWorking: this.currentlyWorking,
      degree: this.degree,
      departmentRef: this.departmentRef,
      displayName: this.displayName,
      email: this.email,
      enterprise: this.enterprise,
      experience: this.experience,
      gender: this.gender,
      hasCollegeDegree: this.hasCollegeDegree,
      hiringDate: this.hiringDate,
      industry: this.industry,
      isSystemUser: this.isSystemUser,
      job: this.job,
      lastConnection: this.lastConnection,
      mailchimpTag: this.mailchimpTag,
      name: this.name,
      phoneNumber: this.phoneNumber,
      photoUrl: this.photoUrl,
      zipCode: this.zipCode,
      profile: this.profile,
      role: this.role,
      isActive: this.isActive,
      stripeId: this.stripeId,
      uid: this.uid,
      updatedAt: this.updatedAt,
      avgScore: this.avgScore,
      certificatesQty: this.certificatesQty,
      performance: this.performance,
      ratingPoints: this.ratingPoints,
      studyHours: this.studyHours,
      status: this.status
    }
  }

  patchValue(obj: Object) {
    Object.keys(obj).forEach(key => {
      if (this.hasOwnProperty(key)) this[key] = obj[key]
    })
  }

}

export class oldUser {
  constructor(public name: string) {}
}
