# Documentación de API para Frontend: Asistente de Anuncios de Meta

Esta guía describe los endpoints del backend que el frontend debe consumir para implementar el asistente de creación de campañas de Meta Ads.

**Prefijo de todas las rutas:** `/api/v1`

---

## Flujo de Trabajo Principal

El flujo recomendado para el usuario es el siguiente:

1.  **Selección de Compañía (Activos precargados):**
    *   El wizard obtiene la lista de compañías que ya tienen sus activos de Meta vinculados usando `GET /meta/companies/linked-assets`.
    *   El usuario elige la compañía y se reutilizan sus recursos (`business_id`, `ad_account`, `page`, `whatsapp_number`, `has_system_user_token`).
2.  **Creación de Campaña (Wizard):**
    *   El usuario final interactúa con el wizard para definir los detalles de la campaña, el conjunto de anuncios y el creativo.
    *   En este paso el frontend debe ofrecer **dos caminos**:
        1. **Crear una nueva campaña** usando el formulario y enviando el payload a `POST /meta/full-campaign`.
        2. **Revisar campañas existentes** mostrando la jerarquía que llega en `assets.campaigns` (campaña → ad sets → ads) y permitiendo acciones administrativas (duplicar, pausar, etc.) sobre esos elementos.
        *   Nota: si el usuario necesita refrescar la información antes de mostrarla, dispara `POST /meta/companies/{business_unit_id}/sync-campaigns` y vuelve a consultar `GET /meta/companies/linked-assets`.
    *   Cuando se opta por el camino “Crear nueva”, el frontend recopila toda la información en un único objeto JSON y ejecuta `POST /meta/full-campaign` para publicar en Meta en una sola operación.

---

## 1. Endpoints de Descubrimiento y Vinculación

### 1.1 Listar compañías con activos de Meta

- **Endpoint:** `GET /meta/companies/linked-assets`
- **Descripción:** Devuelve únicamente las compañías que ya tienen un vínculo con Meta (`CompanyMetaLink`). Incluye los identificadores de los activos necesarios para crear campañas. Los nombres de páginas y números pueden llegar como `null` si Meta aún no expone esa información; el frontend debe manejar esos casos.
- **Nota:** Si acabas de vincular una compañía y aún no ves campañas registradas, dispara `POST /meta/companies/{business_unit_id}/sync-campaigns` para refrescar la información antes de volver a consultar este endpoint.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "data": [
      {
        "business_unit_id": 42,
        "company_name": "Baltra MX",
        "assets": {
          "business_id": "111222333444",
          "ad_account": {
            "id": "act_1234567890",
            "account_id": "1234567890",
            "name": "Baltra MX Ads",
            "currency": "MXN",
            "timezone_name": "America/Mexico_City"
          },
          "page": {
            "id": "9876543210",
            "name": null
          },
          "whatsapp_number": {
            "id": "5215500001111",
            "display_phone_number": "+52 55 0000 1111"
          },
          "has_system_user_token": true,
          "campaigns": [
            {
              "meta_campaign_id": "cmp_123",
              "name": "Campaña Test",
              "status": "ACTIVE",
              "ad_sets": [
                {
                  "meta_ad_set_id": "set_123",
                  "status": "ACTIVE",
                  "ads": [
                    {
                      "meta_ad_id": "ad_123",
                      "status": "ACTIVE"
                    }
                  ]
                }
              ]
            }
          ]
        },
        "defaults": {
          "campaign": {
            "status": "PAUSED"
          }
        }
      }
    ]
  }
  ```
- **Campos útiles para el paso 1 del wizard:**
  - `business_unit_id`, `company_name`
  - `assets.business_id`
  - `assets.ad_account.account_id` + `assets.ad_account.name`
  - `assets.page.id` (si no hay página vinculada se usa la marcada como `is_default` en la tabla `meta_pages`)
  - `assets.whatsapp_number.id`
  - `assets.has_system_user_token`
  - `assets.campaigns` (jerarquía campaña → ad sets → ads almacenada en las tablas `meta_campaign`, `meta_ad_set`, `meta_ad`)
  - `defaults` (se aplican automáticamente en el paso 2 si existen)

- **Endpoint:** `POST /meta/companies/{business_unit_id}/sync-campaigns`
- **Descripción:** Fuerza la sincronización de campañas, ad sets y ads desde Meta para una compañía vinculada. Devuelve un resumen del proceso y la jerarquía resultante (misma estructura que `assets.campaigns`). El frontend puede usarlo antes de mostrar el listado de campañas existentes en el paso 2.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "business_unit_id": 42,
    "summary": {
      "campaigns": 3,
      "ad_sets": 5,
      "ads": 9
    },
    "campaigns": [
      {
        "meta_campaign_id": "cmp_123",
        "name": "Campaña Test",
        "status": "ACTIVE",
        "created_at": "2024-01-01T00:00:00+00:00",
        "updated_at": "2024-01-02T00:00:00+00:00",
        "ad_sets": [
          {
            "meta_ad_set_id": "set_123",
            "name": "AdSet Test",
            "status": "ACTIVE",
            "daily_budget_cents": 1500,
            "ads": [
              {
                "meta_ad_id": "ad_123",
                "creative_id": "cr_123",
                "status": "ACTIVE"
              }
            ]
          }
        ]
      }
    ]
  }
  ```

