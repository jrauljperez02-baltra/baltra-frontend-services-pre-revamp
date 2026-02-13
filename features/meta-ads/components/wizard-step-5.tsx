"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import type { AdSettings, AdSetSettings, CampaignSettings, CompanyAssetLinkInput, CreativeSettings } from "../types"

interface WizardStep5Props {
  assets?: CompanyAssetLinkInput
  campaign?: CampaignSettings
  adSet?: AdSetSettings
  creative?: CreativeSettings
  ad?: AdSettings
  onChange: (value: AdSettings) => void
}

const DEFAULT_AD: AdSettings = {
  name: "Anuncio principal",
  activateOnCreate: true,
}

export function WizardStep5({ assets, campaign, adSet, creative, ad, onChange }: WizardStep5Props) {
  const [adName, setAdName] = useState(ad?.name ?? DEFAULT_AD.name)
  const [activateOnCreate, setActivateOnCreate] = useState(ad?.activateOnCreate ?? DEFAULT_AD.activateOnCreate)

  useEffect(() => {
    if (!ad) return
    setAdName(ad.name)
    setActivateOnCreate(ad.activateOnCreate)
  }, [ad])

  useEffect(() => {
    onChange({ name: adName, activateOnCreate })
  }, [adName, activateOnCreate, onChange])

  const geoSummary = useMemo(() => {
    if (!adSet) return ""
    const { geoLocations } = adSet.targeting
    if (geoLocations.cities && geoLocations.cities.length > 0) {
      return `${geoLocations.cities.length} ciudades (radio ${geoLocations.cities[0]?.radius ?? 0} ${
        geoLocations.cities[0]?.distanceUnit ?? "km"
      })`
    }
    if (geoLocations.countries && geoLocations.countries.length > 0) {
      return geoLocations.countries.join(", ")
    }
    return "Segmentación automática"
  }, [adSet])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Revisa y confirma</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Valida que la información de la campaña sea correcta antes de publicar en Meta.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaña</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium">{campaign?.name || "Sin definir"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Objetivo</span>
              <Badge variant="secondary">{campaign?.objective || "OUTCOME_ENGAGEMENT"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Categorías especiales</span>
              <span className="font-medium">
                {campaign?.specialAdCategories?.length ? campaign.specialAdCategories.join(", ") : "Employment"}
              </span>
            </div>
            {assets ? (
              <div className="space-y-2 rounded-md bg-muted/40 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Activos vinculados</p>
                <p className="text-sm">Cuenta: {assets.adAccountId || "-"}</p>
                <p className="text-sm">Página: {assets.pageId || "-"}</p>
                <p className="text-sm">WhatsApp: {assets.whatsappNumberId || "-"}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conjunto de anuncios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium">{adSet?.name || "Sin definir"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Presupuesto</span>
              <span className="font-medium">
                {adSet
                  ? adSet.budgetType === "LIFETIME"
                    ? `Total: $${((adSet.lifetimeBudgetCents ?? 0) / 100).toLocaleString()}`
                    : `Diario: $${(adSet.dailyBudgetCents / 100).toLocaleString()}`
                  : "Sin definir"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fechas</span>
              <span className="text-right">
                {adSet?.startTime ? new Date(adSet.startTime).toLocaleString() : "Sin definir"}
                {adSet?.endTime ? ` → ${new Date(adSet.endTime).toLocaleString()}` : ""}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Edad objetivo</span>
              <span className="font-medium">
                {adSet ? `${adSet.targeting.ageMin}-${adSet.targeting.ageMax}` : "Sin definir"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Objetivo de rendimiento</span>
              <span className="font-medium">{adSet?.optimizationGoal ?? "CONVERSATIONS"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Ubicación</span>
              <p className="text-sm font-medium">{geoSummary}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Creatividades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Imagen principal</span>
            <a href={creative?.imageUrl} target="_blank" rel="noreferrer" className="font-medium text-primary">
              Ver imagen
            </a>
          </div>
          <div>
            <span className="text-muted-foreground">Variantes</span>
            <ul className="mt-2 space-y-2">
              {creative?.variants?.map((variant) => (
                <li key={variant.id} className="rounded-md border p-3">
                  <p className="text-sm font-semibold">{variant.title || "Sin título"}</p>
                  <p className="text-xs text-muted-foreground">{variant.primaryText || "Texto no definido"}</p>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración del anuncio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ad-name">Nombre del anuncio</Label>
            <Input
              id="ad-name"
              value={adName}
              onChange={(event) => setAdName(event.target.value)}
              placeholder="Ej. Variante principal"
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Activar al publicar</p>
              <p className="text-xs text-muted-foreground">
                Si lo desactivas, el anuncio permanecerá en estado PAUSED hasta que lo actives manualmente.
              </p>
            </div>
            <Switch checked={activateOnCreate} onCheckedChange={setActivateOnCreate} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
