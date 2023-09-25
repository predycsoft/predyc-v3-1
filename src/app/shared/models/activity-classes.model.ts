import { DocumentReference } from "@angular/fire/compat/firestore"

export const compareByString = (a: string, b: string): number => {
  if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  } else {
    return 0;
  }
};

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

export interface QuestionValidationResponse {
  result: boolean;
  messages: string[];
}

const isValidFormDummy = (_: Question): QuestionValidationResponse => {
  return { result: true, messages: [] };
};

const isValidFormTypeTrueOrFalse = (
  question: Question
): QuestionValidationResponse => {
  let isValidForm: boolean = true;
  let messages: string[] = [];
  if (!question.text) {
    messages.push('La pregunta no puede estar vacia');
    isValidForm = false;
  }
  if (!question.points || question.points <= 0) {
    messages.push('La pregunta debe tener un puntaje positivo');
    isValidForm = false;
  }
  if (!question.options || question.options.length === 0) {
    messages.push('Debe agregar alguna opción a la pregunta');
    isValidForm = false;
  }
  if (question.options.length > 0) {
    const emptyTextOptions = question.options.filter((option) => {
      if (!option.text) {
        return true;
      }
      return false;
    });
    if (emptyTextOptions.length > 0) {
      messages.push('Todas las opciones deben tener texto');
      isValidForm = false;
    }
    const hasCorrectOption = question.options.filter(
      (option) => option.isCorrect
    );
    if (hasCorrectOption.length < 1) {
      messages.push('Se debe marcar una o mas opciones como correctas');
      isValidForm = false;
    }
  }
  return { result: isValidForm, messages: messages };
};

const isValidFormTypeComplete = (
  question: Question
): QuestionValidationResponse => {
  let isValidForm: boolean = true;
  let messages: string[] = [];
  if (!question.points || question.points <= 0) {
    messages.push('La pregunta debe tener un puntaje positivo');
    isValidForm = false;
  }
  if (!question.text) {
    messages.push('La pregunta no puede estar vacia');
    isValidForm = false;
  }
  let placeholders: string[] = [];
  if (question.text) {
    // let matches = question.text.matchAll(/\[([^\[\]]*)\]/g);
    // for (let match of matches) {
    //   placeholders.push(match[1]);
    // }
    placeholders = question.getPlaceholders();
  }
  if (placeholders.length === 0) {
    messages.push('El texto debe contener al menos un placeholder');
  }
  if (!question.options || question.options.length === 0) {
    messages.push('Debe agregar alguna opción a la pregunta');
    isValidForm = false;
  }
  if (question.options.length > 0) {
    const emptyTextOptions = question.options.filter((option) => {
      if (!option.text) {
        return true;
      }
      return false;
    });
    if (emptyTextOptions.length > 0) {
      messages.push('Todas las opciones deben tener texto');
      isValidForm = false;
    }
    question.options.filter((option) => option.isCorrect);
    const hasCorrectOption = question.options.filter(
      (option) => option.isCorrect
    );
    if (hasCorrectOption.length != placeholders.length) {
      messages.push(
        'Cada marcador de referencia debe contar con una opción correcta'
      );
      isValidForm = false;
    }
  }
  return { result: isValidForm, messages: messages };
};

const isValidFormTypeMultipleChoice = (
  question: Question
): QuestionValidationResponse => {
  let isValidForm: boolean = true;
  let messages: string[] = [];
  if (!question.text) {
    messages.push('La pregunta no puede estar vacia');
    isValidForm = false;
  }
  if (!question.points || question.points <= 0) {
    messages.push('La pregunta debe tener un puntaje positivo');
    isValidForm = false;
  }
  if (!question.options || question.options.length === 0) {
    messages.push('Debe agregar alguna opción a la pregunta');
    isValidForm = false;
  }
  if (question.options.length > 0) {
    const emptyTextOptions = question.options.filter((option) => {
      if (!option.text) {
        return true;
      }
      return false;
    });
    if (emptyTextOptions.length > 0) {
      messages.push('Todas las opciones deben tener texto');
      isValidForm = false;
    }
    const hasCorrectOption = question.options.filter(
      (option) => option.isCorrect
    );
    if (hasCorrectOption.length < 1) {
      messages.push('Se debe marcar una o mas opciones como correctas');
      isValidForm = false;
    }
  }
  return { result: isValidForm, messages: messages };
};

const isValidFormTypeSingleChoice = (
  question: Question
): QuestionValidationResponse => {
  let isValidForm: boolean = true;
  let messages: string[] = [];
  if (!question.text) {
    messages.push('La pregunta no puede estar vacia');
    isValidForm = false;
  }
  if (!question.points || question.points <= 0) {
    messages.push('La pregunta debe tener un puntaje positivo');
    isValidForm = false;
  }
  if (!question.options || question.options.length === 0) {
    messages.push('Debe agregar alguna opción a la pregunta');
    isValidForm = false;
  }
  if (question.options.length > 0) {
    const emptyTextOptions = question.options.filter((option) => {
      if (!option.text) {
        return true;
      }
      return false;
    });
    if (emptyTextOptions.length > 0) {
      messages.push('Todas las opciones deben tener texto');
      isValidForm = false;
    }
    const hasCorrectOption = question.options.filter(
      (option) => option.isCorrect
    );
    if (hasCorrectOption.length !== 1) {
      messages.push('Se debe marcar una sola opción como correcta');
      isValidForm = false;
    }
  }
  console.log(question);
  return { result: isValidForm, messages: messages };
};

