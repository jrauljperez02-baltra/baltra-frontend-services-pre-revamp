import { NextResponse } from "next/server"
import { createMetaApiService } from "@/features/meta-ads/lib/meta-api-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const adAccountId = searchParams.get("adAccountId")

    if (!process.env.META_ACCESS_TOKEN) {
      const mockData = [
        {
          id: "ad_1",
          name: "Ad - Join Our Engineering Team",
          status: "ACTIVE",
        },
        {
          id: "ad_2",
          name: "Ad - Sales Position Available",
          status: "PAUSED",
        },
      ]
      return NextResponse.json(mockData)
    }

    if (!adAccountId) {
      return NextResponse.json({ error: "adAccountId is required" }, { status: 400 })
    }

    const metaApi = createMetaApiService()
    const response = await metaApi.getAds(adAccountId)
    return NextResponse.json(response.data || [])
  } catch (error) {
    console.error("Error fetching ads:", error)
    return NextResponse.json({ error: "Failed to fetch ads" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, adset_id, creative_id, status, ad_account_id } = body

    if (!process.env.META_ACCESS_TOKEN) {
      const mockResponse = {
        id: `ad_${Date.now()}`,
        name,
        adset_id,
        creative_id,
        status,
      }
      return NextResponse.json(mockResponse)
    }

    const metaApi = createMetaApiService()
    const adData = {
      name,
      adset_id,
      creative: { creative_id },
      status,
    }

    const response = await metaApi.createAd(ad_account_id, adData)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error creating ad:", error)
    return NextResponse.json({ error: "Failed to create ad" }, { status: 500 })
  }
}