### 1.2 Listar Cuentas Publicitarias de Clientes

- **Endpoint:** `GET /meta/business/client-ad-accounts`
- **Descripción:** Obtiene la lista de cuentas publicitarias de clientes asociadas al Business Manager principal.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "act_1234567890",
        "account_id": "1234567890",
        "name": "Cuenta de Cliente A",
        "account_status": 1,
        "currency": "MXN"
      }
    ],
    "paging": {
      "cursors": { "before": "...", "after": "..." }
    }
  }
  ```

### 1.3 Listar Cuentas Publicitarias Propias

- **Endpoint:** `GET /meta/business/owned-ad-accounts`
- **Descripción:** Similar al anterior, pero para cuentas propias del Business Manager.
- **Respuesta:** Misma estructura que `client-ad-accounts`.

### 1.4 Listar Roles Disponibles para una compañía

- **Endpoint:** `GET /meta/companies/{business_unit_id}/roles`
- **Descripción:** Devuelve los roles activos asociados a la compañía (screening company) indicada. Se utiliza para poblar la selección de roles del wizard.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "data": [
      {
        "role_id": 5001,
        "business_unit_id": 42,
        "name": "Operador",
        "default_role": true,
        "shift": "Matutino",
        "set_id": 17,
        "role_info": {"location": "CDMX"}
      }
    ]
  }
  ```
- Los roles inactivos o marcados como eliminados no se incluyen en la respuesta.

### 1.4 Vincular Compañía con Activos de Meta

- **Endpoint:** `POST /companies/{business_unit_id}/link-ad-account`
- **Descripción:** Crea o actualiza la asociación entre una compañía interna y sus activos de Meta. El wizard ya no invoca este endpoint directamente; se usa en flujos administrativos para garantizar que todas las compañías queden listas antes de utilizar el asistente.
- **Parámetros de URL:**
  - `business_unit_id` (integer): El ID de la compañía en el sistema.
- **Cuerpo de la Petición (Request Body):**
  ```json
  {
    "business_id": "111222333444",
    "ad_account_id": "1234567890",
    "page_id": "9876543210",
    "wa_number_id": "5215500001111",
    "system_user_token": "EAA..."
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "business_unit_id": 42,
    "business_id": "111222333444",
    "ad_account_id": "1234567890"
  }
  ```

---

### 1.5 Listar campañas existentes de una compañía

