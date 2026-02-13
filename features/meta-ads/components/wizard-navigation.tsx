"use client"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

interface WizardNavigationProps {
  currentStep: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  onSubmit?: () => void
  isNextDisabled?: boolean
  isAdvancing?: boolean
  isSubmitting?: boolean
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isNextDisabled,
  isAdvancing,
  isSubmitting,
}: WizardNavigationProps) {
  const isLastStep = currentStep === totalSteps
  const disableNavigation = isAdvancing || isSubmitting

  return (
    <div className="flex justify-between border-t pt-6">
      <Button variant="outline" onClick={onBack} disabled={currentStep === 1 || disableNavigation}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        Anterior
      </Button>

      {isLastStep ? (
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publicando...
            </>
          ) : (
            "Publicar campaña"
          )}
        </Button>
      ) : (
        <Button onClick={onNext} disabled={isNextDisabled || disableNavigation}>
          {isAdvancing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </div>
  )
}
