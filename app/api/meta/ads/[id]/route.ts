import { NextResponse } from "next/server"
import { createMetaApiService } from "@/features/meta-ads/lib/meta-api-service"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status } = body
    const adId = params.id

    if (!process.env.META_ACCESS_TOKEN) {
      const mockResponse = {
        id: adId,
        status,
        success: true,
      }
      return NextResponse.json(mockResponse)
    }

    const metaApi = createMetaApiService()
    const response = await metaApi.updateAd(adId, { status })
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error updating ad:", error)
    return NextResponse.json({ error: "Failed to update ad" }, { status: 500 })
  }
}
