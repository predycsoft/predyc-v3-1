import { DocumentReference } from "@angular/fire/compat/firestore"

export interface UserJson {
  birthdate: number | null
  country: string | null
  courseQty: number
  createdAt: number | null // timestamp
  currentlyWorking: boolean
  degree: string | null
  departmentId: string | null
  displayName: string | null
  email: string | null
  employer: string | null // This could be obtained from the enterprise ref
  enterpriseId: string | null
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
  profileId: string | null
  role: 'admin' | 'student'
  status: string
  stripeId: string | null
  uid: string | null
  avgScore: number
  performance: string | null
  ratingPoints: number
}

export class User {

  constructor(
    public birthdate: number | null,
    public country: string | null,
    public courseQty: number,
    public createdAt: number | null, // timestamp
    public currentlyWorking: boolean,
    public degree: string | null,
    public departmentId: string | null,
    // public department: DocumentReference | null,
    public displayName: string | null,
    public email: string | null,
    public employer: string | null, // This could be obtained from the enterprise ref
    public enterpriseId: string | null,
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
    public profileId: string | null,
    public role: 'admin' | 'student',
    public status: string,
    public stripeId: string | null,
    public uid: string | null,

    // metrics
    public avgScore: number,
    public performance: string | null,
    public ratingPoints: number,
  ) {}

  public static getEnterpriseAdminUser(enterpriseId: string, enterpriseName: string) {
    return User.getNewUser({
      isSystemUser: false,
      role: 'admin',
      enterpriseId: enterpriseId,
      employer: enterpriseName,
    })
  }

  public static getEnterpriseStudentUser(enterpriseId: string, enterpriseName: string) {
    return User.getNewUser({
      isSystemUser: false,
      role: 'student',
      enterpriseId: enterpriseId,
      employer: enterpriseName,
    })
  }

  public static getSystemAdminUser() {
    return User.getNewUser({
      isSystemUser: true,
      role: 'admin',
    })
  }

  public static getSystemStudentUser() {
    return User.getNewUser({
      isSystemUser: true,
      role: 'student',
    })
  }

  public static getStudentUser() {
    return User.getNewUser({
      isSystemUser: false,
      role: 'student',
    })
  }

  private static getNewUser(configObj: {
    isSystemUser: boolean,
    role: 'student' | 'admin',
    enterpriseId?: string,
    employer?: string
  }): User {
    return User.fromJson({
      birthdate: null,
      country: null,
      courseQty: 0,
      createdAt: null,
      currentlyWorking: false,
      degree: null,
      departmentId: null,
      displayName: null,
      email: null,
      employer: configObj.employer ? configObj.employer : null,
      enterpriseId: configObj.enterpriseId ? configObj.enterpriseId : null,
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
      profileId: null,
      role: configObj.role,
      status: 'inactive',
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
      userJson.departmentId,
      userJson.displayName,
      userJson.email,
      userJson.employer,
      userJson.enterpriseId,
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
      userJson.profileId,
      userJson.role,
      userJson.status,
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
      departmentId: this.departmentId,
      displayName: this.displayName,
      email: this.email,
      employer: this.employer,
      enterpriseId: this.enterpriseId,
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
      profileId: this.profileId,
      role: this.role,
      status: this.status,
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
