# Backend implementation blueprint – Meta Ads Wizard

Este documento describe cómo habilitar en el backend los endpoints consumidos por el nuevo wizard de campañas de Meta Ads en el frontend. Además, mapea cada endpoint interno a las llamadas que debe realizar contra la Graph Marketing API de Meta, incluyendo configuraciones, permisos y recomendaciones de implementación.

---

## 1. Requisitos previos

- **Credenciales de Meta Business** con acceso a los ad accounts, páginas y números de WhatsApp que se administrarán.
- **App de Meta** configurada con permisos `ads_management`, `business_management`, `pages_show_list`, `pages_messaging`, `whatsapp_business_messaging`.
- **System User / Long-lived token** o mecanismo para generar tokens válidos; se recomienda almacenar los tokens cifrados y refrescarlos periódicamente.
- Variables de entorno sugeridas:
  - `META_ACCESS_TOKEN`
  - `META_APP_ID`, `META_APP_SECRET` (si se maneja refresh programático)
  - `META_DEFAULT_BUSINESS_ID`
  - `META_API_VERSION` (ej. `v19.0`)
  - `META_SANDBOX_MODE=true` (bandera para activar mocks o sandbox)

Todos los endpoints expuestos al frontend se sirven bajo el prefijo `/api/v1`. Ajusta el routing de tu backend según corresponda (Nest, Express, Fastify, etc.).

---

## 2. Endpoints expuestos al frontend y su integración con Meta

### 2.1 Descubrimiento de activos

| Frontend | Método | Descripción | Meta endpoints involucrados |
| --- | --- | --- | --- |
| `/meta/companies/linked-assets` | GET | Lista compañías habilitadas para el wizard con todos los activos necesarios (business, ad account, page, WhatsApp, token o bandera). Soporta alias legacy `/meta/companies`. | No aplica: la información proviene de tu base (`meta_company_assets`) y se debe devolver en un formato consistente. |
| `/meta/business/client-ad-accounts` | GET | Lista ad accounts de clientes asociados al Business principal. | `GET /{business_id}/client_ad_accounts?fields=id,account_id,name,currency,account_status` |
| `/meta/business/owned-ad-accounts` | GET | Lista ad accounts propios del Business principal. | `GET /{business_id}/owned_ad_accounts?fields=id,account_id,name,currency,account_status` |
| `/meta/companies/{business_unit_id}/roles` | GET | Devuelve las opciones de rol disponibles para la compañía seleccionada. Se utiliza para poblar el paso 2 del wizard. | Fuente interna (base de datos). |
| `/meta/pages?ad_account_id={actId}` | GET | Lista páginas disponibles para el ad account seleccionado. Requiere field expansion. | Opciones recomendadas:<br>`GET /{business_id}/owned_pages?fields=id,name,category,access_token`<br>o `GET /{ad_account_id}/assigned_pages?fields=id,name,category` según permisos. |
| `/meta/whatsapp-numbers?page_id={pageId}` | GET | Obtiene números de WhatsApp Business vinculados a la página. | `GET /{page_id}/whatsapp_business_accounts?fields=id,name,phone_numbers{display_phone_number,verified_name,id}` |

**Notas de implementación**
- Cachea respuestas a nivel de compañía para reducir latencia y llamadas repetidas.
- La respuesta al frontend debe normalizarse a los tipos `MetaAdAccount`, `MetaPage`, `MetaWhatsAppNumber`.
- Maneja gracefully errores de permisos (403) o expiración de tokens (400 OAuthException) devolviendo mensajes claros al frontend.
- El endpoint `/meta/companies/linked-assets` debe incluir, como mínimo, los campos `id`, `name`, `business_id`, `ad_account{id,account_id,name}`, `page{id,name}`, `whatsapp_number{id,display_phone_number}` y `system_user_token` o `has_system_user_token`. Puedes añadir `defaults` (ej. objetivo/categorías) para preconfigurar la campaña. Si falta alguno de esos datos, el wizard no podrá avanzar del paso 1.
- El endpoint `/meta/companies/{business_unit_id}/roles` debe filtrar roles inactivos y ordenar (sugerido) colocando primero el `default_role`.

