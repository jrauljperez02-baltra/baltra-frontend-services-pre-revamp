// types.ts

/* ============ META ENTIDADES BÁSICAS ============ */
export interface MetaAdAccount {
  id: string
  account_id: string
  name: string
  currency?: string
  account_status?: number
  timezone_name?: string
}

export interface MetaPage {
  id: string
  name: string
  category?: string
}

export interface MetaWhatsAppNumber {
  id: string
  display_phone_number: string
  verified_name?: string
}

/* ============ VÍNCULOS / INPUTS ============ */
export interface CompanyAssetLinkInput {
  businessId?: string
  adAccountId: string
  pageId: string
  whatsappNumberId: string
  systemUserToken?: string
}

/* ============ CAMPAÑA / AD SET / CREATIVO / AD ============ */
export interface CampaignSettings {
  name: string
  objective: string
  specialAdCategories: string[]
  roleId?: number
  /** opcional: si el usuario decide usar una campaña existente */
  existingMetaCampaignId?: string
}

export type DistanceUnit = "kilometer" | "mile"

export interface GeoLocationCity {
  key: string
  name?: string
  radius?: number
  distanceUnit?: DistanceUnit
}

export interface GeoLocationCustom {
  latitude: number
  longitude: number
  radius: number
  distanceUnit: DistanceUnit
  address?: string | null
}

export interface TargetingGeoLocations {
  countries?: string[]
  cities?: GeoLocationCity[]
  customLocations?: GeoLocationCustom[]
  /** Meta location_types: home | recent | travel_in */
  locationTypes?: ("home" | "recent" | "travel_in")[]
}

export interface AdSetTargeting {
  ageMin: number
  ageMax: number
  genders: number[]           // Meta genders (1=male, 2=female) o []=all
  geoLocations: TargetingGeoLocations
}

export interface AdSetSettings {
  name: string
  // Tipo de presupuesto: diario o total (lifetime)
  budgetType?: "DAILY" | "LIFETIME"
  dailyBudgetCents: number
  lifetimeBudgetCents?: number
  // Objetivo de rendimiento del ad set
  optimizationGoal?: "CONVERSATIONS" | "LINK_CLICKS"
  startTime: string          // ISO
  endTime?: string           // ISO
  targeting: AdSetTargeting
}

export interface CreativeVariant {
  id: string
  primaryText: string
  title: string
  description: string
}

export interface CreativeSettings {
  imageUrl: string
  /** Data URL base64 (e.g., "data:image/png;base64,..."). If provided, the backend can upload the image directly. */
  imageBase64?: string
  callToAction?: string
  variants: CreativeVariant[]
}

export interface AdSettings {
  name: string
  activateOnCreate: boolean
}

/* ============ ESTADO DEL WIZARD ============ */
export interface WizardState {
  assets?: CompanyAssetLinkInput
  campaign?: CampaignSettings
  adSet?: AdSetSettings
  creative?: CreativeSettings
  ad?: AdSettings
}

/* ============ BLUEPRINTS (PLANTILLAS DE ROL) ============ */
/** Estructuras tal como pueden venir del backend/DB (snake_case compatibles) */
export interface BlueprintGeoCity {
  key: string
  name?: string
  radius?: number
  distance_unit?: DistanceUnit
}

export interface BlueprintGeoCustom {
  latitude: number
  longitude: number
  radius?: number
  distance_unit?: DistanceUnit
  address?: string | null
}

export interface BlueprintGeoLocations {
  countries?: string[]
  cities?: BlueprintGeoCity[]
  custom_locations?: BlueprintGeoCustom[]
  location_types?: ("home" | "recent" | "travel_in")[]
}

export interface BlueprintTargeting {
  age_min: number
  age_max: number
  geo_locations: BlueprintGeoLocations
}

export interface RoleBlueprint {
  role_id: number
  name_template: string
  objective: string
  special_ad_categories: { items: string[] }
  default_budget_cents?: number
  default_creative: {
    image_url?: string
    title?: string
    primaryText?: string
    description?: string
  }
  default_targeting: BlueprintTargeting
}

/* ============ RESPUESTAS & LISTADOS ============ */
export interface LocationSearchResult {
  key: string
  name: string
  type: string
  country_code: string
}

/** Request para crear la campaña completa hacia tu backend */
export interface FullCampaignRequest {
  business_unit_id: number
  role_id?: number
  /** si se usa una campaña existente, puedes enviarla aquí o dentro de `campaign` como convenga al backend */
  existing_meta_campaign_id?: string
  /** opcional: puedes enviar el page_id a nivel raíz para forzar/override */
  page_id?: string

