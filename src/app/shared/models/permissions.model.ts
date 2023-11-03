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

    // Opciones de Horas por semana e Intentos por examen en Permisos generales
    public static OPTION_BASIC = 'Básico'
    public static OPTION_AVERAGE = 'Promedio'
    public static OPTION_STANDARD = 'Estándar'
    public static OPTION_STRICT = 'Estricto'
    // Funcion para mostrar el texto correspondiente al valor numerico de Horas por semana e Intentos por examen en Permisos generales
    public static mapNumberOptions(option: number, field: string): string {
        const hourBasicCase = [1, 2, 3]
        const hourStandardCase = [6, 7, 8]
    
        const attemptStrictCase = 1
        const attemptBasicCase = 2
    
        const hourValue = hourBasicCase.includes(option) ? this.OPTION_BASIC 
                          : hourStandardCase.includes(option) ? this.OPTION_STANDARD 
                          : this.OPTION_AVERAGE
        const attemptValue = option === attemptStrictCase ? this.OPTION_STRICT 
                          : option === attemptBasicCase ? this.OPTION_BASIC 
                          : this.OPTION_AVERAGE
    
        return field === "hoursPerWeek" ? hourValue : attemptValue
      }

}