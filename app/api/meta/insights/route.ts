import { NextResponse } from "next/server"
import { createMetaApiService } from "@/features/meta-ads/lib/meta-api-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const adAccountId = searchParams.get("adAccountId")
    const datePreset = searchParams.get("datePreset") || "last_30d"

    if (!process.env.META_ACCESS_TOKEN) {
      const mockData = {
        data: [
          {
            impressions: 12500,
            reach: 8300,
            spend: 45.5,
            actions: [{ action_type: "onsite_conversion.messaging_conversation_started_7d", value: 23 }],
            cpm: 3.64,
            cpp: 1.98,
          },
        ],
      }
      return NextResponse.json(mockData)
    }

    if (!adAccountId) {
      return NextResponse.json({ error: "adAccountId is required" }, { status: 400 })
    }

    const metaApi = createMetaApiService()
    const response = await metaApi.getAccountInsights(adAccountId, datePreset)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching insights:", error)
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 })
  }
}
