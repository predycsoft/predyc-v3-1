export interface UserJson {
  country: string
  courseQty: number
  createdAt: number // timestamp
  currentlyWorking: boolean
  degree: string
  departmentId: string
  displayName: string
  email: string
  employer: string
  enterpriseId: string
  gender: string
  hasCollegeDegree: boolean
  industry: string // Required
  isSystemUser: string
  lastConnection: number // timestamp
  mailchimpTag: string
  name: string
  phoneNumber: string
  photoUrl: string
  profileId: string
  role: 'admin' | 'student'
  specialty: string // related to job
  status: string
  stripeId: string
  uid: string
  yearOfBirth: number
  avgScore: number
  performance: string
  ratingPoints: number
}

export class User {

  constructor(
    public country: string,
    public courseQty: number,
    public createdAt: number, // timestamp
    public currentlyWorking: boolean,
    public degree: string,
    public departmentId: string,
    public displayName: string,
    public email: string,
    public employer: string,
    public enterpriseId: string,
    public gender: string,
    public hasCollegeDegree: boolean,
    public industry: string, // Required?
    public isSystemUser: string,
    public lastConnection: number, // timestamp
    public mailchimpTag: string,
    public name: string,
    public phoneNumber: string,
    public photoUrl: string,
    public profileId: string,
    public role: 'admin' | 'student',
    public specialty: string, // related to job
    public status: string,
    public stripeId: string,
    public uid: string,
    public yearOfBirth: number,

    // metrics
    public avgScore: number,
    public performance: string,
    public ratingPoints: number,
  ) {}

  public static getDefaultUser() {
    return 
  }

  public static fromJson(userJson: UserJson): User {
    return new User(
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
      userJson.gender,
      userJson.hasCollegeDegree,
      userJson.industry,
      userJson.isSystemUser,
      userJson.lastConnection,
      userJson.mailchimpTag,
      userJson.name,
      userJson.phoneNumber,
      userJson.photoUrl,
      userJson.profileId,
      userJson.role,
      userJson.specialty,
      userJson.status,
      userJson.stripeId,
      userJson.uid,
      userJson.yearOfBirth,
      userJson.avgScore,
      userJson.performance,
      userJson.ratingPoints,
    )
  }

  toJson(): UserJson {
    return {
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
      gender: this.gender,
      hasCollegeDegree: this.hasCollegeDegree,
      industry: this.industry,
      isSystemUser: this.isSystemUser,
      lastConnection: this.lastConnection,
      mailchimpTag: this.mailchimpTag,
      name: this.name,
      phoneNumber: this.phoneNumber,
      photoUrl: this.photoUrl,
      profileId: this.profileId,
      role: this.role,
      specialty: this.specialty,
      status: this.status,
      stripeId: this.stripeId,
      uid: this.uid,
      yearOfBirth: this.yearOfBirth,
      avgScore: this.avgScore,
      performance: this.performance,
      ratingPoints: this.ratingPoints,
    }
  }

}

export class oldUser {
  constructor(public name: string) {}
}
