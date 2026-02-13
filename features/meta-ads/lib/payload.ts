import type { FullCampaignRequest, WizardState } from "../types"

function assertDefined<T>(value: T | undefined, message: string): T {
  if (value === undefined || value === null) {
    throw new Error(message)
  }
  return value
}

function normalizeObjective(obj?: string): string {
  const val = (obj || "").toUpperCase().trim()
  if (val === "MESSAGES") return "OUTCOME_ENGAGEMENT"
  if (!val) return "OUTCOME_ENGAGEMENT"
  return val
}

export function buildFullCampaignPayload(state: WizardState, companyId: number): FullCampaignRequest {
  const campaign = assertDefined(state.campaign, "Faltan los datos de campaña")
  const adSet = assertDefined(state.adSet, "Faltan los datos del conjunto de anuncios")
  const creative = assertDefined(state.creative, "Faltan los datos creativos")
  const ad = assertDefined(state.ad, "Faltan los datos del anuncio")
  const assets = assertDefined(state.assets, "Faltan los activos vinculados")

  const creativePayload: FullCampaignRequest["creative"] = {
    variants: creative.variants.map((variant) => ({
      primaryText: variant.primaryText,
      title: variant.title,
      description: variant.description,
    })),
  }

  if (creative.imageBase64 && creative.imageBase64.startsWith("data:image")) {
    creativePayload.image_base64 = creative.imageBase64
  } else if (creative.imageUrl) {
    creativePayload.image_url = creative.imageUrl
  } else {
    throw new Error("Falta la imagen del creativo (sube un archivo o proporciona una URL)")
  }

  // Determinar presupuesto y validaciones
  const budgetType = adSet.budgetType === "LIFETIME" ? "LIFETIME" : "DAILY"
  const optGoal = adSet.optimizationGoal === "LINK_CLICKS" ? "LINK_CLICKS" : "CONVERSATIONS"

  const adSetPayload: FullCampaignRequest["ad_set"] = {
    name: adSet.name,
    start_time: adSet.startTime,
    end_time: adSet.endTime,
    status: "PAUSED",
    optimization_goal: optGoal,
    billing_event: "IMPRESSIONS",
    destination_type: "WHATSAPP",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    targeting: {
      age_min: adSet.targeting.ageMin,
      age_max: adSet.targeting.ageMax,
      genders: adSet.targeting.genders.length > 0 ? adSet.targeting.genders : undefined,
      geo_locations: {
        countries: adSet.targeting.geoLocations.countries,
        cities:
          adSet.targeting.geoLocations.cities?.map((city) => ({
            key: city.key,
            radius: city.radius,
            distance_unit: city.distanceUnit,
          })) || undefined,
        custom_locations:
          adSet.targeting.geoLocations.customLocations?.map((location) => ({
            latitude: location.latitude,
            longitude: location.longitude,
            radius: location.radius,
            distance_unit: location.distanceUnit ?? "kilometer",
            address: location.address ?? undefined,
          })) || undefined,
      },
    },
  }

  if (budgetType === "LIFETIME") {
    if (!adSet.lifetimeBudgetCents || adSet.lifetimeBudgetCents <= 0) {
      throw new Error("Cuando el tipo de presupuesto es 'Total', debes indicar lifetime_budget mayor a 0")
    }
    if (!adSetPayload.end_time) {
      throw new Error("Cuando el presupuesto es de por vida, debes definir fecha de fin (end_time)")
    }
    adSetPayload.lifetime_budget = adSet.lifetimeBudgetCents
  } else {
    if (!adSet.dailyBudgetCents || adSet.dailyBudgetCents <= 0) {
      throw new Error("Ingresa un presupuesto diario mayor a 0")
    }
    adSetPayload.daily_budget = adSet.dailyBudgetCents
  }

  return {
    business_unit_id: companyId,
    role_id: campaign.roleId,
    page_id: assets.pageId,
    campaign: {
      name: campaign.name,
      objective: normalizeObjective(campaign.objective),
      special_ad_categories: campaign.specialAdCategories.length > 0 ? campaign.specialAdCategories : undefined,
      status: "PAUSED",
      buying_type: "AUCTION",
    },
    ad_set: adSetPayload,
    creative: creativePayload,
    ad: {
      name: ad.name,
      activate_on_create: ad.activateOnCreate,
    },
  }
}
