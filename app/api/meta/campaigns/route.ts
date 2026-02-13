import { NextResponse } from "next/server"
import { createMetaApiService } from "@/features/meta-ads/lib/meta-api-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, objective, special_ad_categories, ad_account_id } = body

    if (!process.env.META_ACCESS_TOKEN) {
      const mockResponse = {
        id: `campaign_${Date.now()}`,
        name,
        objective,
        special_ad_categories,
        status: "PAUSED",
      }
      return NextResponse.json(mockResponse)
    }

    const metaApi = createMetaApiService()
    const campaignData = {
      name,
      objective,
      special_ad_categories,
      status: "PAUSED",
    }

    const response = await metaApi.createCampaign(ad_account_id, campaignData)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 })
  }
}
