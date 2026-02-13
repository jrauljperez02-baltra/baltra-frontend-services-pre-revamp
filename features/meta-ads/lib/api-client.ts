import { BACKEND_BASE_URL } from "@/config/env"
import type {
  CompanyAssetLinkInput,
  CompanySummary,
  CompanyCampaign,
  CompanyAdSet,
  CompanyAd,
  FullCampaignRequest,
  FullCampaignResponse,
  LocationSearchResult,
  MetaAdAccount,
  MetaPage,
  MetaWhatsAppNumber,
  RoleBlueprint,
  MetaAdAccountListResponse,
  MetaAdAccountListMeta,
  MetaAdAccountLinkVerification,
  CompanyRole,
  CompanyRoleLocation,
} from "../types"

interface SearchLocationsParams {
  actId: string
  query: string
  locationTypes?: string[]
  limit?: number
}

interface ApiError extends Error {
  status?: number
}
const baseUrl = (BACKEND_BASE_URL || "").replace(/\/$/, "")
const API_PREFIX = baseUrl ? `${baseUrl}/api/v1` : "/api/v1"

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }
  if (payload && typeof payload === "object") {
    const maybeData = (payload as { data?: unknown; items?: unknown }).data ?? (payload as { items?: unknown }).items
    if (Array.isArray(maybeData)) {
      return maybeData as T[]
    }
  }
  return []
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return null as unknown as T
    }
    return (await response.json()) as T
  }

  let message = "Meta Ads API request failed"
  try {
    const payload = await response.clone().json()
    message = payload?.error || JSON.stringify(payload)
  } catch {
    try {
      message = await response.text()
    } catch {
      message = "Meta Ads API request failed"
    }
  }

  const error: ApiError = new Error(message || "Meta Ads API request failed")
  error.status = response.status
  throw error
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin
  const url = new URL(`${API_PREFIX}${path}`, origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    })
  }
  return url.toString()
}


export class MetaAdsApiClient {
  private parseAccountPayload(payload: unknown): MetaAdAccountListResponse {
    let meta: MetaAdAccountListMeta | undefined
    let data: MetaAdAccount[] = []

    if (payload && typeof payload === "object") {
      const record = payload as Record<string, unknown>
      const maybeMeta = record.meta
      if (maybeMeta && typeof maybeMeta === "object") {
        const metaObj = maybeMeta as Record<string, unknown>
        const getString = (obj: Record<string, unknown>, candidates: string[]): string | undefined => {
          for (const key of candidates) {
            const value = obj[key]
            if (typeof value === "string" && value.length > 0) {
              return value
            }
          }
          return undefined
        }

        const linkedRaw = getString(metaObj, ["linked_ad_account_id", "linkedAdAccountId"])
        const linkedPageRaw = getString(metaObj, ["linked_page_id", "linkedPageId"])
        const linkedWaRaw = getString(metaObj, ["linked_wa_number_id", "linkedWaNumberId"])
        const businessIdRaw = getString(metaObj, ["business_id", "businessId"])
        meta = {
          linkedAdAccountId:
            typeof linkedRaw === "string" && linkedRaw.length > 0 ? linkedRaw : undefined,
          linkedPageId: linkedPageRaw,
          linkedWaNumberId: linkedWaRaw,
          businessId: businessIdRaw,
          needsLink:
            typeof metaObj.needs_link === "boolean"
              ? metaObj.needs_link
              : typeof metaObj.needsLink === "boolean"
                ? metaObj.needsLink
                : undefined,
          message:
            typeof metaObj.message === "string"
              ? metaObj.message
              : metaObj.message === null
                ? null
                : undefined,
        }
      }
      if (Array.isArray(record.data)) {
        data = record.data as MetaAdAccount[]
        return { data, meta }
      }
    }

    data = unwrapList<MetaAdAccount>(payload)
    return { data, meta }
  }

  async getClientAdAccounts(): Promise<MetaAdAccountListResponse> {
    const payload = await parseResponse<unknown>(await fetch(buildUrl("/meta/business/client-ad-accounts")))
    return this.parseAccountPayload(payload)
  }

  async getOwnedAdAccounts(): Promise<MetaAdAccount[]> {
    const payload = await parseResponse<unknown>(await fetch(buildUrl("/meta/business/owned-ad-accounts")))
    return unwrapList<MetaAdAccount>(payload)
  }

