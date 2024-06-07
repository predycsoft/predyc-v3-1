import { DocumentReference } from "@angular/fire/compat/firestore"
import { Enterprise } from "./enterprise.model";
import { Clase } from "./course-class.model";
import { Curso } from "./course.model";
import { Profile } from "./profile.model";
import { compareByString } from "../utils";
import { Skill } from "./skill.model";
import { LiveCourse, LiveCourseTemplate } from "./live-course.model";

export interface QuestionOptionJson {
  text: string;
  isCorrect: boolean;
  placeholder?: string;
}

export class QuestionOption {
  text: string;
  isCorrect: boolean;
  placeholder?: string;
  public static fromJson(obj: QuestionOptionJson): QuestionOption {
    let questionOption = new QuestionOption();
    questionOption.text = obj.text;
    questionOption.isCorrect = obj.isCorrect;
    if (obj.placeholder) {
      questionOption.placeholder = obj.placeholder;
    }
    return questionOption;
  }
}

// export interface QuestionValidationResponse {
//   result: boolean;
//   messages: string[];
// }

// const isValidFormTypeTrueOrFalse = (
//   question: Question
// ): QuestionValidationResponse => {
//   let isValidForm: boolean = true;
//   let messages: string[] = [];
//   if (!question.text) {
//     messages.push('La pregunta no puede estar vacia');
//     isValidForm = false;
//   }
//   if (!question.points || question.points <= 0) {
//     messages.push('La pregunta debe tener un puntaje positivo');
//     isValidForm = false;
//   }
//   if (!question.options || question.options.length === 0) {
//     messages.push('Debe agregar alguna opción a la pregunta');
//     isValidForm = false;
//   }
//   if (question.options.length > 0) {
//     const emptyTextOptions = question.options.filter((option) => {
//       if (!option.text) {
//         return true;
//       }
//       return false;
//     });
//     if (emptyTextOptions.length > 0) {
//       messages.push('Todas las opciones deben tener texto');
//       isValidForm = false;
//     }
//     const hasCorrectOption = question.options.filter(
//       (option) => option.isCorrect
//     );
//     if (hasCorrectOption.length < 1) {
//       messages.push('Se debe marcar una o mas opciones como correctas');
//       isValidForm = false;
//     }
//   }
//   return { result: isValidForm, messages: messages };
// };

// const isValidFormTypeComplete = (
//   question: Question
// ): QuestionValidationResponse => {
//   let isValidForm: boolean = true;
//   let messages: string[] = [];
//   if (!question.points || question.points <= 0) {
//     messages.push('La pregunta debe tener un puntaje positivo');
//     isValidForm = false;
//   }
//   if (!question.text) {
//     messages.push('La pregunta no puede estar vacia');
//     isValidForm = false;
//   }
//   let placeholders: string[] = [];
//   if (question.text) {
//     // let matches = question.text.matchAll(/\[([^\[\]]*)\]/g);
//     // for (let match of matches) {
//     //   placeholders.push(match[1]);
//     // }
//     placeholders = question.getPlaceholders();
//   }
//   if (placeholders.length === 0) {
//     messages.push('El texto debe contener al menos un placeholder');
//   }
//   if (!question.options || question.options.length === 0) {
//     messages.push('Debe agregar alguna opción a la pregunta');
//     isValidForm = false;
//   }
//   if (question.options.length > 0) {
//     const emptyTextOptions = question.options.filter((option) => {
//       if (!option.text) {
//         return true;
//       }
//       return false;
//     });
//     if (emptyTextOptions.length > 0) {
//       messages.push('Todas las opciones deben tener texto');
//       isValidForm = false;
//     }
//     question.options.filter((option) => option.isCorrect);
//     const hasCorrectOption = question.options.filter(
//       (option) => option.isCorrect
//     );
//     if (hasCorrectOption.length != placeholders.length) {
//       messages.push(
//         'Cada marcador de referencia debe contar con una opción correcta'
//       );
//       isValidForm = false;
//     }
//   }
//   return { result: isValidForm, messages: messages };
// };