export interface QuestionTypeJson {
  value: string;
  displayName: string;
  tooltipInfo: string;
  createInstructions: string;
  solveInstructions: string;
}

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

  public static fromJson(obj: QuestionTypeJson): QuestionType {
    let questionType = new QuestionType();
    questionType.value = obj.value;
    questionType.displayName = obj.displayName;
    questionType.tooltipInfo = obj.tooltipInfo;
    questionType.createInstructions = obj.createInstructions;
    questionType.solveInstructions = obj.solveInstructions;
    return questionType;
  }

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
    {
      value: QuestionType.TYPE_MULTIPLE_CHOICE_VALUE,
      method: isValidFormTypeMultipleChoice,
    },
    {
      value: QuestionType.TYPE_SINGLE_CHOICE_VALUE,
      method: isValidFormTypeSingleChoice,
    },
    {
      value: QuestionType.TYPE_COMPLETE_VALUE,
      method: isValidFormTypeComplete,
    },
    {
      value: QuestionType.TYPE_TRUE_OR_FALSE_VALUE,
      method: isValidFormTypeTrueOrFalse,
    },
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
  text: string;
  type: QuestionTypeJson;
  image?: string;
  options: QuestionOptionJson[];
  points: number;
}

export class Question {

  public static collection = 'question'
  id: string = '';
  text: string = '';
  type: QuestionType = QuestionType.TYPES.sort((a, b) =>
    compareByString(a.displayName, b.displayName)
  )[0];
  image?: string = '';
  options: QuestionOption[] = [];
  points: number = 0;
  skills: DocumentReference[]=[];
  

  isValidForm(): QuestionValidationResponse {
    const formValidationMethod = QuestionType.FORM_VALIDATION_METHODS.find(
      (questionType) => this.type.value === questionType.value
    ).method;
    return formValidationMethod(this);
  }

  getDisplayText(): string {
    let displayText = this.text;
    const placeholders = this.getPlaceholders();
    for (const placeholder of placeholders) {
      const options = this.options.filter(
        (question) => question.placeholder == placeholder
      );
      let optionsHtml =
        '<option disabled selected value> -- Selecciona una opcion -- </option>';
      for (const option of options) {
        optionsHtml += `<option value="${option.text}">${option.text}</option>`;
      }
      const placeholderHtml = `<select class="">${optionsHtml}</select>`;
      displayText = displayText.replace(`[${placeholder}]`, placeholderHtml);
    }
    return displayText;
  }

  getPlaceholders(): string[] {
    let placeholders = [];
    let matches = this.text.matchAll(/\[([^\[\]]*)\]/g);
    for (let match of matches) {
      placeholders.push(match[1]);
    }
    return placeholders;
  }

  getOptionsForPlaceholder(placeholder: string): QuestionOption[] {
    return this.options.filter((option) => option.placeholder == placeholder);
  }

  public static fromJson(obj: QuestionJson): Question {
    let question = new Question();
    question.text = obj.text;
    question.type = QuestionType.fromJson(obj.type);
    question.image = obj.image;
    question.points = obj.points;
    for (const option of obj.options) {
      const newOption = QuestionOption.fromJson(option);
      question.options = [...question.options, newOption];
    }
    return question;
  }
}

export interface AnswerItem {
  text: string;
  isCorrect: boolean;
  answer: boolean;
  placeholder: string;
}

export interface Answer {
  type: QuestionType;
  points: number;
  answerItems: AnswerItem[];
}

export interface questionPoints {
  collectedPoints: number;
  expectedPoints: number;
}

export interface ActivityScores {
  activityPoints: questionPoints[];
  collectedPoints: number;
  expectedPoints: number;
  finalScore: number;
}

export class ActivityResult {
  answers: Answer[] = [];
}

export interface ActivityJson {
  id: string;
  title: string;
  createdAt: number;
  questions: Array<QuestionJson>;
  isTest: boolean;
}

export class Activity {

  public static collection = 'activity'
  
  id: string = '';
  title: string = '';
  createdAt: number = +new Date();
  questions: Array<Question> = [];
  isTest: boolean;
  //nuevas Arturo
  description: string = '';
  duration: number = 0;
  instrucciones: string = '';
  claseRef: DocumentReference;
  enterpriseRef: DocumentReference;
  courseRef: DocumentReference;
  archivos: any[] = [];
  idVideo: number = 0
  idVideoNew : string = ""

  public toJson() {
    return {
      id:this.id,
      title:this.title,
      createdAt:this.createdAt,
      questions:this.questions,
      isTest:this.isTest,
      //nuevas Arturo
      description:this.description,
      duration:this.duration,
      instrucciones:this.instrucciones,
      claseRef:this.claseRef,
      enterpriseRef:this.enterpriseRef,
      archivos: this.archivos,
      idVideo: this.idVideo,
      idVideoNew: this.idVideoNew,
    }
  }

  public static fromJson(obj: ActivityJson): Activity {
    let activity = new Activity();
    activity.id = obj.id;
    activity.title = obj.title;
    activity.createdAt = obj.createdAt;
    activity.isTest = obj.isTest;
    for (const question of obj.questions) {
      const newQuestion = Question.fromJson(question);
      activity.questions = [...activity.questions, newQuestion];
    }
    return activity;
  }
}