- **Endpoint:** `GET /meta/companies/{business_unit_id}/campaigns`
- **Descripción:** Devuelve la jerarquía almacenada (campaña → ad sets → ads) para la compañía indicada. Si se pasa `?sync=true`, el backend sincroniza primero con `POST /meta/companies/{business_unit_id}/sync-campaigns` y luego entrega los datos actualizados.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "data": [
      {
        "meta_campaign_id": "cmp_123",
        "name": "Campaña Test",
        "status": "ACTIVE",
        "updated_at": "2024-01-02T00:00:00+00:00",
        "ad_sets": [
          {
            "meta_ad_set_id": "set_123",
            "status": "ACTIVE",
            "daily_budget_cents": 1500,
            "ads": [
              {
                "meta_ad_id": "ad_123",
                "status": "ACTIVE"
              }
            ]
          }
        ]
      }
    ]
  }
  ```

### 1.6 Cambiar estado de campañas y ad sets

- **Endpoint:** `POST /meta/campaigns/{campaign_id}/status`
  - **Descripción:** Cambia el estado de una campaña (`ACTIVE`, `PAUSED`, `ARCHIVED`). Requiere `business_unit_id` en el cuerpo para resolver el contexto.
  - **Request Body:**
    ```json
    {
      "business_unit_id": 42,
      "status": "PAUSED"
    }
    ```

- **Endpoint:** `POST /meta/adsets/{ad_set_id}/status`
  - **Descripción:** Cambia el estado de un ad set (`ACTIVE`, `PAUSED`, `ARCHIVED`). También requiere `business_unit_id`.
  - **Request Body:**
    ```json
    {
      "business_unit_id": 42,
      "status": "PAUSED"
    }
    ```

Ambos endpoints devuelven la respuesta cruda de Meta (por ejemplo, `{ "id": "cmp_123", "status": "PAUSED" }`).

---

## 2. Endpoint de Targeting (Búsqueda de Ubicaciones)

### 2.1 Buscar Ubicaciones Geográficas

- **Endpoint:** `GET /meta/act/{act_id}/targetingsearch`
- **Descripción:** Busca ubicaciones (ciudades, regiones, etc.) para la segmentación. Devuelve una lista de posibles coincidencias.
- **Parámetros de URL:**
  - `act_id` (string): El ID de la cuenta publicitaria (sin el prefijo `act_`).
- **Parámetros de Query:**
  - `location_types`: (string) Tipo de ubicación a buscar. Ejemplo: `["city"]` o `["region"]`.
  - `q`: (string) El término de búsqueda. Ejemplo: `Tlalnepantla`.
- **Ejemplo de Llamada:** `GET /api/v1/meta/act/1234567890/targetingsearch?location_types=["city"]&q=Tlalnepantla`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "data": [
      {
        "key": "613017",
        "name": "Tlalnepantla de Baz, Estado de México",
        "type": "city",
        "country_code": "MX"
      }
    ]
  }
  ```

---

## 3. Endpoint Principal de Creación de Campañas (Recomendado)

### 3.1 Crear una Campaña Completa

- **Endpoint:** `POST /meta/full-campaign`
- **Descripción:** Crea una campaña, un conjunto de anuncios, sube la imagen, crea el creativo y el anuncio final, todo en una sola llamada. **Este es el endpoint que el wizard debe usar al finalizar.**
- **Cuerpo de la Petición (Request Body):**
  - El payload es un objeto JSON que contiene toda la información. El `business_unit_id` es obligatorio. El `role_id` es opcional y, si se provee, aplicará las plantillas de targeting y creativos.
  - Sobre `page_id`: el backend lo resuelve automáticamente desde `CompanyMetaLink` de la compañía. Opcionalmente, el frontend puede enviarlo para forzar/override:
    - a nivel raíz como `page_id`, o
    - dentro de `ad_set.promoted_object.page_id`.

  ```json
  {
    "business_unit_id": 42,
    "role_id": 101,
    "page_id": "9876543210",
    "campaign": { "name": "Campaña de Reclutamiento Q4" },
    "ad_set": {
      "name": "Operadores de Almacén - Zona Norte",
      "daily_budget": 50000,
      "start_time": "2025-11-01T10:00:00-0600",
      "end_time": "2025-12-01T23:59:59-0600",
      "targeting": {
        "age_min": 20,
        "age_max": 45,
        "genders": [1],
        "geo_locations": {
          "cities": [{ "key": "613017", "radius": 15, "distance_unit": "kilometer" }]
        }
      }
    },
    "creative": {
      "image_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...", 
      "variants": [
        {
          "primaryText": "¡Únete a nuestro equipo! Buscamos operadores de almacén.",
          "title": "Vacante: Operador de Almacén",
          "description": "Contratación inmediata. Prestaciones superiores."
        }
      ]
    },
    "ad": {
      "name": "Anuncio para Operadores",
      "activate_on_create": true
    }
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "campaign_id": "2384398000111",
    "adset_id": "2384398000222",
    "creative_id": "2384398000333",
    "ad_id": "2384398000444",
    "status": "ACTIVE"
  }
  ```

