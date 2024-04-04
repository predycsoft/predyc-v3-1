import { ProductJson, Product } from "projects/shared/models/product.model";

export const productsData: ProductJson[] = [
	{
		id: "Demo",
		active: true,
		name: "Demo",
		description: "Demo",
		type: Product.TYPE_TRIAL,
		amount: 0,
		autodeactivate: true,
		accesses: {
			enableUserRadar: false,
			enableStudyPlanView: false,
			enableExtraCoursesView: true,
			enableToTakeTest: false,
			enableCreateParticularCourses: false,
		},
		createdAt: 1679634238000,
		features: [],
	},
	{
		id: "Independiente",
		active: true,
		name: "Independiente",
		description: "Independiente",
		type: Product.TYPE_INDEPEND,
		amount: 10,
		autodeactivate: true,
		accesses: {
			enableUserRadar: false,
			enableStudyPlanView: false,
			enableExtraCoursesView: true,
			enableToTakeTest: true,
			enableCreateParticularCourses: false,
		},
		createdAt: 1679634238000,
		features: [],
	},
	{
		id: "Simplificado",
		active: true,
		name: "Simplificado",
		description: "Simplificado",
		type: Product.TYPE_SIMPLIFIED,
		amount: 20,
		autodeactivate: false,
		accesses: {
			enableUserRadar: false,
			enableStudyPlanView: false,
			enableExtraCoursesView: true,
			enableToTakeTest: true,
			enableCreateParticularCourses: false,
		},
		createdAt: 1679634238000,
		features: [],
	},
	{
		id: "Full",
		active: true,
		name: "Full",
		description: "Full",
		type: Product.TYPE_FULL,
		amount: 30,
		autodeactivate: false,
		accesses: {
			enableUserRadar: true,
			enableStudyPlanView: true,
			enableExtraCoursesView: true,
			enableToTakeTest: true,
			enableCreateParticularCourses: false,
		},
		createdAt: 1679634238000,
		features: [
			{
				text: "Acceso a mas de 50 cursos",
				isActive: true,
			},
			{
				isActive: true,
				text: "Certificado de completación de cursos",
			},
			{
				text: "Flexibilidad de aprendizaje 24/7",
				isActive: true,
			},
			{
				text: "Acceso a material descargable",
				isActive: true,
			},
			{
				isActive: true,
				text: "Acceso en todos los dispositivos",
			},
			{
				isActive: true,
				text: "Foro de preguntas y respuestas al instructor",
			},
			{
				isActive: false,
				text: "Acceso a todos nuestros programas",
			},
			{
				text: "Certificado de completación de programas",
				isActive: false,
			},
		],
	},
];