// const isValidFormTypeMultipleChoice = (
//   question: Question
// ): QuestionValidationResponse => {
//   let isValidForm: boolean = true;
//   let messages: string[] = [];
//   if (!question.text) {
//     messages.push('La pregunta no puede estar vacia');
//     isValidForm = false;
//   }
//   if (!question.points || question.points <= 0) {
//     messages.push('La pregunta debe tener un puntaje positivo');
//     isValidForm = false;
//   }
//   if (!question.options || question.options.length === 0) {
//     messages.push('Debe agregar alguna opción a la pregunta');
//     isValidForm = false;
//   }
//   if (question.options.length > 0) {
//     const emptyTextOptions = question.options.filter((option) => {
//       if (!option.text) {
//         return true;
//       }
//       return false;
//     });
//     if (emptyTextOptions.length > 0) {
//       messages.push('Todas las opciones deben tener texto');
//       isValidForm = false;
//     }
//     const hasCorrectOption = question.options.filter(
//       (option) => option.isCorrect
//     );
//     if (hasCorrectOption.length < 1) {
//       messages.push('Se debe marcar una o mas opciones como correctas');
//       isValidForm = false;
//     }
//   }
//   return { result: isValidForm, messages: messages };
// };

// const isValidFormTypeSingleChoice = (
//   question: Question
// ): QuestionValidationResponse => {
//   let isValidForm: boolean = true;
//   let messages: string[] = [];
//   if (!question.text) {
//     messages.push('La pregunta no puede estar vacia');
//     isValidForm = false;
//   }
//   if (!question.points || question.points <= 0) {
//     messages.push('La pregunta debe tener un puntaje positivo');
//     isValidForm = false;
//   }
//   if (!question.options || question.options.length === 0) {
//     messages.push('Debe agregar alguna opción a la pregunta');
//     isValidForm = false;
//   }
//   if (question.options.length > 0) {
//     const emptyTextOptions = question.options.filter((option) => {
//       if (!option.text) {
//         return true;
//       }
//       return false;
//     });
//     if (emptyTextOptions.length > 0) {
//       messages.push('Todas las opciones deben tener texto');
//       isValidForm = false;
//     }
//     const hasCorrectOption = question.options.filter(
//       (option) => option.isCorrect
//     );
//     if (hasCorrectOption.length !== 1) {
//       messages.push('Se debe marcar una sola opción como correcta');
//       isValidForm = false;
//     }
//   }
//   console.log(question);
//   return { result: isValidForm, messages: messages };
// };

// export interface QuestionTypeJson {
//   value: string;
//   displayName: string;
//   tooltipInfo: string;
//   createInstructions: string;
//   solveInstructions: string;
// }

export class QuestionType {
  value: string;
  displayName: string;
  tooltipInfo: string;
  createInstructions: string;
  solveInstructions: string;

  public static TYPE_CALCULATED_VALUE: string = 'calculated';
  public static TYPE_MATCHING_VALUE: string = 'matching';
  public static TYPE_NUMERIC_VALUE: string = 'numeric';
  public static TYPE_MULTIPLE_CHOICE_VALUE: string = 'multiple_choice';
  public static TYPE_SINGLE_CHOICE_VALUE: string = 'single_choice';
  public static TYPE_SHORT_ANSWER_VALUE: string = 'short-answer';
  public static TYPE_COMPLETE_VALUE: string = 'complete';
  public static TYPE_TRUE_OR_FALSE_VALUE: string = 'true-false';
  public static TYPE_CALCULATED_DISPLAY_NAME: string = 'Calculado';
  public static TYPE_MATCHING_DISPLAY_NAME: string = 'Emparejamiento';
  public static TYPE_NUMERIC_DISPLAY_NAME: string = 'Numerico';
  public static TYPE_MULTIPLE_CHOICE_DISPLAY_NAME: string = 'Opción Múltiple';
  public static TYPE_SINGLE_CHOICE_DISPLAY_NAME: string = 'Opción Simple';
  public static TYPE_SHORT_ANSWER_DISPLAY_NAME: string = 'Respuesta Corta';
  public static TYPE_COMPLETE_DISPLAY_NAME: string = 'Completar';
  public static TYPE_TRUE_OR_FALSE_DISPLAY_NAME: string = 'Verdadero o Falso';

  // public static fromJson(obj: QuestionTypeJson): QuestionType {
  //   let questionType = new QuestionType();
  //   questionType.value = obj.value;
  //   questionType.displayName = obj.displayName;
  //   questionType.tooltipInfo = obj.tooltipInfo;
  //   questionType.createInstructions = obj.createInstructions;
  //   questionType.solveInstructions = obj.solveInstructions;
  //   return questionType;
  // }

