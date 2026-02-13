'use client'

import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

const steps = [
  { id: 1, name: "Campaign Details" },
  { id: 2, name: "Targeting" },
  { id: 3, name: "Ad Creative" },
  { id: 4, name: "Review" },
  { id: 5, name: "Confirmation" },
]

export function WizardProgress() {
  const searchParams = useSearchParams()
  const currentStep = Number.parseInt(searchParams.get("step") || "1")

  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step, index) => (
          <li key={step.name} className="md:flex-1">
            {currentStep > step.id ? (
              <div className="group flex flex-col border-l-4 border-primary py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                <span className="text-sm font-medium text-primary transition-colors ">{`Step ${step.id}`}</span>
                <span className="text-sm font-medium">{step.name}</span>
              </div>
            ) : currentStep === step.id ? (
              <div
                className="flex flex-col border-l-4 border-primary py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                aria-current="step"
              >
                <span className="text-sm font-medium text-primary">{`Step ${step.id}`}</span>
                <span className="text-sm font-medium">{step.name}</span>
              </div>
            ) : (
              <div className="group flex flex-col border-l-4 border-border py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                <span className="text-sm font-medium text-muted-foreground transition-colors">{`Step ${step.id}`}</span>
                <span className="text-sm font-medium">{step.name}</span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}