"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useCompanyID } from "@/context/CompanyContext"
import { WizardNavigation } from "./components/wizard-navigation"
import { WizardProgress } from "./components/wizard-progress"
import { WizardStep1 } from "./components/wizard-step-1"
import { WizardStep2 } from "./components/wizard-step-2"
import { WizardStep3 } from "./components/wizard-step-3"
import { WizardStep4 } from "./components/wizard-step-4"
import { WizardStep5 } from "./components/wizard-step-5"
import { metaAdsApi } from "./lib/api-client"
import { buildFullCampaignPayload } from "./lib/payload"
import type {
  AdSettings,
  AdSetSettings,
  CampaignSettings,
  CompanyAssetLinkInput,
  CreativeSettings,
  RoleBlueprint,
  WizardState,
  CompanySummary,
  CompanyRole,
  GeoLocationCustom,
} from "./types"

const STEPS = ["Activos", "Campaña", "Segmentación", "Creatividades", "Revisión"]
const DEFAULT_CAMPAIGN_SETTINGS: CampaignSettings = {
  name: "",
  objective: "OUTCOME_ENGAGEMENT",
  specialAdCategories: ["EMPLOYMENT"],
}

function arraysEqual<T>(a?: T[], b?: T[]) {
  if (a === b) return true
  if (!a || !b) return false
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

function campaignsEqual(a?: CampaignSettings, b?: CampaignSettings) {
  if (a === b) return true
  if (!a || !b) return false
  return (
    a.name === b.name &&
    a.objective === b.objective &&
    a.roleId === b.roleId &&
    arraysEqual(a.specialAdCategories, b.specialAdCategories)
  )
}

function parseCampaignDefaults(payload: unknown): Partial<CampaignSettings> | null {
  if (!payload || typeof payload !== "object") return null

  const record = payload as Record<string, unknown>
  const specialRaw = record.special_ad_categories ?? record.specialAdCategories
  let specialAdCategories: string[] | undefined

  if (Array.isArray(specialRaw)) {
    specialAdCategories = specialRaw.filter((item): item is string => typeof item === "string" && item.length > 0)
  } else if (specialRaw && typeof specialRaw === "object") {
    const items = (specialRaw as { items?: unknown }).items
    if (Array.isArray(items)) {
      specialAdCategories = items.filter((item): item is string => typeof item === "string" && item.length > 0)
    }
  }

  const result: Partial<CampaignSettings> = {}

  if (typeof record.name === "string" && record.name.length > 0) {
    result.name = record.name
  }

  if (typeof record.objective === "string" && record.objective.length > 0) {
    result.objective = record.objective
  }

  if (specialAdCategories && specialAdCategories.length > 0) {
    result.specialAdCategories = specialAdCategories
  }

  const roleIdValue = record.role_id ?? record.roleId
  if (typeof roleIdValue === "number" && Number.isFinite(roleIdValue)) {
    result.roleId = roleIdValue
  }

  return Object.keys(result).length > 0 ? result : null
}

interface MetaAdsWizardProps {
  initialStep?: number
  onStepChange?: (step: number) => void
  onComplete?: (result: WizardState) => void
  initialState?: Partial<WizardState>
}

function defaultWizardState(initial?: Partial<WizardState>): WizardState {
  return {
    assets: initial?.assets,
    campaign: initial?.campaign,
    adSet: initial?.adSet,
    creative: initial?.creative,
    ad: initial?.ad,
  }
}

export function MetaAdsWizard({ initialStep = 1, onStepChange, onComplete, initialState }: MetaAdsWizardProps) {
  const contextCompanyId = useCompanyID()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState(initialStep)
  const [state, setState] = useState<WizardState>(() => defaultWizardState(initialState))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastDefaultsCompanyId, setLastDefaultsCompanyId] = useState<number | null>(null)
  const [availableRoles, setAvailableRoles] = useState<CompanyRole[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const rolesRequestRef = useRef<number | null>(null)
  const mountedRef = useRef(true)

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [currentCompany, setCurrentCompany] = useState<CompanySummary | null>(null)
  const [existingMetaCampaignId, setExistingMetaCampaignId] = useState<string | null>(null)

  // Evita updates después de desmontar
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      rolesRequestRef.current = null
    }
  }, [])

  const effectiveCompanyId = useMemo(() => {
    if (selectedCompanyId && selectedCompanyId > 0) return selectedCompanyId
    return contextCompanyId > 0 ? contextCompanyId : null
  }, [contextCompanyId, selectedCompanyId])

  useEffect(() => {
    setCurrentStep(initialStep)
  }, [initialStep])

  const goToStep = useCallback(
    (step: number) => {
      setCurrentStep(step)
      onStepChange?.(step)
    },
    [onStepChange],
  )

  const handleAssetsChange = useCallback((assets: CompanyAssetLinkInput) => {
    setState((prev) => {
      if (prev.assets === assets) return prev
      return { ...prev, assets }
    })
  }, [])

  const applyCampaignDefaults = useCallback(
    (company: CompanySummary) => {
      if (!company.defaults || company.id === lastDefaultsCompanyId) return

      const campaignDefaults = parseCampaignDefaults(company.defaults?.campaign)
      if (!campaignDefaults) {
        setLastDefaultsCompanyId(company.id)
        return
      }

      setState((prev) => {
        const base = prev.campaign ?? DEFAULT_CAMPAIGN_SETTINGS
        const hasCustomName = prev.campaign ? prev.campaign.name.trim().length > 0 : false
        const hasCustomRole = prev.campaign?.roleId !== undefined
        const hasCustomCategories =
          prev.campaign && !arraysEqual(prev.campaign.specialAdCategories, DEFAULT_CAMPAIGN_SETTINGS.specialAdCategories)
        const hasCustomObjective = prev.campaign ? prev.campaign.objective !== DEFAULT_CAMPAIGN_SETTINGS.objective : false

        const nextCampaign: CampaignSettings = {
          name: hasCustomName ? base.name : campaignDefaults.name ?? base.name,
          objective: hasCustomObjective ? base.objective : campaignDefaults.objective ?? base.objective,
          specialAdCategories: hasCustomCategories
            ? base.specialAdCategories
            : campaignDefaults.specialAdCategories ?? base.specialAdCategories,
          roleId: hasCustomRole ? base.roleId : campaignDefaults.roleId ?? base.roleId,
        }

        if (campaignsEqual(prev.campaign, nextCampaign)) return prev
        return { ...prev, campaign: nextCampaign }
      })

      setLastDefaultsCompanyId(company.id)
    },
    [lastDefaultsCompanyId],
  )

  const handleCampaignChange = useCallback((campaign: CampaignSettings) => {
    setState((prev) => {
      if (campaignsEqual(prev.campaign, campaign)) return prev
      return { ...prev, campaign }
    })
  }, [])

  // Comparación profunda estable para AdSet
  const lastAdSetSerializedRef = useRef<string>("")
  const handleAdSetChange = useCallback((adSet: AdSetSettings) => {
    const serialized = JSON.stringify(adSet)
    if (serialized === lastAdSetSerializedRef.current) return
    lastAdSetSerializedRef.current = serialized

    setState((prev) => {
      const prevSerialized = prev.adSet ? JSON.stringify(prev.adSet) : ""
      if (prevSerialized === serialized) return prev
      return { ...prev, adSet }
    })
  }, [])

  const handleCreativeChange = useCallback((creative: CreativeSettings) => {
    setState((prev) => {
      // comparación ligera
      const prevStr = prev.creative ? JSON.stringify(prev.creative) : ""
      const nextStr = JSON.stringify(creative)
      if (prevStr === nextStr) return prev
      return { ...prev, creative }
    })
  }, [])

  const handleAdSettingsChange = useCallback((adSettings: AdSettings) => {
    setState((prev) => {
      if (prev.ad === adSettings) return prev
      return { ...prev, ad: adSettings }
    })
  }, [])

  const applyBlueprint = useCallback((blueprint: RoleBlueprint) => {
    setState((prev) => {
      // 1) campaign
      const nextCampaign: CampaignSettings = {
        name: prev.campaign?.name || blueprint.name_template,
        objective: blueprint.objective,
        specialAdCategories: blueprint.special_ad_categories.items,
        roleId: blueprint.role_id,
      }

      // 2) GEO prioridad: custom_locations > cities > countries > rol > previo
      const bpGeo = blueprint.default_targeting?.geo_locations ?? {}

      const fromCustom =
        Array.isArray(bpGeo.custom_locations) && bpGeo.custom_locations.length > 0
          ? {
              customLocations: bpGeo.custom_locations.map((p: any) => ({
                latitude: p.latitude,
                longitude: p.longitude,
                radius: p.radius ?? 1,
                distanceUnit: (p.distance_unit ?? "kilometer") as "kilometer" | "mile",
                address: p.address,
              })),
            }
          : null

      const fromCities =
        !fromCustom && Array.isArray(bpGeo.cities) && bpGeo.cities.length > 0
          ? {
              cities: bpGeo.cities.map((c: any) => ({
                key: c.key,
                name: c.name,
                radius: c.radius ?? 15,
                distanceUnit: (c.distance_unit ?? "kilometer") as "kilometer" | "mile",
              })),
            }
          : null

      const fromCountries =
        !fromCustom && !fromCities && Array.isArray(bpGeo.countries) && bpGeo.countries.length > 0
          ? { countries: bpGeo.countries }
          : null

      const role = availableRoles.find((r) => r.role_id === blueprint.role_id)
      const rolePoint =
        role?.location && Number.isFinite(role.location.latitude) && Number.isFinite(role.location.longitude)
          ? {
              customLocations: [
                {
                  latitude: role.location.latitude as number,
                  longitude: role.location.longitude as number,
                  radius: 1,
                  distanceUnit: "kilometer" as const,
                  address: role.location.address ?? undefined,
                },
              ],
            }
          : null

      const nextGeo =
        fromCustom ?? fromCities ?? fromCountries ?? rolePoint ?? prev.adSet?.targeting.geoLocations ?? {}

      // 3) ad set
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const nextAdSet: AdSetSettings = {
        name: prev.adSet?.name || `${blueprint.name_template} - Ad Set`,
        dailyBudgetCents: blueprint.default_budget_cents ?? prev.adSet?.dailyBudgetCents ?? 0,
        startTime: prev.adSet?.startTime || now.toISOString(),
        endTime: prev.adSet?.endTime || tomorrow.toISOString(),
        targeting: {
          ageMin: blueprint.default_targeting.age_min,
          ageMax: blueprint.default_targeting.age_max,
          genders: prev.adSet?.targeting.genders ?? [],
          geoLocations: nextGeo,
        },
      }

      // 4) creative
      const creativeVariant = {
        id: "blueprint",
        title: blueprint.default_creative.title ?? "",
        primaryText: blueprint.default_creative.primaryText ?? "",
        description: blueprint.default_creative.description ?? "",
      }
      const nextCreative: CreativeSettings = {
        imageUrl: blueprint.default_creative.image_url || prev.creative?.imageUrl || "",
        callToAction: prev.creative?.callToAction,
        variants: prev.creative?.variants?.length ? prev.creative.variants : [creativeVariant],
      }

      const nextState = { ...prev, campaign: nextCampaign, adSet: nextAdSet, creative: nextCreative }
      // idempotencia
      return JSON.stringify(prev) === JSON.stringify(nextState) ? prev : nextState
    })
  }, [availableRoles])

  // ---------- Validación memoizada ----------
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        return Boolean(
          state.assets?.adAccountId && state.assets.pageId && state.assets.whatsappNumberId && effectiveCompanyId,
        )
      case 2: {
        const newCampaignValid = Boolean(state.campaign?.name && state.campaign.name.trim().length > 0)
        const existingValid = Boolean(existingMetaCampaignId)
        return newCampaignValid || existingValid
      }
      case 3: {
        const adSet = state.adSet
        const geo = adSet?.targeting.geoLocations
        const hasLocations = Boolean(geo?.countries?.length || geo?.cities?.length || geo?.customLocations?.length)
        if (!adSet || !adSet.startTime || !adSet.targeting || !hasLocations) return false
        const isLifetime = adSet.budgetType === "LIFETIME"
        if (isLifetime) {
          return Boolean(adSet.lifetimeBudgetCents && adSet.lifetimeBudgetCents > 0 && adSet.endTime)
        }
        return Boolean(adSet.dailyBudgetCents && adSet.dailyBudgetCents > 0)
      }
      case 4:
        return Boolean(
          ((state.creative?.imageBase64 && state.creative.imageBase64.length > 50) ||
            (state.creative?.imageUrl && state.creative.imageUrl.length > 5)) &&
            state.creative?.variants?.length &&
            state.creative.variants[0].primaryText,
        )
      case 5:
        return Boolean(state.ad?.name && state.ad.name.trim().length > 0)
      default:
        return true
    }
  }, [currentStep, effectiveCompanyId, state, existingMetaCampaignId])

  // ---------- Selección de compañía y carga de roles ----------
  const handleCompanySelection = useCallback(
    (company: CompanySummary | null) => {
      setSelectedCompanyId(company?.id ?? null)
      setCurrentCompany(company ?? null)
      setExistingMetaCampaignId(null)
      if (!company) return

      applyCampaignDefaults(company)

      if (!company.id || Number.isNaN(company.id)) {
        setAvailableRoles([])
        return
      }

      const requestToken = Date.now()
      rolesRequestRef.current = requestToken
      setIsLoadingRoles(true)
      setAvailableRoles([])

      metaAdsApi
        .getCompanyRoles(company.id)
        .then((roles) => {
          if (!mountedRef.current) return
          if (rolesRequestRef.current !== requestToken) return

          setAvailableRoles(roles)
          setState((prev) => {
            const currentRoleId = prev.campaign?.roleId
            const hasRole = roles.some((role) => role.role_id === currentRoleId)
            const defaultRole = roles.find((role) => role.default_role) ?? roles[0]
            const nextRoleId = hasRole ? currentRoleId : defaultRole?.role_id

            if (nextRoleId === currentRoleId) return prev

            const nextCampaign: CampaignSettings | undefined = prev.campaign
              ? { ...prev.campaign, roleId: nextRoleId }
              : nextRoleId
                ? { ...DEFAULT_CAMPAIGN_SETTINGS, roleId: nextRoleId }
                : prev.campaign

            return nextCampaign ? { ...prev, campaign: nextCampaign } : prev
          })
        })
        .catch((error) => {
          if (!mountedRef.current) return
          if (rolesRequestRef.current !== requestToken) return
          console.error("Error loading company roles", error)
          setAvailableRoles([])
          toast({
            title: "No encontramos roles para esta compañía",
            description: "Verifica la configuración de roles antes de continuar.",
            variant: "destructive",
          })
        })
        .finally(() => {
          if (!mountedRef.current) return
          if (rolesRequestRef.current === requestToken) {
            setIsLoadingRoles(false)
            rolesRequestRef.current = null
          }
        })
    },
    [applyCampaignDefaults, toast],
  )

  const handleNext = async () => {
    if (!isStepValid) {
      toast({ title: "Completa la información requerida", variant: "destructive" })
      return
    }
    if (currentStep < STEPS.length) {
      goToStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!effectiveCompanyId) {
      toast({ title: "Selecciona una compañía", description: "Necesitamos un business_unit_id válido.", variant: "destructive" })
      return
    }

    if (!isStepValid) {
      toast({ title: "Revisa la información", description: "Asegúrate de completar todos los campos requeridos." })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = buildFullCampaignPayload(state, effectiveCompanyId)
      await metaAdsApi.createFullCampaign(payload)
      toast({ title: "Campaña enviada", description: "Estamos creando la campaña completa en Meta." })
      onComplete?.(state)
    } catch (error) {
      console.error("Error creating full campaign", error)
      toast({
        title: "No pudimos crear la campaña",
        description: error instanceof Error ? error.message : "Intenta nuevamente más tarde.",
        variant: "destructive",
      })
    } finally {
      if (mountedRef.current) setIsSubmitting(false)
    }
  }

  const selectedRole = useMemo(
    () => availableRoles.find((role) => role.role_id === state.campaign?.roleId),
    [availableRoles, state.campaign?.roleId],
  )

  const roleLocation = useMemo<GeoLocationCustom | undefined>(() => {
    const loc = selectedRole?.location
    if (
      loc &&
      typeof loc.latitude === "number" &&
      typeof loc.longitude === "number" &&
      !Number.isNaN(loc.latitude) &&
      !Number.isNaN(loc.longitude)
    ) {
      const radius =
        typeof loc.radius === "number" && Number.isFinite(loc.radius) && loc.radius > 0 ? loc.radius : 1
      const distanceUnit =
        loc.distanceUnit === "mile" || loc.distanceUnit === "kilometer" ? loc.distanceUnit : "kilometer"
      return {
        latitude: loc.latitude,
        longitude: loc.longitude,
        radius,
        distanceUnit,
        address: loc.address ?? undefined,
      }
    }
    return undefined
  }, [selectedRole])

  const existingCampaignsMemo = useMemo(() => {
    return (currentCompany?.campaigns ?? []).map((c) => ({
      metaCampaignId: c.metaCampaignId ?? "",
      name: c.name ?? "",
      status: c.status,
    }))
  }, [currentCompany])

  return (
    <div className="mx-auto max-w-5xl">
      <Card className="p-8">
        <WizardProgress currentStep={currentStep} steps={STEPS} />

        <div className="min-h-[520px]">
          {currentStep === 1 ? (
            <WizardStep1
              value={state.assets}
              onChange={handleAssetsChange}
              onCompanyChange={handleCompanySelection}
              disabled={isSubmitting}
            />
          ) : null}

          {currentStep === 2 ? (
            <WizardStep2
              value={state.campaign}
              onChange={handleCampaignChange}
              onBlueprintApply={applyBlueprint}
              roles={availableRoles}
              isLoadingRoles={isLoadingRoles}
              existingCampaigns={existingCampaignsMemo}
              onUseExisting={(metaCampaignId) => {
                setExistingMetaCampaignId(metaCampaignId ?? null)
                // Si deseas guardar también dentro de campaign (extiende el tipo en ./types):
                if (!metaCampaignId) {
                  setState((prev) =>
                    prev.campaign
                      ? ({ ...prev, campaign: { ...prev.campaign, /* existingMetaCampaignId: undefined */ } as CampaignSettings })
                      : prev,
                  )
                } else {
                  setState((prev) => ({
                    ...prev,
                    campaign: {
                      ...(prev.campaign ?? DEFAULT_CAMPAIGN_SETTINGS),
                      // existingMetaCampaignId: metaCampaignId, // <- habilítalo al extender el tipo
                    } as CampaignSettings,
                  }))
                }
              }}
            />
          ) : null}

          {currentStep === 3 ? (
            <WizardStep3
              value={state.adSet}
              onChange={handleAdSetChange}
              adAccountId={state.assets?.adAccountId}
              roleLocation={roleLocation}
              disabled={isSubmitting}
            />
          ) : null}

          {currentStep === 4 ? (
            <WizardStep4 value={state.creative} onChange={handleCreativeChange} />
          ) : null}

          {currentStep === 5 ? (
            <WizardStep5
              assets={state.assets}
              campaign={state.campaign}
              adSet={state.adSet}
              creative={state.creative}
              ad={state.ad}
              onChange={handleAdSettingsChange}
            />
          ) : null}
        </div>

        <WizardNavigation
          currentStep={currentStep}
          totalSteps={STEPS.length}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isNextDisabled={!isStepValid}
          isSubmitting={isSubmitting}
        />
      </Card>
    </div>
  )
}
