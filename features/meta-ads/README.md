# Meta Ads Wizard Feature

Módulo completo para crear y gestionar campañas de Meta Ads con objetivo de mensajes de WhatsApp.

## Características

- **Wizard de 5 pasos** para crear campañas
- **Dashboard de analíticas** con KPIs y gráficos
- **Gestión de plantillas** (copy, targeting, imágenes)
- **Integración completa** con Meta Graph API

## Instalación

### 1. Copiar archivos

Copia la carpeta `features/meta-ads` a tu proyecto:

\`\`\`
your-project/
├── features/
│   └── meta-ads/
│       ├── components/
│       ├── lib/
│       ├── types.ts
│       └── README.md
├── app/
│   └── api/
│       └── meta/
│           └── ... (API routes)
\`\`\`

### 2. Variables de entorno

Añade a tu archivo `.env.local`:

\`\`\`env
META_ACCESS_TOKEN=tu_token_de_acceso_de_meta
\`\`\`

### 3. Rutas API

Las rutas API ya están incluidas en `app/api/meta/`. Asegúrate de que estén en tu proyecto.

## Uso

### Opción 1: Rutas dedicadas (recomendado)

Crea las páginas en tu app:

\`\`\`tsx
// app/meta/wizard/page.tsx
import { MetaAdsWizard } from '@/features/meta-ads/meta-ads-wizard'

export default function WizardPage() {
  return <MetaAdsWizard />
}
\`\`\`

\`\`\`tsx
// app/meta/dashboard/page.tsx
import { MetaAdsDashboard } from '@/features/meta-ads/meta-ads-dashboard'

export default function DashboardPage() {
  return <MetaAdsDashboard />
}
\`\`\`

\`\`\`tsx
// app/meta/templates/page.tsx
import { MetaAdsTemplates } from '@/features/meta-ads/meta-ads-templates'

export default function TemplatesPage() {
  return <MetaAdsTemplates />
}
\`\`\`

### Opción 2: Componente embebido

Usa los componentes dentro de tu UI existente:

\`\`\`tsx
import { MetaAdsWizard } from '@/features/meta-ads/meta-ads-wizard'

export default function MyPage() {
  return (
    <div className="container mx-auto py-8">
      <h1>Crear Campaña</h1>
      <MetaAdsWizard 
        onComplete={(data) => {
          console.log('Campaña creada:', data)
          // Redirigir o mostrar mensaje de éxito
        }}
      />
    </div>
  )
}
\`\`\`

### Opción 3: API Client standalone

Usa solo el cliente API sin UI:

\`\`\`tsx
import { metaAdsApi } from '@/features/meta-ads/lib/api-client'

async function createCampaign() {
  const accounts = await metaAdsApi.getAdAccounts()
  const campaign = await metaAdsApi.createCampaign({
    adAccountId: accounts[0].id,
    name: 'Mi Campaña',
    objective: 'MESSAGES',
  })
}
\`\`\`

## Componentes principales

### MetaAdsWizard

Wizard completo de 5 pasos para crear campañas.

**Props:**
- `onComplete?: (data: WizardData) => void` - Callback cuando se completa el wizard
- `initialData?: Partial<WizardData>` - Datos iniciales para pre-llenar el wizard

### MetaAdsDashboard

Dashboard con métricas, gráficos y tabla de anuncios.

**Props:**
- `adAccountId?: string` - ID de cuenta de anuncios (opcional, usa la primera disponible si no se proporciona)

### MetaAdsTemplates

Gestión de plantillas de copy, targeting e imágenes.

**Props:**
- Ninguna (componente standalone)

## API Client

El `MetaAdsApiClient` proporciona métodos para interactuar con la API de Meta:

\`\`\`typescript
import { metaAdsApi } from '@/features/meta-ads/lib/api-client'

// Obtener cuentas de anuncios
const accounts = await metaAdsApi.getAdAccounts()

// Crear campaña
const campaign = await metaAdsApi.createCampaign(data)

// Obtener insights
const insights = await metaAdsApi.getInsights(adAccountId, 'last_30d')
\`\`\`

## Personalización

### Estilos

Los componentes usan las clases de Tailwind y los design tokens de tu proyecto. Para personalizar:

1. Modifica los colores en `app/globals.css`
2. Los componentes respetan automáticamente el modo oscuro

### Validación

Añade validación personalizada en los componentes de wizard:

\`\`\`tsx
// En wizard-step-1.tsx
const validateStep = () => {
  if (!selectedAccount) {
    toast.error('Selecciona una cuenta de anuncios')
    return false
  }
  return true
}
\`\`\`

## Estructura de archivos

\`\`\`
features/meta-ads/
├── components/
│   ├── wizard-progress.tsx       # Barra de progreso del wizard
│   ├── wizard-navigation.tsx     # Botones de navegación
│   ├── wizard-step-1.tsx         # Paso 1: Cuenta y activos
│   ├── wizard-step-2.tsx         # Paso 2: Campaña
│   ├── wizard-step-3.tsx         # Paso 3: Conjunto de anuncios
│   ├── wizard-step-4.tsx         # Paso 4: Creatividades
│   └── wizard-step-5.tsx         # Paso 5: Revisión
├── lib/
│   └── api-client.ts             # Cliente API de Meta
├── types.ts                      # Tipos TypeScript
├── meta-ads-wizard.tsx           # Componente principal del wizard
├── meta-ads-dashboard.tsx        # Componente del dashboard
├── meta-ads-templates.tsx        # Componente de plantillas
└── README.md                     # Esta documentación
\`\`\`

## Soporte

Para problemas o preguntas:
1. Revisa la documentación de Meta Graph API
2. Verifica que el token de acceso tenga los permisos necesarios
3. Revisa los logs de la consola del navegador y del servidor