  public static FORM_VALIDATION_METHODS = [
    // {
    //   value: QuestionType.TYPE_CALCULATED_VALUE,
    //   method: isValidFormDummy,
    // },
    // {
    //   value: QuestionType.TYPE_NUMERIC_VALUE,
    //   method: isValidFormDummy,
    // },
    // {
    //   value: QuestionType.TYPE_MATCHING_VALUE,
    //   method: isValidFormDummy,
    // },
    // {
    //   value: QuestionType.TYPE_SHORT_ANSWER_VALUE,
    //   method: isValidFormDummy,
    // },
    // {
    //   value: QuestionType.TYPE_MULTIPLE_CHOICE_VALUE,
    //   method: isValidFormTypeMultipleChoice,
    // },
    // {
    //   value: QuestionType.TYPE_SINGLE_CHOICE_VALUE,
    //   method: isValidFormTypeSingleChoice,
    // },
    // {
    //   value: QuestionType.TYPE_COMPLETE_VALUE,
    //   method: isValidFormTypeComplete,
    // },
    // {
    //   value: QuestionType.TYPE_TRUE_OR_FALSE_VALUE,
    //   method: isValidFormTypeTrueOrFalse,
    // },
  ];

  public static TYPES: Array<QuestionType> = [
    // {
    //   value: QuestionType.TYPE_CALCULATED_VALUE,
    //   displayName: QuestionType.TYPE_CALCULATED_DISPLAY_NAME,
    //   tooltipInfo: 'Configure una pregunta cuyo resultado sea un valor decimal',
    // },
    // {
    //   value: QuestionType.TYPE_MATCHING_VALUE,
    //   displayName: QuestionType.TYPE_MATCHING_DISPLAY_NAME,
    //   tooltipInfo: 'Configure una serie de pares opciones-respuesta correcta para una pregunta - cada opción debe ser emparejada con una única respuesta',
    // },
    // {
    //   value: QuestionType.TYPE_NUMERIC_VALUE,
    //   displayName: QuestionType.TYPE_NUMERIC_DISPLAY_NAME,
    //   tooltipInfo: 'Configure una pregunta cuya respuesta sea un valor numérico entero',
    // },
    // {
    //   value: QuestionType.TYPE_SHORT_ANSWER_VALUE,
    //   displayName: QuestionType.TYPE_SHORT_ANSWER_DISPLAY_NAME,
    //   tooltipInfo: 'Configure una pregunta cuya respuesta sea una frase corta',
    // },
    {
      value: QuestionType.TYPE_MULTIPLE_CHOICE_VALUE,
      displayName: QuestionType.TYPE_MULTIPLE_CHOICE_DISPLAY_NAME,
      tooltipInfo:
        'Configure una serie de opciones para una pregunta - una o mas respuestas pueden ser correctas',
      createInstructions: '',
      solveInstructions:
        'Seleccione una o mas opciones como correctas del listado de opciones',
    },
    {
      value: QuestionType.TYPE_SINGLE_CHOICE_VALUE,
      displayName: QuestionType.TYPE_SINGLE_CHOICE_DISPLAY_NAME,
      tooltipInfo:
        'Configure una serie de opciones para una pregunta - solo una respuesta puede ser correcta',
      createInstructions: '',
      solveInstructions:
        'Seleccione la opción correcta del listado de opciones',
    },
    {
      value: QuestionType.TYPE_COMPLETE_VALUE,
      displayName: QuestionType.TYPE_COMPLETE_DISPLAY_NAME,
      tooltipInfo:
        'Configure una pregunta cuyo texto pueda ser completado a partir de las opciones provistas para cada marcador de referencia - cada marcador debe tener una única respuesta correcta',
      createInstructions:
        'Ingrese cada marcador como una palabra de referencia encerrada entre corchetes ([]).<br/>Ejemplo: El presidente [nombreDelPresidente] nacio en [paisDeNacimiento]',
      solveInstructions:
        'Complete el texto utilizando los selectores proporcionados para dar sentido a la frase',
    },
    {
      value: QuestionType.TYPE_TRUE_OR_FALSE_VALUE,
      displayName: QuestionType.TYPE_TRUE_OR_FALSE_DISPLAY_NAME,
      tooltipInfo:
        'Configure una pregunta cuya respuesta sea verdadero o falso',
      createInstructions:
        'Marque las opciones que sean verdaderas y deje en blanco las que sean falsas',
      solveInstructions:
        'Clasifique las siguientes afirmaciones como verdadera o falsa',
    },
    
  ];

