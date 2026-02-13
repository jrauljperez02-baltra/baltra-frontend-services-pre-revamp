import { NextResponse } from "next/server"
import { createMetaApiService } from "@/features/meta-ads/lib/meta-api-service"

export async function GET() {
  try {
    if (!process.env.META_ACCESS_TOKEN) {
      const mockData = [
        {
          id: "page_111222333",
          name: "Company Page",
          access_token: "mock_page_token_1",
          category: "Business",
        },
        {
          id: "page_444555666",
          name: "Brand Page",
          access_token: "mock_page_token_2",
          category: "Brand",
        },
      ]
      return NextResponse.json(mockData)
    }

    const metaApi = createMetaApiService()
    const response = await metaApi.getPages()
    return NextResponse.json(response.data || [])
  } catch (error) {
    console.error("Error fetching pages:", error)
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 })
  }
}
