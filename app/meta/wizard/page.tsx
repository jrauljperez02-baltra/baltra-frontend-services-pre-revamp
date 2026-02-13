"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { WizardOrchestrator } from "@/features/meta-ads/components/wizard-orchestrator"
import { Loader2 } from "lucide-react"

function WizardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const step = Number.parseInt(searchParams?.get("step") || "1")

  // Always normalize to step=1 on first load/refresh or direct entry
  useEffect(() => {
    if (step !== 1) {
      router.replace("?step=1", { scroll: false })
    }
    // If step is missing, also ensure it's present for consistency
    if (!searchParams?.get("step")) {
      router.replace("?step=1", { scroll: false })
    }
    // We only want to run this on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Force initialStep to 1 so the wizard state always starts correctly
  return <WizardOrchestrator initialStep={1} />
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