  public static TYPES_TOOLTIP_INFO = (): string => {
    let typesTooltipInfo: string = '';
    for (const type of QuestionType.TYPES) {
      typesTooltipInfo += `<strong>${type.displayName}</strong>:<br/>${type.tooltipInfo}<br/><br/>`;
    }
    return typesTooltipInfo;
  };
}

export interface QuestionJson {
  id: string | null;
  text: string;
  type: typeof Question.TYPE_CALCULATED |
        typeof Question.TYPE_MATCHING |
        typeof Question.TYPE_NUMERIC |
        typeof Question.TYPE_MULTIPLE_CHOICE |
        typeof Question.TYPE_SINGLE_CHOICE |
        typeof Question.TYPE_SHORT_ANSWER |
        typeof Question.TYPE_COMPLETE |
        typeof Question.TYPE_TRUE_OR_FALSE
  image?: string;
  options: QuestionOptionJson[];
  points: number;
  skillsRef: DocumentReference<Skill>[]
  explanation:string
  classId: string;

}

export class Question {

  public static collection = 'question'
  
  public static TYPE_CALCULATED: string = 'calculated';
  public static TYPE_MATCHING: string = 'matching';
  public static TYPE_NUMERIC: string = 'numeric';
  public static TYPE_MULTIPLE_CHOICE: string = 'multiple_choice';
  public static TYPE_SINGLE_CHOICE: string = 'single_choice';
  public static TYPE_SHORT_ANSWER: string = 'short-answer';
  public static TYPE_COMPLETE: string = 'complete';
  public static TYPE_TRUE_OR_FALSE: string = 'true-false';

  public static TYPES: string[] = [
    Question.TYPE_MULTIPLE_CHOICE,
    Question.TYPE_SINGLE_CHOICE,
    Question.TYPE_COMPLETE,
    Question.TYPE_TRUE_OR_FALSE
  ]

  // public static typeToDisplayNameDict = {
  //   [Question.TYPE_CALCULATED]: 'Calculado',
  //   [Question.TYPE_MATCHING]: 'Emparejamiento',
  //   [Question.TYPE_NUMERIC]: 'Numerico',
  //   [Question.TYPE_MULTIPLE_CHOICE]: 'Opción Múltiple',
  //   [Question.TYPE_SINGLE_CHOICE]: 'Opción Simple',
  //   [Question.TYPE_SHORT_ANSWER]: 'Respuesta Corta',
  //   [Question.TYPE_COMPLETE]: 'Completar',
  //   [Question.TYPE_TRUE_OR_FALSE]: 'Verdadero o Falso',
  // }

  public static typeToInfoDict = {
    [Question.TYPE_MULTIPLE_CHOICE]: {
      value: Question.TYPE_MULTIPLE_CHOICE,
      displayName: 'Opción Múltiple',
      tooltipInfo:
        'Configure una serie de opciones para una pregunta - una o mas respuestas pueden ser correctas',
      createInstructions: '',
      solveInstructions:
        'Seleccione una o mas opciones como correctas del listado de opciones',
    },
    [Question.TYPE_SINGLE_CHOICE]: {
      value: Question.TYPE_SINGLE_CHOICE,
      displayName: 'Opción Simple',
      tooltipInfo:
        'Configure una serie de opciones para una pregunta - solo una respuesta puede ser correcta',
      createInstructions: '',
      solveInstructions:
        'Seleccione la opción correcta del listado de opciones',
    },
    [Question.TYPE_COMPLETE]: {
      value: Question.TYPE_COMPLETE,
      displayName: 'Completar',
      tooltipInfo:
        'Configure una pregunta cuyo texto pueda ser completado a partir de las opciones provistas para cada marcador de referencia - cada marcador debe tener una única respuesta correcta',
      createInstructions:
        'Ingrese cada marcador como una palabra de referencia encerrada entre corchetes ([]).<br/>Ejemplo: El presidente [nombreDelPresidente] nacio en [paisDeNacimiento]',
      solveInstructions:
        'Complete el texto utilizando los selectores proporcionados para dar sentido a la frase',
    },
    [Question.TYPE_TRUE_OR_FALSE]: {
      value: Question.TYPE_TRUE_OR_FALSE,
      displayName: 'Verdadero o Falso',
      tooltipInfo:
        'Configure una pregunta cuya respuesta sea verdadero o falso',
      createInstructions:
        'Marque las opciones que sean verdaderas y deje en blanco las que sean falsas',
      solveInstructions:
        'Clasifique las siguientes afirmaciones como verdadera o falsa',
    }
  }

