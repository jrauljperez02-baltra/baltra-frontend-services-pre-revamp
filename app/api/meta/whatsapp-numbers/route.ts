import { NextResponse } from "next/server"
import { createMetaApiService } from "@/features/meta-ads/lib/meta-api-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get("pageId")

    if (!process.env.META_ACCESS_TOKEN) {
      const mockData = [
        {
          id: "wa_123456789",
          display_phone_number: "+1 (555) 123-4567",
          verified_name: "Company Support",
        },
        {
          id: "wa_987654321",
          display_phone_number: "+1 (555) 987-6543",
          verified_name: "Sales Team",
        },
      ]
      return NextResponse.json(mockData)
    }

    if (!pageId) {
      return NextResponse.json({ error: "pageId is required" }, { status: 400 })
    }

    const metaApi = createMetaApiService()
    const response = await metaApi.getWhatsAppNumbers(pageId)

    // Extract phone numbers from the response
    const phoneNumbers = response.data?.[0]?.phone_numbers || []
    return NextResponse.json(phoneNumbers)
  } catch (error) {
    console.error("Error fetching WhatsApp numbers:", error)
    return NextResponse.json({ error: "Failed to fetch WhatsApp numbers" }, { status: 500 })
  }
}
