import { Injectable } from '@angular/core';
import { User } from '../shared/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private static testUser = new User(
    'venezuela', // country
    4, // courseQty
    1693923483279, // createdAt
    false, // currentlyWorking
    'Ingeniero', // degree
    'department1', // departmentId
    'Diego', // displayName
    'diegonegrette42@gmail.com', // email
    'Predyc', // employer
    'testEnterpriseId', // enterpriseId
    'man',  // gender
    true, // hasCollegeDegree
    'programming', // industry
    1693923483279, // lastConnection
    'PIND', // mailchimpTag
    'Diego', // name
    '+584148114453', // phoneNumber
    'testPhotoUrl', // photoUrl
    'testProfileId', // profileId
    'programming', // specialty
    'Active', // status
    'test_stripeId', // stripeId
    'testUid', // uid
    1987, // yearOfBirth
    87, // avgScore
    'High', // performance
    140 // ratingPoints
  )

  private static TEST_USERS: User[] = [
    new User(
      'venezuela', // country
      4, // courseQty
      1693923483279, // createdAt
      false, // currentlyWorking
      'Ingeniero', // degree
      'department1', // departmentId
      'Diego', // displayName
      'diegonegrette42@gmail.com', // email
      'Predyc', // employer
      'testEnterpriseId', // enterpriseId
      'man',  // gender
      true, // hasCollegeDegree
      'programming', // industry
      1693923483279, // lastConnection
      'PIND', // mailchimpTag
      'Diego', // name
      '+584148114453', // phoneNumber
      'testPhotoUrl', // photoUrl
      'testProfileId', // profileId
      'programming', // specialty
      'Active', // status
      'test_stripeId', // stripeId
      'testUid', // uid
      1987, // yearOfBirth
      87, // avgScore
      'High', // performance
      140 // ratingPoints
    ),
    new User(
      'venezuela', // country
      4, // courseQty
      1693923483279, // createdAt
      false, // currentlyWorking
      'Ingeniero', // degree
      'department2', // departmentId
      'Armando', // displayName
      'diegonegrette42@gmail.com', // email
      'Predyc', // employer
      'testEnterpriseId', // enterpriseId
      'man',  // gender
      true, // hasCollegeDegree
      'programming', // industry
      1693923483279, // lastConnection
      'PIND', // mailchimpTag
      'Armando', // name
      '+584148114453', // phoneNumber
      'testPhotoUrl', // photoUrl
      'testProfileId2', // profileId
      'programming', // specialty
      'Inactive', // status
      'test_stripeId', // stripeId
      'testUid', // uid
      1987, // yearOfBirth
      87, // avgScore
      'High', // performance
      140 // ratingPoints
    ),
    new User(
      'venezuela', // country
      4, // courseQty
      1693923483279, // createdAt
      false, // currentlyWorking
      'Ingeniero', // degree
      'department3', // departmentId
      'Carla', // displayName
      'diegonegrette42@gmail.com', // email
      'Predyc', // employer
      'testEnterpriseId', // enterpriseId
      'man',  // gender
      true, // hasCollegeDegree
      'programming', // industry
      1693923483279, // lastConnection
      'PIND', // mailchimpTag
      'Carla', // name
      '+584148114453', // phoneNumber
      'testPhotoUrl', // photoUrl
      'testProfileId3', // profileId
      'programming', // specialty
      'Active', // status
      'test_stripeId', // stripeId
      'testUid', // uid
      1987, // yearOfBirth
      87, // avgScore
      'High', // performance
      140 // ratingPoints
    ),
    new User(
      'venezuela', // country
      4, // courseQty
      1693923483279, // createdAt
      false, // currentlyWorking
      'Ingeniero', // degree
      'department4', // departmentId
      'Maria', // displayName
      'diegonegrette42@gmail.com', // email
      'Predyc', // employer
      'testEnterpriseId', // enterpriseId
      'man',  // gender
      true, // hasCollegeDegree
      'programming', // industry
      1693923483279, // lastConnection
      'PIND', // mailchimpTag
      'Maria', // name
      '+584148114453', // phoneNumber
      'testPhotoUrl', // photoUrl
      'testProfileId4', // profileId
      'programming', // specialty
      'Active', // status
      'test_stripeId', // stripeId
      'testUid', // uid
      1987, // yearOfBirth
      87, // avgScore
      'High', // performance
      140 // ratingPoints
    ),
    new User(
      'venezuela', // country
      4, // courseQty
      1693923483279, // createdAt
      false, // currentlyWorking
      'Ingeniero', // degree
      'department1', // departmentId
      'Diego', // displayName
      'diegonegrette42@gmail.com', // email
      'Predyc', // employer
      'testEnterpriseId', // enterpriseId
      'man',  // gender
      true, // hasCollegeDegree
      'programming', // industry
      1693923483279, // lastConnection
      'PIND', // mailchimpTag
      'Diego', // name
      '+584148114453', // phoneNumber
      'testPhotoUrl', // photoUrl
      'testProfileId', // profileId
      'programming', // specialty
      'Active', // status
      'test_stripeId', // stripeId
      'testUid', // uid
      1987, // yearOfBirth
      87, // avgScore
      'High', // performance
      140 // ratingPoints
    ),
    new User(
      'venezuela', // country
      4, // courseQty
      1693923483279, // createdAt
      false, // currentlyWorking
      'Ingeniero', // degree
      'department1', // departmentId
      'Diego', // displayName
      'diegonegrette42@gmail.com', // email
      'Predyc', // employer
      'testEnterpriseId', // enterpriseId
      'man',  // gender
      true, // hasCollegeDegree
      'programming', // industry
      1693923483279, // lastConnection
      'PIND', // mailchimpTag
      'Diego', // name
      '+584148114453', // phoneNumber
      'testPhotoUrl', // photoUrl
      'testProfileId', // profileId
      'programming', // specialty
      'Active', // status
      'test_stripeId', // stripeId
      'testUid', // uid
      1987, // yearOfBirth
      87, // avgScore
      'High', // performance
      140 // ratingPoints
    ),
  ]

  constructor() { }

  ngOnInit() {}

  getUsers() {
    return UserService.TEST_USERS
  }
}