### 2.2 Vinculación de activos internos

| Frontend | Método | Request body | Meta API | Propósito |
| --- | --- | --- | --- | --- |
| `/companies/{business_unit_id}/link-ad-account` | POST | `{ "business_id", "ad_account_id", "page_id", "wa_number_id", "system_user_token" }` | No llama directamente a Meta (opcional validar). | Persiste la relación entre la `business_unit_id` interna y los activos seleccionados. |

**Recomendaciones**
- Guarda la relación en tu base (ej. tabla `meta_company_assets`). Estructura sugerida: `business_unit_id`, `business_id`, `ad_account_id`, `page_id`, `wa_number_id`, `system_user_token`, `created_at`, `updated_at`. Esta tabla es la fuente de datos para `/meta/companies`.
- Valida que el ad account y la página pertenezcan realmente al business ID recibido haciendo llamadas de verificación a Meta cuando `META_SANDBOX_MODE=false`.

### 2.3 Plantillas por rol (Blueprints)

El endpoint `/meta/companies/{business_unit_id}/roles` debe incluir un objeto `blueprint` por cada rol activo. Ese objeto
encapsula la información necesaria para precargar la campaña (objetivo, categorías especiales, targeting, creatividades,
presupuesto sugerido). Si un rol no tiene blueprint, el frontend simplemente dejará los campos en blanco.

**Implementación recomendada**
- Guarda la plantilla junto con el rol (ej. columnas JSON `blueprint` dentro de tu tabla de roles) o realiza el join al generar
  la respuesta de `/roles`.
- Normaliza el payload al esquema usado en `RoleBlueprint` (`features/meta-ads/types.ts`) para evitar transformaciones en el
  frontend.

### 2.4 Búsqueda de ubicaciones (targeting)

| Frontend | Método | Query params | Meta endpoint |
| --- | --- | --- | --- |
| `/meta/act/{actId}/targetingsearch` | GET | `q`, `location_types`, `limit` | `GET /{act_id}/targetingsearch?type=adgeolocation&q={query}&location_types=[...]&limit=...` |

**Notas**
- `act_id` debe enviarse sin el prefijo `act_`.
- Debes manejar rate limits (`429`) y retornar mensajes claros.
- Almacena en caché resultados frecuentes para ahorrar quota.

### 2.5 Creación completa de campaña

| Frontend | Método | Descripción | Payload esperado | Meta endpoints a encadenar |
| --- | --- | --- | --- | --- |
| `/meta/full-campaign` | POST | Crea campaña, ad set, creativo(s) y anuncio(s) en una sola llamada. | Ver estructura `FullCampaignRequest` (`business_unit_id`, `campaign`, `ad_set`, `creative`, `ad`). | 1. `POST /{ad_account_id}/campaigns`<br>2. `POST /{ad_account_id}/adsets`<br>3. (Opcional) `POST /{ad_account_id}/adimages` si requieres subir imagen y obtener `hash`.<br>4. `POST /{ad_account_id}/adcreatives` utilizando `image_url` o `image_hash` + Messenger/WhatsApp CTA.<br>5. `POST /{ad_account_id}/ads`. |

**Flujo sugerido**
1. **Hydration**: Recupera los activos vinculados para la compañía (`ad_account_id`, `page_id`, `wa_number_id`).
2. **Campaign**: Crea campaña con `objective` y `special_ad_categories` (`MESSAGES`, `EMPLOYMENT`).
3. **Ad Set**: Configura presupuesto en centavos (`daily_budget`) y targeting (ciudades con `key` y `radius`, o países).
4. **Creative**: Si la imagen es pública, utiliza `image_url` directo en el creative (`object_story_spec` con `whatsapp_message`). Si no, sube imagen a `/{ad_account_id}/adimages` y usa el `hash`.
5. **Ads**: Crea un anuncio por variante, usando el creative creado. Respeta la bandera `activate_on_create`.
6. **Respuesta**: Devuelve IDs (`campaign_id`, `adset_id`, `creative_id`, `ad_id`) y estado (`ACTIVE/PAUSED`) al frontend.

