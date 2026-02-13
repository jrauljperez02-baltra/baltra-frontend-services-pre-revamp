// Meta Marketing API Service
// Handles all interactions with the Facebook/Meta Marketing API

interface MetaApiConfig {
  accessToken: string
  apiVersion?: string
}

export class MetaApiService {
  private accessToken: string
  private apiVersion: string
  private baseUrl: string

  constructor(config: MetaApiConfig) {
    this.accessToken = config.accessToken
    this.apiVersion = config.apiVersion || "v18.0"
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || "Meta API request failed")
    }

    return response.json()
  }

  // Ad Accounts
  async getAdAccounts() {
    return this.makeRequest(
      `/me/adaccounts?access_token=${this.accessToken}&fields=id,name,account_id,currency,timezone_name`,
    )
  }

  async getAdAccount(adAccountId: string) {
    return this.makeRequest(
      `/${adAccountId}?access_token=${this.accessToken}&fields=id,name,account_id,currency,timezone_name,amount_spent,balance`,
    )
  }

  // Pages
  async getPages() {
    return this.makeRequest(`/me/accounts?access_token=${this.accessToken}&fields=id,name,access_token,category`)
  }

  // WhatsApp Business Accounts
  async getWhatsAppNumbers(pageId: string) {
    return this.makeRequest(
      `/${pageId}/whatsapp_business_accounts?access_token=${this.accessToken}&fields=id,name,phone_numbers{display_phone_number,verified_name,id}`,
    )
  }

  // Campaigns
  async createCampaign(adAccountId: string, data: any) {
    return this.makeRequest(`/${adAccountId}/campaigns?access_token=${this.accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  }

  async getCampaigns(adAccountId: string) {
    return this.makeRequest(
      `/${adAccountId}/campaigns?access_token=${this.accessToken}&fields=id,name,objective,status,daily_budget,lifetime_budget`,
    )
  }

  async updateCampaign(campaignId: string, data: any) {
    return this.makeRequest(`/${campaignId}?access_token=${this.accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  }

  // Ad Sets
  async createAdSet(adAccountId: string, data: any) {
    return this.makeRequest(`/${adAccountId}/adsets?access_token=${this.accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  }

  async getAdSets(campaignId: string) {
    return this.makeRequest(
      `/${campaignId}/adsets?access_token=${this.accessToken}&fields=id,name,status,daily_budget,targeting,optimization_goal`,
    )
  }

  async updateAdSet(adSetId: string, data: any) {
    return this.makeRequest(`/${adSetId}?access_token=${this.accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  }

  // Ad Images
  async uploadAdImage(adAccountId: string, imageFile: File) {
    const formData = new FormData()
    formData.append("access_token", this.accessToken)
    formData.append("filename", imageFile.name)

    // Convert File to bytes for the API
    const bytes = await imageFile.arrayBuffer()
    formData.append("bytes", new Blob([bytes]))

    return this.makeRequest(`/${adAccountId}/adimages`, {
      method: "POST",
      body: formData,
    })
  }

  // Ad Creatives
  async createAdCreative(adAccountId: string, data: any) {
    return this.makeRequest(`/${adAccountId}/adcreatives?access_token=${this.accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  }

  async getAdCreative(creativeId: string) {
    return this.makeRequest(
      `/${creativeId}?access_token=${this.accessToken}&fields=id,name,object_story_spec,image_hash,title,body`,
    )
  }

  // Ads
  async createAd(adAccountId: string, data: any) {
    return this.makeRequest(`/${adAccountId}/ads?access_token=${this.accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  }

  async getAds(adAccountId: string) {
    return this.makeRequest(
      `/${adAccountId}/ads?access_token=${this.accessToken}&fields=id,name,status,creative,adset_id,campaign_id`,
    )
  }

  async updateAd(adId: string, data: any) {
    return this.makeRequest(`/${adId}?access_token=${this.accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  }

  // Insights
  async getAdInsights(adId: string, datePreset = "last_30d") {
    return this.makeRequest(
      `/${adId}/insights?access_token=${this.accessToken}&date_preset=${datePreset}&fields=impressions,reach,spend,actions,action_values,cpm,cpp`,
    )
  }

  async getAdSetInsights(adSetId: string, datePreset = "last_30d") {
    return this.makeRequest(
      `/${adSetId}/insights?access_token=${this.accessToken}&date_preset=${datePreset}&fields=impressions,reach,spend,actions,action_values,cpm,cpp`,
    )
  }

  async getCampaignInsights(campaignId: string, datePreset = "last_30d") {
    return this.makeRequest(
      `/${campaignId}/insights?access_token=${this.accessToken}&date_preset=${datePreset}&fields=impressions,reach,spend,actions,action_values,cpm,cpp`,
    )
  }

  async getAccountInsights(adAccountId: string, datePreset = "last_30d") {
    return this.makeRequest(
      `/${adAccountId}/insights?access_token=${this.accessToken}&date_preset=${datePreset}&fields=impressions,reach,spend,actions,action_values,cpm,cpp`,
    )
  }
}

// Factory function to create Meta API service instance
export function createMetaApiService(): MetaApiService {
  const accessToken = process.env.META_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error("META_ACCESS_TOKEN environment variable is not set")
  }

  return new MetaApiService({
    accessToken,
    apiVersion: process.env.META_API_VERSION || "v18.0",
  })
}