---

## 4. Campaign Management (Gestión de Campañas)

Esta sección reúne los endpoints para consultar y administrar campañas, conjuntos de anuncios (ad sets) y anuncios (ads) desde el dashboard.

### 4.1 Ver campañas existentes de una compañía
- Endpoint: `GET /meta/companies/{business_unit_id}/campaigns`
- Descripción: Devuelve la jerarquía almacenada (campaña → ad sets → ads) para la compañía indicada. Para forzar actualización previa con Meta, enviar `?sync=true`.
- Referencia: ver detalles y ejemplo de respuesta en la sección 1.5.

### 4.2 Sincronizar campañas con Meta
- Endpoint: `POST /meta/companies/{business_unit_id}/sync-campaigns`
- Descripción: Sincroniza campañas, ad sets y ads desde Meta y devuelve un resumen más la jerarquía actualizada.
- Uso recomendado: ejecutar antes de listar campañas si el usuario solicita “refrescar”. También se puede usar el parámetro `?sync=true` del listado (4.1).

### 4.3 Cambiar estado de campañas
- Endpoint: `POST /meta/campaigns/{campaign_id}/status`
- Descripción: Cambia el estado de una campaña (`ACTIVE`, `PAUSED`, `ARCHIVED`).
- Body:
  ```json
  { "business_unit_id": 42, "status": "PAUSED" }
  ```
- Respuesta: devuelve el resultado crudo de Meta (p. ej. `{ "id": "cmp_123", "status": "PAUSED" }`).

### 4.4 Cambiar estado de ad sets
- Endpoint: `POST /meta/adsets/{ad_set_id}/status`
- Descripción: Cambia el estado de un ad set (`ACTIVE`, `PAUSED`, `ARCHIVED`).
- Body:
  ```json
  { "business_unit_id": 42, "status": "PAUSED" }
  ```
- Respuesta: devuelve el resultado crudo de Meta.

### 4.5 Gestión de anuncios (Ads)
- `GET /meta/ads?ad_account_id={id}`: Lista los anuncios de una cuenta publicitaria.
- `POST /meta/ads/{ad_id}/status`: Cambia el estado de un anuncio (`ACTIVE` o `PAUSED`).
  - Body: `{ "status": "PAUSED" }`
- `POST /meta/ads/{ad_id}/budget`: Actualiza el presupuesto asociado (a nivel de ad set).
  - Body: `{ "daily_budget_cents": 60000 }`

---

## 5. Datos imprescindibles que debe proveer el backend

| Paso del wizard | Endpoint | Campos requeridos |
| --- | --- | --- |
| 1. Selección de compañía | `GET /meta/companies` | `id`, `name`, `business_id`, `ad_account{id,account_id}`, `page{id}`, `whatsapp_number{id,display_phone_number}`, `system_user_token` (opcional). |
| 3. Segmentación | `GET /meta/act/{act_id}/targetingsearch` | Para cada ubicación: `key`, `name`, `type`, `country_code`. |
| 5. Revisión y publicación | `POST /meta/full-campaign` | Debe aceptar `business_unit_id`, `campaign`, `ad_set`, `creative`, `ad` y resolver internamente los activos vinculados a la compañía. |

Si alguno de estos datos falta o llega con un formato distinto, el frontend no podrá completar el flujo sin añadir pasos manuales al usuario.