**Consideraciones de robustez**
- En caso de fallo, aplica compensación: si se crea campaña pero falla el ad set, intenta borrar la campaña recién creada para evitar elementos huérfanos.
- Loguea la respuesta de Meta y guarda trazas en una tabla `meta_campaign_audit`.
- Maneja códigos de error comunes (`100 Invalid param`, `190 Access token has expired`, `368 Temporary blocked`, `1487795 WhatsApp business account not linked`).

### 2.6 Gestión opcional de anuncios

| Frontend | Método | Descripción | Meta endpoint |
| --- | --- | --- | --- |
| `/meta/ads?ad_account_id={id}` | GET | Lista anuncios y métricas resumidas. | `GET /{ad_account_id}/ads?fields=id,name,status,insights{impressions,reach,spend,actions}` |
| `/meta/ads/{ad_id}/status` | POST | Cambia estado (ACTIVE/PAUSED). | `POST /{ad_id}` con `status=ACTIVE/PAUSED` |
| `/meta/ads/{ad_id}/budget` | POST | Actualiza presupuesto del ad set. | `POST /{ad_set_id}` con `daily_budget={value}` (requiere mapear de ad a ad set). |

**Nota**: El wizard front muestra métricas básicas; adapta la respuesta a los tipos `MetaAdSummary` definidos en el frontend.

---

## 3. Arquitectura sugerida en el backend

1. **Service layer** (`MetaMarketingService`)
   - Encapsula las llamadas HTTP a Graph API.
   - Recibe `accessToken`, `businessId`, `apiVersion`.
   - Expuesta a controladores REST.

2. **Controller / Resolver**
   - Traduce el schema utilizado por el frontend (payloads y responses).
   - Centraliza manejo de errores y logging.

3. **Persistence**
   - Tablas de soporte:
     - `meta_company_assets`
     - `meta_role_blueprints` (si no existen)
     - `meta_campaign_audit` (historial de ejecuciones)

4. **Error handling & observability**
   - Implementa permisos defensivos antes de llamar a Meta.
   - Envía métricas (ej. a Datadog) por intento/éxito/fallo de publicación.

---

## 4. Checklist de implementación

1. [ ] Configurar variables de entorno y secretos de Meta.
2. [ ] Implementar el client HTTP hacia Graph API (axios/fetch) con manejo de rate limits.
3. [ ] Implementar endpoints REST descritos en la sección 2.
4. [ ] Persistir la vinculación de activos por compañía (`link-ad-account`).
5. [ ] Incluir el objeto `blueprint` en la respuesta de `/meta/companies/{business_unit_id}/roles`.
6. [ ] Probar flujo completo en sandbox: assets → targeting → full-campaign.
7. [ ] Documentar cómo refrescar tokens y monitorear el uso de API.
8. [ ] Añadir pruebas unitarias y de integración (mocks con `nock`/`msw`) para los servicios.

---

## 5. Recursos adicionales

- [Meta Marketing API – Campaigns](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign)
- [Targeting Search API](https://developers.facebook.com/docs/marketing-api/audiences/reference/targeting-search)
- [WhatsApp Business Accounts](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/whatsapp-business-account)
- [Best practices para manejo de tokens](https://developers.facebook.com/docs/graph-api/overview/authentication#tokens)

Con esta guía el equipo de backend puede implementar rápidamente las rutas necesarias y asegurar que el wizard del frontend opere únicamente sobre endpoints internos, manteniendo el contacto con Meta encapsulado y controlado. 
