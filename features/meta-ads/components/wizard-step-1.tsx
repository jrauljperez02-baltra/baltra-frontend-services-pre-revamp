"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCompanyID } from "@/context/CompanyContext"
import { metaAdsApi } from "../lib/api-client"
import type { CompanyAssetLinkInput, CompanySummary } from "../types"

interface WizardStep1Props {
  value?: CompanyAssetLinkInput
  onChange: (data: CompanyAssetLinkInput) => void
  onCompanyChange?: (company: CompanySummary | null) => void
  disabled?: boolean
}

const INITIAL_VALUE: CompanyAssetLinkInput = {
  businessId: "",
  adAccountId: "",
  pageId: "",
  whatsappNumberId: "",
  systemUserToken: "",
}

function normalizeAdAccountId(id?: string | null) {
  if (!id) return ""
  return id.replace(/^act_/, "")
}

function companyToAssets(company?: CompanySummary | null): CompanyAssetLinkInput | null {
  if (!company) return null
  return {
    businessId: company.businessId ?? "",
    adAccountId: company.adAccount?.id ?? "",
    pageId: company.page?.id ?? "",
    whatsappNumberId: company.whatsappNumber?.id ?? "",
    systemUserToken: typeof company.systemUserToken === "string" ? company.systemUserToken : "",
  }
}

function assetsEqual(a: CompanyAssetLinkInput | null, b: CompanyAssetLinkInput | null) {
  if (a === b) return true
  if (!a || !b) return false
  return (
    (a.businessId ?? "") === (b.businessId ?? "") &&
    (a.adAccountId ?? "") === (b.adAccountId ?? "") &&
    (a.pageId ?? "") === (b.pageId ?? "") &&
    (a.whatsappNumberId ?? "") === (b.whatsappNumberId ?? "") &&
    (a.systemUserToken ?? "") === (b.systemUserToken ?? "")
  )
}

function formatAdAccount(company?: CompanySummary | null) {
  if (!company?.adAccount) {
    return "Sin cuenta publicitaria configurada"
  }
  const { name, account_id: accountId, id } = company.adAccount
  const displayName = name && name.length > 0 ? name : "Sin nombre"
  const formattedId = accountId || normalizeAdAccountId(id)
  return `${displayName}${formattedId ? ` (act_${formattedId})` : ""}`
}

function formatSystemUserToken(token?: string, hasToken?: boolean) {
  if (token && token.length > 0) {
    return token.length <= 10 ? token : `${token.slice(0, 6)}…${token.slice(-4)}`
  }
  if (hasToken) {
    return "Registrado (almacenado en backend)"
  }
  return "No configurado"
}

function hasCompleteAssets(company?: CompanySummary | null) {
  if (!company) return false
  return Boolean(company.businessId && company.adAccount?.id && company.page?.id && company.whatsappNumber?.id)
}

function formatPage(company?: CompanySummary | null) {
  const page = company?.page
  if (!page?.id) {
    return "No configurada"
  }
  const label = page.name && page.name.length > 0 ? page.name : "Sin nombre"
  return `${label} (${page.id})`
}

function formatWhatsApp(company?: CompanySummary | null) {
  const number = company?.whatsappNumber
  if (!number?.id) {
    return "No configurado"
  }
  const display = number.display_phone_number && number.display_phone_number.length > 0 ? number.display_phone_number : number.id
  return `${display} (${number.id})`
}

