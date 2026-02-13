import { NextResponse } from "next/server"
import { createMetaApiService } from "@/features/meta-ads/lib/meta-api-service"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const adAccountId = formData.get("adAccountId") as string

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    if (!adAccountId) {
      return NextResponse.json({ error: "adAccountId is required" }, { status: 400 })
    }

    if (!process.env.META_ACCESS_TOKEN) {
      const mockResponse = {
        images: {
          bytes: {
            image_hash: `hash_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          },
        },
      }
      return NextResponse.json(mockResponse)
    }

    const metaApi = createMetaApiService()
    const response = await metaApi.uploadAdImage(adAccountId, image)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