  // public static TYPES_DISPLAY_NAME = Question.TYPES.map(type => Question.typeToDisplayNameDict[type])
  public static TYPES_INFO = Question.TYPES.map(type => {
    return Question.typeToInfoDict[type]
  }).sort((a, b) => compareByString(a.displayName, b.displayName))

  id: string = '';
  text: string = '';
  explanation: string = '';
  type: typeof Question.TYPE_CALCULATED |
        typeof Question.TYPE_MATCHING |
        typeof Question.TYPE_NUMERIC |
        typeof Question.TYPE_MULTIPLE_CHOICE |
        typeof Question.TYPE_SINGLE_CHOICE |
        typeof Question.TYPE_SHORT_ANSWER |
        typeof Question.TYPE_COMPLETE |
        typeof Question.TYPE_TRUE_OR_FALSE
  image?: string = '';
  options: QuestionOption[] = [];
  points: number = 0;
  skillsRef: DocumentReference<Skill>[] = [];
  classId: string;
  
  public static fromJson(obj: QuestionJson): Question {
    let question = new Question();
    question.id = obj.id;
    question.text = obj.text;
    question.explanation = obj.explanation;
    question.type = obj.type;
    question.image = obj.image;
    question.classId = obj.classId;
    question.points = obj.points;
    for (const option of obj.options) {
      const newOption = QuestionOption.fromJson(option);
      question.options = [...question.options, newOption];
    }
    question.skillsRef = obj.skillsRef
    return question;
  }

  // isValidForm(): QuestionValidationResponse {
  //   const formValidationMethod = QuestionType.FORM_VALIDATION_METHODS.find(
  //     (questionType) => this.type.value === questionType.value
  //   ).method;
  //   return formValidationMethod(this);
  // }

  // getDisplayText(): string {
  //   let displayText = this.text;
  //   const placeholders = this.getPlaceholders();
  //   for (const placeholder of placeholders) {
  //     const options = this.options.filter(
  //       (question) => question.placeholder == placeholder
  //     );
  //     let optionsHtml =
  //       '<option disabled selected value> -- Selecciona una opcion -- </option>';
  //     for (const option of options) {
  //       optionsHtml += `<option value="${option.text}">${option.text}</option>`;
  //     }
  //     const placeholderHtml = `<select class="">${optionsHtml}</select>`;
  //     displayText = displayText.replace(`[${placeholder}]`, placeholderHtml);
  //   }
  //   return displayText;
  // }

  // getPlaceholders(): string[] {
  //   let placeholders = [];
  //   let matches = this.text.matchAll(/\[([^\[\]]*)\]/g);
  //   for (let match of matches) {
  //     placeholders.push(match[1]);
  //   }
  //   return placeholders;
  // }

  // getOptionsForPlaceholder(placeholder: string): QuestionOption[] {
  //   return this.options.filter((option) => option.placeholder == placeholder);
  // }

}

// export interface AnswerItem {
//   text: string;
//   isCorrect: boolean;
//   answer: boolean;
//   placeholder: string;
// }

// export interface Answer {
//   type: QuestionType;
//   points: number;
//   answerItems: AnswerItem[];
// }

// export interface questionPoints {
//   collectedPoints: number;
//   expectedPoints: number;
// }

// export interface ActivityScores {
//   activityPoints: questionPoints[];
//   collectedPoints: number;
//   expectedPoints: number;
//   finalScore: number;
// }

// export class ActivityResult {
//   answers: Answer[] = [];
// }

export interface ActivityJson {
  questions: any[];
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  // questions: Array<QuestionJson>;
  type: typeof Activity.TYPE_REGULAR |
        typeof Activity.TYPE_TEST |
        typeof Activity.TYPE_SKILL_TEST;
  description: string;
  duration: number;
  instructions: string | null;
  claseRef: DocumentReference<Clase>;
  enterpriseRef: DocumentReference<Enterprise>;
  coursesRef: DocumentReference<Curso | LiveCourseTemplate | LiveCourse>[];
  profileRef: DocumentReference<Profile>;
  files: any[];
  autoGenerated: boolean;
  skillsRef: DocumentReference<Skill>[];
  vimeoId1: number | null;
  vimeoId2: string | null;
  activityTakersQty: number;
  activityCorazon: boolean;
}