  async listAdAccounts(): Promise<MetaAdAccountListResponse> {
    const [clientResult, ownedResult] = await Promise.allSettled([
      this.getClientAdAccounts().then((response) => response),
      this.getOwnedAdAccounts(),
    ])
    const accounts: MetaAdAccount[] = []
    let meta: MetaAdAccountListMeta | undefined

    if (clientResult.status === "fulfilled") {
      accounts.push(...clientResult.value.data)
      meta = clientResult.value.meta
    }
    if (ownedResult.status === "fulfilled") {
      accounts.push(...ownedResult.value)
    }

    // Remove duplicates by id
    const unique = new Map<string, MetaAdAccount>()
    accounts.forEach((account) => {
      const key = account.id || account.account_id
      if (key) {
        unique.set(String(key), account)
      }
    })

    return { data: Array.from(unique.values()), meta }
  }

  async verifyAdAccountLink(adAccountId: string): Promise<MetaAdAccountLinkVerification> {
    const payload = await parseResponse<MetaAdAccountLinkVerification>(
      await fetch(buildUrl("/meta/ad-accounts/verify-link"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad_account_id: adAccountId.replace(/^act_/, "") }),
      }),
    )
    return payload
  }

  async getCompanies(): Promise<CompanySummary[]> {
    const endpoints = ["/meta/companies/linked-assets", "/meta/companies"]
    let lastError: unknown = null

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(buildUrl(endpoint))
        if (response.status === 404) {
          continue
        }

        const payload = await parseResponse<unknown>(response)
        const items = unwrapList<unknown>(payload)
        return items
          .map((item) => this.normalizeCompanySummary(item))
          .filter((item): item is CompanySummary => item !== null)
      } catch (error) {
        lastError = error
        const status = typeof error === "object" && error && "status" in error ? (error as ApiError).status : undefined
        if (status === 404) {
          continue
        }
        throw error
      }
    }

    if (lastError) {
      throw lastError
    }

    throw new Error("No encontramos un endpoint disponible para listar compañías vinculadas a Meta.")
  }

  async getCompanyRoles(companyId: number): Promise<CompanyRole[]> {
    const payload = await parseResponse<unknown>(await fetch(buildUrl(`/meta/companies/${companyId}/roles`)))
    const items = unwrapList<unknown>(payload)
    return items
      .map((item) => this.normalizeCompanyRole(item))
      .filter((role): role is CompanyRole => role !== null)
  }


  async syncCompanyCampaigns(companyId: number): Promise<CompanyCampaign[]> {
    const response = await fetch(buildUrl(`/meta/companies/${companyId}/sync-campaigns`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    const payload = await parseResponse<unknown>(response)
    if (payload && typeof payload === "object") {
      const record = payload as Record<string, unknown>
      return this.normalizeCompanyCampaigns(record.campaigns)
    }
    return []
  }

  async getPages(adAccountId: string): Promise<MetaPage[]> {
    const payload = await parseResponse<unknown>(
      await fetch(buildUrl("/meta/pages", { ad_account_id: adAccountId.replace(/^act_/, "") })),
    )
    return unwrapList<MetaPage>(payload)
  }

  async getWhatsAppNumbers(pageId: string): Promise<MetaWhatsAppNumber[]> {
    const payload = await parseResponse<unknown>(
      await fetch(buildUrl("/meta/whatsapp-numbers", { page_id: pageId })),
    )
    return unwrapList<MetaWhatsAppNumber>(payload)
  }

  async linkCompanyAssets(companyId: number, payload: CompanyAssetLinkInput) {
    const requestBody: Record<string, unknown> = {
      ad_account_id: payload.adAccountId.replace(/^act_/, ""),
      page_id: payload.pageId,
      wa_number_id: payload.whatsappNumberId,
      system_user_token: payload.systemUserToken,
    }

    if (payload.businessId) {
      requestBody.business_id = payload.businessId
    }

    const response = await fetch(buildUrl(`/meta/companies/${companyId}/link-ad-account`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })

    return parseResponse<Record<string, unknown>>(response)
  }

  async searchLocations({ actId, query, locationTypes = ["city"], limit = 10 }: SearchLocationsParams) {
    const params: Record<string, string> = {
      q: query,
      location_types: JSON.stringify(locationTypes),
      limit: String(limit),
    }
    const response = await fetch(
      buildUrl(`/meta/act/${actId.replace(/^act_/, "")}/targetingsearch`, params),
    )
    const payload = await parseResponse<unknown>(response)
    return unwrapList<LocationSearchResult>(payload)
  }

  async createFullCampaign(payload: FullCampaignRequest): Promise<FullCampaignResponse> {
    const response = await fetch(buildUrl("/meta/full-campaign"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    return parseResponse<FullCampaignResponse>(response)
  }

  async getAds(adAccountId?: string, companyId?: number) {
    const params: Record<string, string> | undefined = adAccountId || companyId ? {
      ...(adAccountId ? { ad_account_id: adAccountId.replace(/^act_/, "") } : {}),
      ...(companyId ? { business_unit_id: String(companyId) } : {}),
    } : undefined
    const payload = await parseResponse<unknown>(
      await fetch(buildUrl("/meta/ads", params)),
    )
    return unwrapList<any>(payload)
  }

  async updateAdStatus(adId: string, companyId: number, status: "ACTIVE" | "PAUSED") {
    const payload: Record<string, string | number> = { business_unit_id: companyId, status }
    const response = await fetch(buildUrl(`/meta/ads/${adId}/status`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    return parseResponse<Record<string, unknown>>(response)
  }

  async updateAdBudget(adId: string, companyId: number, dailyBudgetCents: number) {
    const payload: Record<string, number> & { business_unit_id: number } = { business_unit_id: companyId, daily_budget_cents: dailyBudgetCents }
    const response = await fetch(buildUrl(`/meta/ads/${adId}/budget`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    return parseResponse<Record<string, unknown>>(response)
  }

  // Campaign Management helpers
  async getCompanyCampaigns(companyId: number, sync?: boolean) {
    const params = sync ? { sync: "true" } : undefined
    const response = await fetch(buildUrl(`/meta/companies/${companyId}/campaigns`, params))
    const payload = await parseResponse<unknown>(response)
    const items = unwrapList<unknown>(payload)
    return this.normalizeCompanyCampaigns(items)
  }

  async updateCampaignStatus(campaignId: string, companyId: number, status: "ACTIVE" | "PAUSED" | "ARCHIVED") {
    const response = await fetch(buildUrl(`/meta/campaigns/${campaignId}/status`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_unit_id: companyId, status }),
    })
    return parseResponse<Record<string, unknown>>(response)
  }

  async updateAdSetStatus(adSetId: string, companyId: number, status: "ACTIVE" | "PAUSED" | "ARCHIVED") {
    const response = await fetch(buildUrl(`/meta/adsets/${adSetId}/status`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_unit_id: companyId, status }),
    })
    return parseResponse<Record<string, unknown>>(response)
  }

  private normalizeCompanySummary(payload: unknown): CompanySummary | null {
    if (!payload || typeof payload !== "object") {
      return null
    }

    const record = payload as Record<string, unknown>
    const idValue = record.id ?? record.business_unit_id ?? record.companyId
    const id =
      typeof idValue === "number"
        ? idValue
        : typeof idValue === "string" && idValue.length > 0
          ? Number.parseInt(idValue, 10)
          : undefined

    if (!id || Number.isNaN(id)) {
      return null
    }

    const nameValue = record.name ?? record.company_name ?? record.companyName
    const name = typeof nameValue === "string" && nameValue.length > 0 ? nameValue : undefined

    if (!name) {
      return null
    }

    const assetsSource = this.pickRecord(record.meta_assets) ?? this.pickRecord(record.assets)

    const businessId =
      this.pickString(record, ["business_id", "businessId"]) ??
      (assetsSource ? this.pickString(assetsSource, ["business_id", "businessId"]) : undefined)

    const adAccountRaw =
      this.pickRecord(record["ad_account"]) ??
      (assetsSource ? this.pickRecord(assetsSource["ad_account"]) : undefined) ??
      (assetsSource && typeof assetsSource["ad_account_id"] !== "undefined"
        ? { id: assetsSource["ad_account_id"] }
        : undefined)

    const pageRaw =
      this.pickRecord(record["page"]) ??
      (assetsSource ? this.pickRecord(assetsSource["page"]) : undefined) ??
      (assetsSource && typeof assetsSource["page_id"] !== "undefined" ? { id: assetsSource["page_id"] } : undefined)

    const whatsappRaw =
      this.pickRecord(record["whatsapp_number"]) ??
      (assetsSource ? this.pickRecord(assetsSource["whatsapp_number"]) : undefined) ??
      (assetsSource && typeof assetsSource["wa_number_id"] !== "undefined"
        ? { id: assetsSource["wa_number_id"] }
        : undefined)

    const systemUserToken =
      this.pickString(record, ["system_user_token", "systemUserToken"]) ??
      (assetsSource ? this.pickString(assetsSource, ["system_user_token", "systemUserToken"]) : undefined)

    const hasSystemUserToken =
      this.pickBoolean(record, ["has_system_user_token", "hasSystemUserToken"]) ??
      (assetsSource ? this.pickBoolean(assetsSource, ["has_system_user_token", "hasSystemUserToken"]) : undefined) ??
      (systemUserToken ? true : undefined)

    const defaults = this.pickRecord(record.defaults) ?? this.pickRecord(record["defaults"])
    const campaigns = this.normalizeCompanyCampaigns(
      Array.isArray((record as { campaigns?: unknown[] }).campaigns)
        ? (record as { campaigns?: unknown[] }).campaigns
        : assetsSource && Array.isArray((assetsSource as { campaigns?: unknown[] }).campaigns)
          ? (assetsSource as { campaigns?: unknown[] }).campaigns
          : undefined,
    )

    return {
      id,
      name,
      businessId,
      adAccount: this.normalizeAdAccount(adAccountRaw),
      page: this.normalizePage(pageRaw),
      whatsappNumber: this.normalizeWhatsAppNumber(whatsappRaw),
      systemUserToken,
      hasSystemUserToken,
      defaults: defaults ?? undefined,
      campaigns: campaigns.length > 0 ? campaigns : undefined,
    }
  }

  private pickRecord(value: unknown): Record<string, unknown> | undefined {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
    return undefined
  }

  private pickString(
    source: Record<string, unknown> | undefined,
    keys: string[],
  ): string | undefined {
    if (!source) return undefined
    for (const key of keys) {
      const value = source[key]
      if (typeof value === "string" && value.length > 0) {
        return value
      }
      if (typeof value === "number" && Number.isFinite(value)) {
        return String(value)
      }
    }
    return undefined
  }

  private pickBoolean(source: Record<string, unknown> | undefined, keys: string[]): boolean | undefined {
    if (!source) return undefined
    for (const key of keys) {
      const value = source[key]
      if (typeof value === "boolean") {
        return value
      }
      if (typeof value === "number") {
        if (value === 1) return true
        if (value === 0) return false
      }
      if (typeof value === "string") {
        if (value.toLowerCase() === "true") return true
        if (value.toLowerCase() === "false") return false
      }
    }
    return undefined
  }

  private pickNumber(source: Record<string, unknown> | undefined, keys: string[]): number | undefined {
    if (!source) return undefined
    for (const key of keys) {
      const value = source[key]
      if (typeof value === "number" && Number.isFinite(value)) {
        return value
      }
      if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number.parseInt(value, 10)
        if (!Number.isNaN(parsed)) {
          return parsed
        }
      }
    }
    return undefined
  }

  private normalizeAdAccount(payload: Record<string, unknown> | undefined): MetaAdAccount | undefined {
    if (!payload) {
      return undefined
    }

    const id = this.pickString(payload, ["id", "account_id"])
    if (!id) {
      return undefined
    }

    const name = this.pickString(payload, ["name"]) ?? id
    const accountIdRaw = this.pickString(payload, ["account_id"])
    const accountId = accountIdRaw ?? id.replace(/^act_/, "")

    const account: MetaAdAccount = {
      id,
      account_id: accountId,
      name,
    }

    const currency = this.pickString(payload, ["currency"])
    if (currency) {
      account.currency = currency
    }

    const timezone = this.pickString(payload, ["timezone_name"])
    if (timezone) {
      account.timezone_name = timezone
    }

    const statusValue = payload.account_status
    if (typeof statusValue === "number") {
      account.account_status = statusValue
    }

    return account
  }

  private normalizePage(payload: Record<string, unknown> | undefined): MetaPage | undefined {
    if (!payload) {
      return undefined
    }

    const id = this.pickString(payload, ["id"])
    const name = this.pickString(payload, ["name"])

    if (!id) {
      return undefined
    }

    const pageName = name && name.length > 0 ? name : id
    const page: MetaPage = { id, name: pageName }

    const category = this.pickString(payload, ["category"])
    if (category) {
      page.category = category
    }

    return page
  }

  private normalizeWhatsAppNumber(
    payload: Record<string, unknown> | undefined,
  ): MetaWhatsAppNumber | undefined {
    if (!payload) {
      return undefined
    }

    const id = this.pickString(payload, ["id"])
    const number =
      this.pickString(payload, ["display_phone_number", "phone_number", "number"]) ??
      this.pickString(payload, ["wa_number_id"])

    if (!id || !number) {
      return undefined
    }

    const result: MetaWhatsAppNumber = {
      id,
      display_phone_number: number,
    }

    const verifiedName = this.pickString(payload, ["verified_name", "name"])
    if (verifiedName) {
      result.verified_name = verifiedName
    }

    return result
  }

  private normalizeCompanyCampaigns(source: unknown): CompanyCampaign[] {
    if (!Array.isArray(source)) {
      return []
    }

    return (source as unknown[])
      .map((item) => this.normalizeCompanyCampaign(item))
      .filter((item): item is CompanyCampaign => item !== null)
  }

  private normalizeCompanyCampaign(payload: unknown): CompanyCampaign | null {
    if (!payload || typeof payload !== "object") {
      return null
    }

    const record = payload as Record<string, unknown>
    const metaCampaignId = this.pickString(record, ["meta_campaign_id", "campaign_id", "id"])
    const name = this.pickString(record, ["name"])
    const status = this.pickString(record, ["status"])
    const createdAt = this.pickString(record, ["created_at", "createdAt"])
    const updatedAt = this.pickString(record, ["updated_at", "updatedAt"])

    if (!metaCampaignId && !name) {
      return null
    }

    const adSetsSource = Array.isArray((record as { ad_sets?: unknown[] }).ad_sets)
      ? (record as { ad_sets?: unknown[] }).ad_sets
      : Array.isArray((record as { adSets?: unknown[] }).adSets)
        ? (record as { adSets?: unknown[] }).adSets
        : undefined

    const adSets = this.normalizeCompanyAdSets(adSetsSource)

    return {
      metaCampaignId: metaCampaignId ?? undefined,
      name,
      status,
      createdAt,
      updatedAt,
      adSets: adSets.length > 0 ? adSets : undefined,
    }
  }

  private normalizeCompanyAdSets(source: unknown): CompanyAdSet[] {
    if (!Array.isArray(source)) {
      return []
    }

    return (source as unknown[])
      .map((item) => this.normalizeCompanyAdSet(item))
      .filter((item): item is CompanyAdSet => item !== null)
  }

  private normalizeCompanyAdSet(payload: unknown): CompanyAdSet | null {
    if (!payload || typeof payload !== "object") {
      return null
    }

    const record = payload as Record<string, unknown>
    const metaAdSetId = this.pickString(record, ["meta_ad_set_id", "ad_set_id", "id"])
    const name = this.pickString(record, ["name"])
    const status = this.pickString(record, ["status"])
    const dailyBudgetCents = this.pickNumber(record, ["daily_budget_cents", "dailyBudgetCents"])

    if (!metaAdSetId && !name) {
      return null
    }

    const adsSource = Array.isArray((record as { ads?: unknown[] }).ads)
      ? (record as { ads?: unknown[] }).ads
      : undefined

    const ads = this.normalizeCompanyAds(adsSource)

    return {
      metaAdSetId: metaAdSetId ?? undefined,
      name,
      status,
      dailyBudgetCents: dailyBudgetCents ?? undefined,
      ads: ads.length > 0 ? ads : undefined,
    }
  }

  private normalizeCompanyAds(source: unknown): CompanyAd[] {
    if (!Array.isArray(source)) {
      return []
    }

    return (source as unknown[])
      .map((item) => this.normalizeCompanyAd(item))
      .filter((item): item is CompanyAd => item !== null)
  }

  private normalizeCompanyAd(payload: unknown): CompanyAd | null {
    if (!payload || typeof payload !== "object") {
      return null
    }

    const record = payload as Record<string, unknown>
    const metaAdId = this.pickString(record, ["meta_ad_id", "ad_id", "id"])
    const name = this.pickString(record, ["name"])
    const status = this.pickString(record, ["status"])
    const creativeId = this.pickString(record, ["creative_id", "creativeId"])

    if (!metaAdId && !name && !creativeId) {
      return null
    }

    return {
      metaAdId: metaAdId ?? undefined,
      name,
      status,
      creativeId: creativeId ?? undefined,
    }
  }

  private normalizeCompanyRole(payload: unknown): CompanyRole | null {
    if (!payload || typeof payload !== "object") {
      return null
    }

    const record = payload as Record<string, unknown>
    const roleId = this.pickNumber(record, ["role_id", "id", "roleId"])
    const companyId = this.pickNumber(record, ["business_unit_id", "companyId"])

    if (!roleId || !companyId) {
      return null
    }

    const name = this.pickString(record, ["name", "label", "title"]) ?? `Rol ${roleId}`
    const defaultRole = this.pickBoolean(record, ["default_role", "defaultRole"])
    const shift = this.pickString(record, ["shift"]) ?? null
    const setId = this.pickNumber(record, ["set_id", "setId"])

    const roleInfoSource = this.pickRecord(record.role_info) ?? this.pickRecord(record.roleInfo)
    let roleInfo: Record<string, unknown> | null = roleInfoSource ? { ...roleInfoSource } : null

    let blueprintPayload = this.pickRecord(record.blueprint)
    if (!blueprintPayload && roleInfoSource) {
      const nested = (roleInfoSource as Record<string, unknown>).blueprint
      if (nested && typeof nested === "object" && !Array.isArray(nested)) {
        blueprintPayload = nested as Record<string, unknown>
      }
    }
    const blueprint = this.normalizeRoleBlueprint(blueprintPayload, roleId)

    const locationSource =
      this.pickRecord(record.location) ??
      (roleInfoSource && typeof roleInfoSource === "object"
        ? this.pickRecord((roleInfoSource as Record<string, unknown>).location)
        : undefined)
    const location = this.normalizeRoleLocation(locationSource)

    if (roleInfo && "blueprint" in roleInfo) {
      delete (roleInfo as Record<string, unknown> & { blueprint?: unknown }).blueprint
    }

    return {
      role_id: roleId,
      business_unit_id: companyId,
      name,
      default_role: defaultRole,
      shift,
      set_id: setId ?? null,
      role_info: roleInfo ?? null,
      blueprint,
      location: location ?? null,
    }
  }

  private normalizeRoleLocation(payload: Record<string, unknown> | undefined): CompanyRoleLocation | undefined {
    if (!payload) {
      return undefined
    }

    const parseFloatValue = (value: unknown): number | undefined => {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value
      }
      if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number.parseFloat(value)
        if (!Number.isNaN(parsed)) {
          return parsed
        }
      }
      return undefined
    }

    const latitude =
      parseFloatValue(payload.latitude) ??
      parseFloatValue(payload.lat)
    const longitude =
      parseFloatValue(payload.longitude) ??
      parseFloatValue(payload.lng) ??
      parseFloatValue(payload.lon)

    if (latitude === undefined || longitude === undefined) {
      return undefined
    }

    const radius =
      parseFloatValue(payload.radius) ??
      parseFloatValue(payload.radius_km) ??
      parseFloatValue(payload.radiusKm)

    const unitRaw = this.pickString(payload, ["distance_unit", "distanceUnit", "unit"])
    const normalizedUnit =
      unitRaw && unitRaw.toLowerCase() === "mile"
        ? "mile"
        : unitRaw && unitRaw.toLowerCase() === "kilometer"
          ? "kilometer"
          : undefined

    const address = this.pickString(payload, ["address", "label", "name"])

    return {
      latitude,
      longitude,
      radius: radius ?? undefined,
      distanceUnit: normalizedUnit ?? undefined,
      address: address ?? undefined,
    }
  }

  private normalizeRoleBlueprint(
    payload: Record<string, unknown> | undefined,
    fallbackRoleId: number,
  ): RoleBlueprint | undefined {
    if (!payload) {
      return undefined
    }

    const roleId = this.pickNumber(payload, ['role_id', 'roleId']) ?? fallbackRoleId
    const nameTemplate = this.pickString(payload, ['name_template', 'nameTemplate'])
    const objective = this.pickString(payload, ['objective'])

    const specialRaw =
      this.pickRecord(payload.special_ad_categories) ?? this.pickRecord(payload.specialAdCategories)
    let specialItems: string[] | undefined
    if (specialRaw) {
      const items = (specialRaw.items as unknown) ?? (specialRaw['items'] as unknown)
      if (Array.isArray(items)) {
        specialItems = items.filter((item): item is string => typeof item === 'string' && item.length > 0)
      }
    } else if (Array.isArray((payload as { special_ad_categories?: unknown[] }).special_ad_categories)) {
      specialItems = ((payload as { special_ad_categories?: unknown[] }).special_ad_categories ?? []).filter(
        (item): item is string => typeof item === 'string' && item.length > 0,
      )
    }

    const targetingRaw =
      this.pickRecord(payload.default_targeting) ?? this.pickRecord(payload.defaultTargeting)
    const creativeRaw =
      this.pickRecord(payload.default_creative) ?? this.pickRecord(payload.defaultCreative)

    if (!nameTemplate && !objective && !specialItems && !targetingRaw && !creativeRaw) {
      return undefined
    }

    const targeting =
      targetingRaw && typeof targetingRaw === 'object'
        ? {
            age_min: this.pickNumber(targetingRaw as Record<string, unknown>, ['age_min', 'ageMin']) ?? 18,
            age_max: this.pickNumber(targetingRaw as Record<string, unknown>, ['age_max', 'ageMax']) ?? 65,
            geo_locations: {
              countries: Array.isArray((targetingRaw as { countries?: unknown }).countries)
                ? ((targetingRaw as { countries?: unknown }).countries as unknown[]).filter(
                    (item): item is string => typeof item === 'string' && item.length > 0,
                  )
                : Array.isArray(
                        (targetingRaw as { geo_locations?: { countries?: unknown[] } }).geo_locations?.countries,
                      )
                  ? (
                      (targetingRaw as { geo_locations?: { countries?: unknown[] } }).geo_locations?.countries ?? []
                    ).filter((item): item is string => typeof item === 'string' && item.length > 0)
                  : undefined,
              cities: Array.isArray((targetingRaw as { cities?: unknown[] }).cities)
                ? ((targetingRaw as { cities?: unknown[] }).cities ?? []).filter(
                    (city): city is { key: string; radius?: number; distance_unit?: string; distanceUnit?: string } =>
                      !!city && typeof city === 'object' && typeof (city as { key?: unknown }).key === 'string',
                  )
                : Array.isArray(
                        (targetingRaw as { geo_locations?: { cities?: unknown[] } }).geo_locations?.cities,
                      )
                  ? (
                      (targetingRaw as { geo_locations?: { cities?: unknown[] } }).geo_locations?.cities ?? []
                    ).filter(
                      (city): city is { key: string; radius?: number; distance_unit?: string; distanceUnit?: string } =>
                        !!city && typeof city === 'object' && typeof (city as { key?: unknown }).key === 'string',
                    )
                  : undefined,
            },
          }
        : undefined

    const creative =
      creativeRaw && typeof creativeRaw === 'object'
        ? {
            primaryText: this.pickString(creativeRaw as Record<string, unknown>, ['primaryText', 'primary_text']) ?? '',
            title: this.pickString(creativeRaw as Record<string, unknown>, ['title']) ?? '',
            description:
              this.pickString(creativeRaw as Record<string, unknown>, ['description']) ??
              this.pickString(creativeRaw as Record<string, unknown>, ['body']) ??
              '',
            image_url: this.pickString(creativeRaw as Record<string, unknown>, ['image_url', 'imageUrl']) ?? undefined,
          }
        : undefined

    const blueprint: RoleBlueprint = {
      role_id: roleId,
      name_template: nameTemplate ?? '',
      objective: objective ?? 'OUTCOME_ENGAGEMENT',
      special_ad_categories: { items: specialItems ?? ['EMPLOYMENT'] },
      default_targeting: targeting
        ? {
            age_min: targeting.age_min,
            age_max: targeting.age_max,
            geo_locations: {
              countries: targeting.geo_locations.countries,
              cities: targeting.geo_locations.cities?.map((city) => ({
                key: (city as { key: string }).key,
                radius: (city as { radius?: number }).radius,
                distance_unit:
                  (city as { distance_unit?: 'kilometer' | 'mile' }).distance_unit ??
                  ((city as { distanceUnit?: string }).distanceUnit as 'kilometer' | 'mile' | undefined),
              })),
            },
          }
        : {
            age_min: 18,
            age_max: 65,
            geo_locations: { countries: ['MX'] },
          },
      default_creative: {
        primaryText: creative?.primaryText ?? '',
        title: creative?.title ?? '',
        description: creative?.description ?? '',
        image_url: creative?.image_url,
      },
      default_budget_cents: this.pickNumber(payload, ['default_budget_cents', 'defaultBudgetCents']),
    }

    return blueprint
  }

}

export const metaAdsApi = new MetaAdsApiClient()
