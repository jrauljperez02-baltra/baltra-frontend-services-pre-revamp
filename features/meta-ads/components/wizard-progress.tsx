"use client"

import { Check } from "lucide-react"

interface WizardProgressProps {
  currentStep: number
  steps: string[]
}

export function WizardProgress({ currentStep, steps }: WizardProgressProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep

        return (
          <div key={stepNumber} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-colors ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
              </div>
              <span className={`mt-2 text-sm font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`mx-4 h-0.5 flex-1 transition-colors ${isCompleted ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