export class Activity {

  public static collection = 'activity'
  public static questionSubCollection = 'question'

  public static TYPE_HEARTS: string = 'corazon'
  public static TYPE_REGULAR: string = 'regular'
  public static TYPE_TEST: string = 'test'
  public static TYPE_TEST_CERTIFICATIONS: string = 'testCertification'
  public static TYPE_SKILL_TEST: string = 'skill-test'
  
  id: string = '';
  title: string = '';
  createdAt: number = +new Date();
  updatedAt: number = +new Date();
  // questions: Array<Question> = [];
  type: typeof Activity.TYPE_REGULAR |
        typeof Activity.TYPE_TEST |
        typeof Activity.TYPE_SKILL_TEST;
  description: string = '';
  duration: number = 0;
  instructions: string | null = null;
  claseRef: DocumentReference<Clase> = null;
  enterpriseRef: DocumentReference<Enterprise> = null;
  coursesRef: DocumentReference<Curso | LiveCourseTemplate | LiveCourse>[] = [];
  profileRef: DocumentReference<Profile> = null;
  files: any[] = [];
  skillsRef: DocumentReference<Skill>[] = []
  vimeoId1: number | null = null
  vimeoId2: string | null = null
  activityTakersQty: number = 0
  activityCorazon: boolean = false
  autoGenerated: boolean = false
  questions: any[] = [];

  public toJson(): ActivityJson {
    return {
      id:this.id,
      title:this.title,
      createdAt:this.createdAt,
      updatedAt:this.updatedAt,
      // questions:this.questions,
      type:this.type,
      autoGenerated:this.autoGenerated,
      description:this.description,
      duration:this.duration,
      instructions:this.instructions,
      claseRef: this.claseRef,
      enterpriseRef:this.enterpriseRef,
      coursesRef:this.coursesRef,
      profileRef:this.profileRef,
      files: this.files,
      skillsRef: this.skillsRef,
      vimeoId1: this.vimeoId1,
      vimeoId2: this.vimeoId2,
      activityTakersQty: this.activityTakersQty,
      activityCorazon : this.activityCorazon,
      questions:this.questions
    }
  }

  public static fromJson(obj: ActivityJson): Activity {
    let activity = new Activity();
    activity.id = obj.id
    activity.title = obj.title
    activity.createdAt = obj.createdAt
    activity.updatedAt = obj.updatedAt
    activity.type = obj.type
    activity.description = obj.description
    activity.duration = obj.duration
    activity.instructions = obj.instructions
    activity.claseRef = obj.claseRef
    activity.enterpriseRef = obj.enterpriseRef
    activity.coursesRef = obj.coursesRef
    activity.profileRef = obj.profileRef
    activity.files = obj.files
    activity.skillsRef = obj.skillsRef
    activity.vimeoId1 = obj.vimeoId1
    activity.vimeoId2 = obj.vimeoId2
    activity.activityTakersQty = obj.activityTakersQty
    activity.activityCorazon = obj.activityCorazon
    activity.questions = obj.questions
    // for (const question of obj.questions) {
    //   const newQuestion = Question.fromJson(question);
    //   activity.questions = [...activity.questions, newQuestion];
    // }
    return activity;
  }

  public static createSkillTest(skillTestObj: {
    title: string,
    questions: QuestionJson[],
    description: string,
    duration: number,
    enterpriseRef: DocumentReference<Enterprise>,
    skillsRef: DocumentReference<Skill>[]
  }): Activity {
    return Activity.fromJson({
      id: null,
      title: skillTestObj.title,
      // questions: skillTestObj.questions,
      createdAt: +new Date(),
      updatedAt: +new Date(),
      type: Activity.TYPE_SKILL_TEST,
      description: skillTestObj.description,
      duration: skillTestObj.duration,
      instructions: null,
      claseRef: null,
      enterpriseRef: skillTestObj.enterpriseRef,
      coursesRef: null,
      profileRef: null,
      files: null,
      skillsRef: skillTestObj.skillsRef,
      vimeoId1: null,
      vimeoId2: null,
      activityTakersQty: 0,
      activityCorazon:false,
      questions:[],
      autoGenerated:false
    })
  }
}