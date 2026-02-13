import { NextResponse } from "next/server"
import { createMetaApiService } from "@/features/meta-ads/lib/meta-api-service"

export async function GET() {
  try {
    // Check if Meta API is configured
    if (!process.env.META_ACCESS_TOKEN) {
      // Return mock data if not configured
      const mockData = [
        {
          id: "act_123456789",
          name: "Main Ad Account",
          account_id: "123456789",
          currency: "USD",
          timezone_name: "America/Los_Angeles",
        },
        {
          id: "act_987654321",
          name: "Secondary Ad Account",
          account_id: "987654321",
          currency: "USD",
          timezone_name: "America/New_York",
        },
      ]
      return NextResponse.json(mockData)
    }

    const metaApi = createMetaApiService()
    const response = await metaApi.getAdAccounts()
    return NextResponse.json(response.data || [])
  } catch (error) {
    console.error("Error fetching ad accounts:", error)
    return NextResponse.json({ error: "Failed to fetch ad accounts" }, { status: 500 })
  }
}
