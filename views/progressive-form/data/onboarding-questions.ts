import type { FormStep } from '@/types/progressive-form';

const formDefinition: FormStep[] = [
    {
        "step-id": 0,
        "section_name": "Información de la empresa",
        "questions": [
            {
                "question": "Nombre de la empresa",
                "type": "text",
                "required": true,
                "restrictions": { "max_length": 24 }
            },
            {
                "question": "Tipo de empresa",
                "type": "options",
                "required": true,
                "options": [
                    "1 - Cadena de Retail",
                    "2 - Criterios de Elegibilidad parcial",
                    "3 - Criterios de Elegibilidad por vacante",
                    "4 - Empresas de Manufactura",
                    "5 - Empresas de Limpieza o Seguridad"
                ],
            },
            {
                "question": "Sitio web de la empresa",
                "type": "url",
                "required": true,
                "restrictions": {}
            },
            {
                "question": "Descripción de la empresa",
                "type": "text",
                "required": true,
                "restrictions": { "max_length": 250 }
            }
        ]
    },
    {
        "step-id": 1,
        "section_name": "Ubicación de la empresa",
        "questions": [
            {
                "question": "Dirección de la empresa",
                "type": "google_maps",
                "required": true,
                "restrictions": {}
            },
        ]
    },
    {
        "step-id": 2,
        "section_name": "Configuración de entrevistas",
        "questions": [
            {
                "question": "Selecciona los horarios disponibles para entrevistas.",
                "type": "component",
                "required": true,
                "restrictions": {}
            }
        ]
    },
    {
        "step-id": 3,
        "section_name": "Selección de recordatorios",
        "questions": [
            {
                "question": "Selecciona los recordatorios para entrevistas.",
                "type": "options",
                "required": true,
                "allowMultiple": true
            }
        ]
    },
    {
        "step-id": 4,
        "section_name": "Beneficios de la empresa",
        "questions": [
            {
                "question": "Selecciona los beneficios generales que ofrece la empresa.",
                "type": "options",
                "required": true,
                "options": [
                    "Vales de despensa",
                    "Uniforme",
                    "Seguro Social IMSS",
                    "Prestaciones de Ley y superiores",
                    "Fondo de ahorro",
                    "Premio de puntualidad y asistencia",
                    "Premio de seguridad",
                    "Oportunidades de crecimiento",
                    "Comisiones",
                    "Descanso en fin de Semana",
                    "Seguro de Vida",
                    "Transporte",
                    "Caja de Ahorro",
                    "Uniformes Gratis",
                    "Comedor Subsidiado"
                ],
                "allowMultiple": true
            },
        ],
    },
    {
        "step-id": 5,
        "section_name": "Contacto de Recursos Humanos",
        "questions": [
            {
                "question": "Nombre de la persona de Recursos Humanos",
                "type": "text",
                "required": true,
                "restrictions": { "max_length": 100 }
            },
            {
                "question": "Teléfono de la persona de Recursos Humanos",
                "type": "phone_number",
                "required": true,
                "restrictions": { "max_length": 15 }
            },
        ]
    },
    {
        "step-id": 6,
        "section_name": "Vacantes",
        "questions": [
            {
                "question": "Registra las vacantes de la empresa.",
                "type": "component",
                "required": true,
                "componentKind": "vacancies",
                "restrictions": {
                    "roleNameMax": 24,
                    "relevantInfoMax": 72,
                    "aboutRoleMax": 200
                }
            }
        ]
    },
    {
        "step-id": 7,
        "section_name": "Datos demográficos",
        "questions": [
            {
                "question": "Configura los datos demográficos por vacante.",
                "type": "component",
                "required": true,
                "componentKind": "demographics",
                "restrictions": {}
            }
        ]
    },
    {
        "step-id": 8,
        "section_name": "Salario",
        "questions": [
            {
                "question": "Configura el salario por vacante.",
                "type": "component",
                "required": true,
                "componentKind": "salary",
                "restrictions": {}
            }
        ]
    },
    {
        "step-id": 9,
        "section_name": "Turnos",
        "questions": [
            {
                "question": "Configura los turnos por vacante.",
                "type": "component",
                "required": true,
                "componentKind": "shifts",
                "restrictions": { "shiftMax": 120 }
            }
        ]
    },
    {
        "step-id": 10,
        "section_name": "Documentos requeridos",
        "questions": [
            {
                "question": "Configura los documentos requeridos por vacante.",
                "type": "component",
                "required": true,
                "componentKind": "documents"
            }
        ]
    },
    {
        "step-id": 11,
        "section_name": "Transporte, Certificaciones y Otras preguntas",
        "questions": [
            {
                "question": "Configura transporte, certificaciones y preguntas extra.",
                "type": "component",
                "required": true,
                "componentKind": "transport",
                "restrictions": {}
            }
        ]
    },
    {
        "step-id": 12,
        "section_name": "Entrevistas",
        "questions": [
            {
                "question": "Entrevistas",
                "type": "component",
                "componentKind": "interviews",
                "required": false
            }
        ]
    },
    {
        "step-id": 13,
        "section_name": "Preguntas de screening por WhatsApp",
        "questions": [
            {
                "question": "Define cómo se mostrarán las preguntas al candidato.",
                "type": "component",
                "required": false,
                "componentKind": "screening_wa"
            }
        ]
    }
];

export default formDefinition;