export function WizardStep1({ value, onChange, onCompanyChange, disabled }: WizardStep1Props) {
  const rawCompanyId = useCompanyID()
  const preferredCompanyId = rawCompanyId > 0 ? rawCompanyId : undefined
  const currentValue = useMemo<CompanyAssetLinkInput>(() => ({ ...INITIAL_VALUE, ...value }), [value])

  const [companies, setCompanies] = useState<CompanySummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [hasUserSelected, setHasUserSelected] = useState(false)
  const [isSyncingCampaigns, setIsSyncingCampaigns] = useState(false)

  const loadCompanies = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const response = await metaAdsApi.getCompanies()
      setCompanies(response)
      return response
    } catch (error) {
      console.error("Error loading Meta companies", error)
      setCompanies([])
      setLoadError("No pudimos obtener las compañías registradas con Meta.")
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCompanies()
  }, [loadCompanies])

  const handleSyncCampaigns = useCallback(async () => {
    if (!selectedCompanyId || disabled) {
      return
    }

    setIsSyncingCampaigns(true)
    try {
      await metaAdsApi.syncCompanyCampaigns(selectedCompanyId)
      await loadCompanies()
    } catch (error) {
      console.error("Error syncing campaigns", error)
      setLoadError("No pudimos sincronizar las campañas. Intenta nuevamente.")
    } finally {
      setIsSyncingCampaigns(false)
    }
  }, [disabled, loadCompanies, selectedCompanyId])

  useEffect(() => {
    if (companies.length === 0 || hasUserSelected) {
      return
    }

    const matchByContext = preferredCompanyId
      ? companies.find((company) => company.id === preferredCompanyId)
      : undefined

    const matchByAssets = currentValue.adAccountId
      ? companies.find((company) => {
          const companyAccountId = company.adAccount?.id ?? ""
          const cleanCompanyAccount = normalizeAdAccountId(company.adAccount?.account_id ?? companyAccountId)
          const cleanCurrent = normalizeAdAccountId(currentValue.adAccountId)
          return (
            companyAccountId === currentValue.adAccountId ||
            cleanCompanyAccount === cleanCurrent ||
            normalizeAdAccountId(companyAccountId) === cleanCurrent
          )
        })
      : undefined

    const fallback = companies[0]
    const next = matchByContext ?? matchByAssets ?? fallback
    if (next && next.id !== selectedCompanyId) {
      setSelectedCompanyId(next.id)
    }
  }, [companies, preferredCompanyId, currentValue.adAccountId, hasUserSelected, selectedCompanyId])

  useEffect(() => {
    if (preferredCompanyId) {
      setHasUserSelected(false)
    }
  }, [preferredCompanyId])

  useEffect(() => {
    if (!selectedCompanyId) {
      return
    }

    const company = companies.find((item) => item.id === selectedCompanyId)
    const nextAssets = companyToAssets(company)
    if (!nextAssets) {
      return
    }

    if (!assetsEqual(nextAssets, currentValue)) {
      onChange(nextAssets)
    }
  }, [selectedCompanyId, companies, currentValue, onChange])

  const selectedCompany = selectedCompanyId ? companies.find((company) => company.id === selectedCompanyId) : undefined
  const selectedCompanyCampaigns = selectedCompany?.campaigns ?? []

  useEffect(() => {
    if (!onCompanyChange) {
      return
    }
    onCompanyChange(selectedCompany ?? null)
  }, [onCompanyChange, selectedCompany])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Selecciona la compañía</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas las compañías ya cuentan con sus activos de Meta vinculados. Elige la compañía que deseas usar para la
          campaña y confirmaremos los recursos asociados.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-select">Compañía</Label>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : companies.length > 0 ? (
          <Select
            value={selectedCompanyId ? String(selectedCompanyId) : undefined}
            onValueChange={(value) => {
              setHasUserSelected(true)
              setSelectedCompanyId(Number.parseInt(value, 10))
            }}
            disabled={disabled}
          >
            <SelectTrigger id="company-select">
              <SelectValue placeholder="Selecciona una compañía" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={String(company.id)}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-muted-foreground">
            No encontramos compañías con activos de Meta. Registra al menos una antes de continuar.
          </p>
        )}
        {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}
      </div>

      {selectedCompany ? (
        <div className="space-y-4 rounded-md border p-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Business Manager</p>
            <p className="text-sm font-medium">
              {selectedCompany.businessId ? selectedCompany.businessId : "No configurado"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Cuenta publicitaria</p>
            <p className="text-sm font-medium">{formatAdAccount(selectedCompany)}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Página de Facebook</p>
            <p className="text-sm font-medium">{formatPage(selectedCompany)}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Número de WhatsApp</p>
            <p className="text-sm font-medium">{formatWhatsApp(selectedCompany)}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">System User Token</p>
            <p className="text-sm font-medium">
              {formatSystemUserToken(selectedCompany?.systemUserToken, selectedCompany?.hasSystemUserToken)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Campañas sincronizadas</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncCampaigns}
                disabled={
                  disabled ||
                  !selectedCompanyId ||
                  isLoading ||
                  isSyncingCampaigns
                }
              >
                {isSyncingCampaigns ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  "Sincronizar"
                )}
              </Button>
            </div>

            {selectedCompanyCampaigns.length > 0 ? (
              <div className="space-y-2">
                {selectedCompanyCampaigns.map((campaign, index) => {
                  const adSetCount = campaign.adSets?.length ?? 0
                  const adsCount =
                    campaign.adSets?.reduce((total, adSet) => total + (adSet.ads?.length ?? 0), 0) ?? 0

                  return (
                    <div key={campaign.metaCampaignId ?? campaign.name ?? `campaign-${index}`} className="rounded-md border p-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">{campaign.name || campaign.metaCampaignId || "Campaña sin nombre"}</p>
                          <p className="text-xs text-muted-foreground">
                            {adSetCount} ad set{adSetCount === 1 ? "" : "s"} • {adsCount} anuncio{adsCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <Badge variant="secondary">{campaign.status ?? "DESCONOCIDO"}</Badge>
                      </div>
                      {campaign.adSets && campaign.adSets.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {campaign.adSets.map((adSet) => (
                            <li key={adSet.metaAdSetId ?? adSet.name}>
                              • {adSet.name || adSet.metaAdSetId || "Ad Set"} ({adSet.status ?? "SIN ESTADO"})
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No hay campañas sincronizadas para esta compañía. Pulsa “Sincronizar” para importar las campañas existentes.
              </p>
            )}
          </div>

          {!hasCompleteAssets(selectedCompany) ? (
            <p className="text-sm text-destructive">
              Esta compañía no tiene todos los recursos requeridos. Verifica la configuración en el backend.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}