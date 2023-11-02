export interface PermissionsJson {
    hoursPerWeek: number,
    studyLiberty: string,
    studyplanGeneration: string,
    attemptsPerTest: number,

}

export class Permissions {

    public static STUDY_LIBERTY_FREE_OPTION = 'Libre'
    public static STUDY_LIBERTY_STRICT_OPTION = 'Estricto'
    public static STUDY_LIBERTY_REQUESTS_OPTION = 'Solicitudes'
    public static STUDY_LIBERTY_OPTIONS = [
        this.STUDY_LIBERTY_FREE_OPTION,
        this.STUDY_LIBERTY_STRICT_OPTION,
        this.STUDY_LIBERTY_REQUESTS_OPTION
    ]

    public static STUDYPLAN_GENERATION_OPTIMIZED_OPTION = 'Optimizada'
    public static STUDYPLAN_GENERATION_CONFIRMED_OPTION = 'Confirmar'
    public static STUDYPLAN_GENERATION_DEFAULT_OPTION = 'Por defecto'
    public static STUDYPLAN_GENERATION_OPTIONS = [
        this.STUDYPLAN_GENERATION_OPTIMIZED_OPTION,
        this.STUDYPLAN_GENERATION_CONFIRMED_OPTION,
        this.STUDYPLAN_GENERATION_DEFAULT_OPTION
    ]

    public static STUDY_LIBERTY_NUMBER_OPTS = {
        [Permissions.STUDY_LIBERTY_FREE_OPTION]: 1,
        [Permissions.STUDY_LIBERTY_STRICT_OPTION]: 2,
        [Permissions.STUDY_LIBERTY_REQUESTS_OPTION]: 3,
    };

    public static STUDYPLAN_GENERATION_NUMBER_OPTS = {
        [Permissions.STUDYPLAN_GENERATION_OPTIMIZED_OPTION]: 1,
        [Permissions.STUDYPLAN_GENERATION_CONFIRMED_OPTION]: 2,
        [Permissions.STUDYPLAN_GENERATION_DEFAULT_OPTION]: 3,
    };

    

    public hoursPerWeek: number = 1;
    public studyLiberty: typeof Permissions.STUDY_LIBERTY_OPTIONS[number] = Permissions.STUDY_LIBERTY_FREE_OPTION;
    public studyplanGeneration: typeof Permissions.STUDYPLAN_GENERATION_OPTIONS[number] = Permissions.STUDYPLAN_GENERATION_OPTIMIZED_OPTION;
    public attemptsPerTest: number = 5;

}