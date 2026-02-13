import { NextResponse } from "next/server"
import { createMetaApiService } from "@/features/meta-ads/lib/meta-api-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      image_hash,
      title,
      body: adBody,
      description,
      call_to_action_type,
      page_id,
      whatsapp_number,
      ad_account_id,
    } = body

    if (!process.env.META_ACCESS_TOKEN) {
      const mockResponse = {
        id: `creative_${Date.now()}`,
        name,
        image_hash,
        title,
        body: adBody,
        description,
        call_to_action_type,
      }
      return NextResponse.json(mockResponse)
    }

    const metaApi = createMetaApiService()
    const creativeData = {
      name,
      object_story_spec: {
        page_id,
        link_data: {
          image_hash,
          link: `https://wa.me/${whatsapp_number}`,
          message: adBody,
          name: title,
          description,
          call_to_action: {
            type: call_to_action_type,
          },
        },
      },
    }

    const response = await metaApi.createAdCreative(ad_account_id, creativeData)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error creating creative:", error)
    return NextResponse.json({ error: "Failed to create creative" }, { status: 500 })
  }
}
