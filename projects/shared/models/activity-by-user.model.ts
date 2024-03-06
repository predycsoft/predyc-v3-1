import { User } from "./user.model";
import { Activity } from "./activity-classes.model";
import { DocumentReference } from "@angular/fire/compat/firestore"


export interface ActivityByUserJson {
    // attempts --> subcollection
    activity: DocumentReference<Activity>
    attemptsQty: number | null;
    averageScore: number | null;
    user: DocumentReference<User>;
}

export class ActivityByUser {
    activity: DocumentReference<Activity>
    attemptsQty: number | null;
    averageScore: number | null;
    user: DocumentReference<User>;

    public static collection = 'activity-by-user'

    public static fromJson(obj: ActivityByUserJson): ActivityByUser {
        let activityByUser = new ActivityByUser();
        activityByUser.activity = obj.activity;
        activityByUser.attemptsQty = obj.attemptsQty;
        activityByUser.averageScore = obj.averageScore;
        activityByUser.user = obj.user;
        return activityByUser
    }

    public toJson(): ActivityByUserJson {
        return {
            activity : this.activity,
            attemptsQty : this.attemptsQty,
            averageScore : this.averageScore,
            user : this.user,
        }
    }
}