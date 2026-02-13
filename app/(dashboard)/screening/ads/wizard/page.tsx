"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { WizardOrchestrator } from "@/features/meta-ads/components/wizard-orchestrator"
import { Loader2 } from "lucide-react"

function WizardContent() {
  const searchParams = useSearchParams()
  const step = Number.parseInt(searchParams?.get("step") || "1")

  return <WizardOrchestrator initialStep={step} />
}

export default function WizardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <WizardContent />
    </Suspense>
  )
}
