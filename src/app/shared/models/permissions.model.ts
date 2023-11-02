export interface PermissionsJson {
    hoursPerWeek: number,
    studyLiberty: string,
    studyplanGeneration: string,
    attemptsPerTest: number,

}

export class Permissions {
    public hoursPerWeek: number;
    public studyLiberty: string;
    public studyplanGeneration: string;
    public attemptsPerTest: number;

}