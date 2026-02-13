export interface AdAccount {
  id: string
  name: string
  account_id: string
}

export interface Page {
  id: string
  name: string
  access_token?: string
}

export interface WhatsAppNumber {
  id: string
  display_phone_number: string
  verified_name: string
}

export interface Campaign {
  id?: string
  name: string
  objective: "MESSAGES"
  special_ad_categories: ["EMPLOYMENT"]
  status?: "ACTIVE" | "PAUSED"
}

export interface AdSet {
  id?: string
  campaign_id: string
  name: string
  daily_budget: number
  start_time: string
  end_time?: string
  targeting: {
    age_min: number
    age_max: number
    genders?: number[]
    geo_locations: {
      countries?: string[]
      location_types?: string[]
      radius?: number
      latitude?: number
      longitude?: number
    }
  }
  optimization_goal: "CONVERSATIONS"
  billing_event: "IMPRESSIONS"
  status?: "ACTIVE" | "PAUSED"
}

export interface Creative {
  id?: string
  name: string
  image_hash: string
  title: string
  body: string
  description: string
  link_url?: string
  call_to_action_type: "WHATSAPP_MESSAGE"
}

export interface Ad {
  id?: string
  name: string
  adset_id: string
  creative_id: string
  status: "ACTIVE" | "PAUSED"
}

export interface AdInsights {
  ad_id: string
  ad_name: string
  impressions: number
  reach: number
  spend: number
  conversations: number
  cpm: number
  cpp: number
  date_start: string
  date_stop: string
}

export interface WizardState {
  step: number
  adAccount?: AdAccount
  page?: Page
  whatsappNumber?: WhatsAppNumber
  campaign?: Campaign
  adset?: AdSet
  creatives: Creative[]
  activateOnCreate: boolean
}
