import { NextResponse } from "next/server"
import { createMetaApiService } from "@/features/meta-ads/lib/meta-api-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      campaign_id,
      name,
      daily_budget,
      start_time,
      end_time,
      targeting,
      optimization_goal,
      billing_event,
      ad_account_id,
    } = body

    if (!process.env.META_ACCESS_TOKEN) {
      const mockResponse = {
        id: `adset_${Date.now()}`,
        campaign_id,
        name,
        daily_budget,
        start_time,
        end_time,
        targeting,
        optimization_goal,
        billing_event,
        status: "PAUSED",
      }
      return NextResponse.json(mockResponse)
    }

    const metaApi = createMetaApiService()
    const adSetData = {
      campaign_id,
      name,
      daily_budget,
      start_time,
      end_time,
      targeting,
      optimization_goal,
      billing_event,
      status: "PAUSED",
    }

    const response = await metaApi.createAdSet(ad_account_id, adSetData)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error creating ad set:", error)
    return NextResponse.json({ error: "Failed to create ad set" }, { status: 500 })
  }
}