  campaign: {
    name: string
    objective?: string
    special_ad_categories?: string[]
    status?: string
    buying_type?: string
  }

  ad_set: {
    name: string
    daily_budget?: number
    lifetime_budget?: number
    start_time: string
    end_time?: string
    status?: string
    optimization_goal?: string
    billing_event?: string
    destination_type?: string
    bid_strategy?: string
    targeting: {
      age_min: number
      age_max: number
      genders?: number[]
      geo_locations: {
        countries?: string[]
        cities?: Array<{
          key: string
          radius?: number
          distance_unit?: DistanceUnit
        }>
        custom_locations?: Array<{
          latitude: number
          longitude: number
          radius?: number
          distance_unit?: DistanceUnit
          address?: string | null
        }>
        location_types?: ("home" | "recent" | "travel_in")[]
      }
    }
  }

  creative: {
    image_url?: string
    image_base64?: string
    variants: Array<{
      primaryText: string
      title: string
      description: string
    }>
  }

  ad: {
    name: string
    activate_on_create: boolean
  }
}

export interface FullCampaignResponse {
  campaign_id: string
  adset_id: string
  creative_id: string
  ad_id: string
  status: string
}

/* ============ DASHBOARD / ANALYTICS ============ */
export interface MetaAdSummary {
  id: string
  name: string
  status: "ACTIVE" | "PAUSED" | "ARCHIVED"
  impressions: number
  reach: number
  spend: number
  conversations: number
  cpm: number
  cost_per_conversation?: number
}

export interface DashboardMetrics {
  conversations: number
  reach: number
  impressions: number
  spend: number
  cpm: number
  costPerConversation: number
  conversationsChange?: number
  reachChange?: number
  impressionsChange?: number
  spendChange?: number
}

/* ============ COPYS / ASSETS ============ */
export interface CopyTemplate {
  id: string
  position: string
  city: string
  primaryText: string
  headline: string
  description: string
}

export interface ImageAsset {
  id: string
  url: string
  name: string
  uploadedAt: string
}

/* ============ COMPAÑÍAS / ROLES / CAMPAÑAS EXISTENTES ============ */
export interface MetaAdAccountListMeta {
  linkedAdAccountId?: string
  linkedPageId?: string
  linkedWaNumberId?: string
  businessId?: string
  needsLink?: boolean
  message?: string | null
}

export interface MetaAdAccountListResponse {
  data: MetaAdAccount[]
  meta?: MetaAdAccountListMeta
}

export interface MetaAdAccountLinkVerification {
  linked: boolean
  business_unit_id?: number | null
  linked_ad_account_id?: string | null
  message?: string | null
}

export interface CompanyDefaults {
  campaign?: Record<string, unknown>
  ad_set?: Record<string, unknown>
  creative?: Record<string, unknown>
  [key: string]: unknown
}

export interface CompanyRoleLocation {
  latitude: number
  longitude: number
  radius?: number | null
  distanceUnit?: DistanceUnit | null
  address?: string | null
}

export interface CompanyRole {
  role_id: number
  business_unit_id: number
  name: string
  default_role?: boolean
  shift?: string | null
  set_id?: number | null
  role_info?: Record<string, unknown> | null
  blueprint?: RoleBlueprint
  location?: CompanyRoleLocation | null
}

export interface CompanyAd {
  metaAdId?: string
  creativeId?: string
  name?: string
  status?: string
}

export interface CompanyAdSet {
  metaAdSetId?: string
  name?: string
  status?: string
  dailyBudgetCents?: number
  ads?: CompanyAd[]
}

export interface CompanyCampaign {
  metaCampaignId?: string
  name?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  adSets?: CompanyAdSet[]
}

export interface CompanySummary {
  id: number
  name: string
  businessId?: string
  adAccount?: MetaAdAccount
  page?: MetaPage
  whatsappNumber?: MetaWhatsAppNumber
  systemUserToken?: string
  hasSystemUserToken?: boolean
  defaults?: CompanyDefaults
  campaigns?: CompanyCampaign[]
}

/* ============ TARGETING PRESETS OPCIONALES ============ */
export interface TargetingPreset {
  id: string
  name: string
  ageMin: number
  ageMax: number
  genders: string[]
  countries: string[]
}
