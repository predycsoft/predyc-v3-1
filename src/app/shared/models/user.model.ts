// export interface User {
//   country: string,
//   courseQty: number,
//   createdAt: number, // timestamp
//   currentlyWorking: boolean,
//   degree: string,
//   departmentId: string,
//   displayName: string,
//   email: string,
//   employer: string,
//   enterpriseId: string,
//   gender: string,
//   hasCollegeDegree: boolean,
//   industry: string, // Required?
//   lastConnection: number, // timestamp
//   mailchimpTag: string,
//   name: string,
//   phoneNumber: string,
//   photoUrl: string,
//   profileId: string,
//   specialty: string, // related to job
//   status: string,
//   stripeId: string,
//   uid: string,
//   yearOfBirth: number,
//   avgScore: number,
//   performance: string,
//   ratingPoints: number,
// }

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
    public lastConnection: number, // timestamp
    public mailchimpTag: string,
    public name: string,
    public phoneNumber: string,
    public photoUrl: string,
    public profileId: string,
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
}

export class oldUser {
  constructor(public name: string) {}
}
