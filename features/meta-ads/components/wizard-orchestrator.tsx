"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MetaAdsWizard } from "../meta-ads-wizard"

interface WizardOrchestratorProps {
  initialStep?: number
}

export function WizardOrchestrator({ initialStep = 1 }: WizardOrchestratorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleStepChange = useCallback(
    (step: number) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.set("step", String(step))
      router.replace(`?${nextParams.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  return <MetaAdsWizard initialStep={initialStep} onStepChange={handleStepChange} />
}
