import { DocumentReference } from "@angular/fire/compat/firestore"

export interface UserJson {
  birthdate: number | null
  country: string | null
  courseQty: number
  createdAt: number | null // timestamp
  currentlyWorking: boolean
  degree: string | null
  // departmentId: string | null
  department: DocumentReference | null,
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
  // profileId: string | null
  profile: DocumentReference | null
  role: typeof User.ROLE_ADMIN | typeof User.ROLE_STUDENT
  isActive: boolean
  stripeId: string | null
  uid: string | null
  avgScore: number
  performance: string | null
  ratingPoints: number
}

export class User {

  public static collection = 'user'
  public static ROLE_ADMIN = 'admin'
  public static ROLE_STUDENT = 'student'

  constructor(
    public birthdate: number | null,
    public country: string | null,
    public courseQty: number,
    public createdAt: number | null, // timestamp
    public currentlyWorking: boolean,
    public degree: string | null,
    // public departmentId: string | null,
    public department: DocumentReference | null,
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
    // public profileId: string | null,
    public profile: DocumentReference | null,
    public role: typeof User.ROLE_ADMIN | typeof User.ROLE_STUDENT,
    public isActive: boolean,
    public stripeId: string | null,
    public uid: string | null,

    // metrics
    public avgScore: number,
    public performance: string | null,
    public ratingPoints: number,
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
      country: null,
      courseQty: 0,
      createdAt: null,
      currentlyWorking: false,
      degree: null,
      // departmentId: null,
      department: null,
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
      // profileId: null,
      profile: null,
      role: configObj.role,
      isActive: true,
      stripeId: null,
      uid: null,
      avgScore: 0,
      performance: null,
      ratingPoints: 0,
    })
  }

  public static fromJson(userJson: UserJson): User {
    return new User(
      userJson.birthdate,
      userJson.country,
      userJson.courseQty,
      userJson.createdAt,
      userJson.currentlyWorking,
      userJson.degree,
      // userJson.departmentId,
      userJson.department,
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
      // userJson.profileId,
      userJson.profile,
      userJson.role,
      userJson.isActive,
      userJson.stripeId,
      userJson.uid,
      userJson.avgScore,
      userJson.performance,
      userJson.ratingPoints,
    )
  }

  toJson(): UserJson {
    return {
      birthdate: this.birthdate,
      country: this.country,
      courseQty: this.courseQty,
      createdAt: this.createdAt,
      currentlyWorking: this.currentlyWorking,
      degree: this.degree,
      // departmentId: this.departmentId,
      department: this.department,
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
      // profileId: this.profileId,
      profile: this.profile,
      role: this.role,
      isActive: this.isActive,
      stripeId: this.stripeId,
      uid: this.uid,
      avgScore: this.avgScore,
      performance: this.performance,
      ratingPoints: this.ratingPoints,
    }
  }

}

export class oldUser {
  constructor(public name: string) {}
}
