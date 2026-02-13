"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { CampaignSettings, CompanyRole, RoleBlueprint } from "../types"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const MODE_NEW = "new" as const
const MODE_EXISTING = "existing" as const
type Mode = typeof MODE_NEW | typeof MODE_EXISTING
const NONE = "__none__";

interface WizardStep2Props {
  value?: CampaignSettings
  onChange: (value: CampaignSettings) => void
  onBlueprintApply?: (blueprint: RoleBlueprint) => void
  roles?: CompanyRole[]
  isLoadingRoles?: boolean

  // NUEVO:
  existingCampaigns?: SyncedCampaign[]
  onUseExisting?: (metaCampaignId: string) => void
}

export type SyncedCampaign = {
  metaCampaignId: string
  name: string
  status?: string
}

const DEFAULT_CAMPAIGN: CampaignSettings = {
  name: "",
  objective: "OUTCOME_ENGAGEMENT",
  specialAdCategories: ["EMPLOYMENT"],
}

function campaignSignature(campaign?: CampaignSettings | null) {
  if (!campaign) return "null"
  const categories = Array.isArray(campaign.specialAdCategories) ? campaign.specialAdCategories : []
  return JSON.stringify([campaign.name ?? "", campaign.objective ?? "", campaign.roleId ?? null, categories])
}

export function WizardStep2({
  value,
  onChange,
  onBlueprintApply,
  roles = [],
  isLoadingRoles,
  existingCampaigns = [],
  onUseExisting,
}: WizardStep2Props) {
  const [mode, setMode] = useState<Mode>(MODE_NEW)
  const [selectedExisting, setSelectedExisting] = useState<string | null>(null)
  const [roleIdInput, setRoleIdInput] = useState(value?.roleId ? String(value.roleId) : "")
  const [campaignName, setCampaignName] = useState(value?.name ?? "")
  const lastSubmittedSignature = useRef<string>(campaignSignature(value))
  const lastPropSignature = useRef<string | null>(campaignSignature(value))
  const blueprintSignatureRef = useRef<string | null>(null)

  const campaignState = useMemo<CampaignSettings>(() => {
    const base = value ?? DEFAULT_CAMPAIGN
    const categories =
      base.specialAdCategories && base.specialAdCategories.length > 0
        ? [...base.specialAdCategories]
        : [...DEFAULT_CAMPAIGN.specialAdCategories]

    const normalizedRoleId = roleIdInput ? Number(roleIdInput) : base.roleId

    return {
      name: campaignName,
      objective: base.objective ?? DEFAULT_CAMPAIGN.objective,
      specialAdCategories: categories,
      roleId: normalizedRoleId && Number.isFinite(normalizedRoleId) ? normalizedRoleId : undefined,
    }
  }, [value, campaignName, roleIdInput])

  const selectedRole = useMemo(() => {
    const id = roleIdInput ? Number(roleIdInput) : undefined
    if (!id || Number.isNaN(id)) {
      return undefined
    }
    return roles.find((role) => role.role_id === id)
  }, [roles, roleIdInput])

  const blueprint = useMemo<RoleBlueprint | null>(() => selectedRole?.blueprint ?? null, [selectedRole])

  useEffect(() => {
    const signature = campaignSignature(campaignState)
    if (signature !== lastSubmittedSignature.current) {
      lastSubmittedSignature.current = signature
      onChange({
        ...campaignState,
        specialAdCategories: [...campaignState.specialAdCategories],
      })
    }
  }, [campaignState, onChange])

  useEffect(() => {
    lastSubmittedSignature.current = campaignSignature(value)
  }, [
    value?.name,
    value?.objective,
    value?.roleId,
    JSON.stringify(value?.specialAdCategories ?? []),
  ])

  useEffect(() => {
    if (!roles || roles.length === 0) {
      if (roleIdInput !== "") {
        setRoleIdInput("")
      }
      return
    }

    const selectedId = roleIdInput ? Number(roleIdInput) : value?.roleId
    const hasSelected =
      typeof selectedId === "number" && !Number.isNaN(selectedId)
        ? roles.some((role) => role.role_id === selectedId)
        : false

    if (hasSelected) {
      return
    }

    const defaultRole = roles.find((role) => role.default_role) ?? roles[0]
    if (defaultRole && String(defaultRole.role_id) !== roleIdInput) {
      setRoleIdInput(String(defaultRole.role_id))
    }
  }, [roles, roleIdInput, value?.roleId])

  useEffect(() => {
    const signature = campaignSignature(value)
    if (signature !== lastPropSignature.current) {
      lastPropSignature.current = signature
      if (value) {
        setCampaignName(value.name ?? "")
        setRoleIdInput(typeof value.roleId === "number" ? String(value.roleId) : "")
      } else {
        setCampaignName("")
        setRoleIdInput("")
      }
    }
  }, [value])

  useEffect(() => {
    if (!blueprint) {
      blueprintSignatureRef.current = null
      return
    }
    const signature = campaignSignature({
      name: blueprint.name_template,
      objective: blueprint.objective,
      specialAdCategories: blueprint.special_ad_categories.items,
      roleId: blueprint.role_id,
    })
    if (blueprintSignatureRef.current === signature) {
      return
    }
    blueprintSignatureRef.current = signature
    onBlueprintApply?.(blueprint)
  }, [blueprint, onBlueprintApply])

  useEffect(() => {
      if (mode !== MODE_NEW) {
        blueprintSignatureRef.current = null
        return
      }
      if (!blueprint) {
        blueprintSignatureRef.current = null
        return
      }
      const signature = campaignSignature({
        name: blueprint.name_template,
        objective: blueprint.objective,
        specialAdCategories: blueprint.special_ad_categories.items,
        roleId: blueprint.role_id,
      })
      if (blueprintSignatureRef.current === signature) return
      blueprintSignatureRef.current = signature
      onBlueprintApply?.(blueprint)
    }, [mode, blueprint, onBlueprintApply])

    useEffect(() => {
      if (mode !== MODE_NEW) return
      const signature = campaignSignature(campaignState)
      if (signature !== lastSubmittedSignature.current) {
        lastSubmittedSignature.current = signature
        onChange({
          ...campaignState,
          specialAdCategories: [...campaignState.specialAdCategories],
        })
      }
    }, [mode, campaignState, onChange])

    const handlePickExisting = (v: string) => {
      if (v === NONE) {
        setSelectedExisting(null)
        return
      }
      setSelectedExisting(v)
      onUseExisting?.(v)
    }



  return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Configura la campaña</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea una campaña nueva o selecciona una ya existente sincronizada desde Meta.
          </p>
        </div>

        {/* Switch de modo */}
        <div className="space-y-2">
          <Label>Modo</Label>
          <RadioGroup
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            value={mode}
            onValueChange={(v) => setMode(v as Mode)}
          >
            <div className="flex items-center space-x-2 rounded-md border p-3">
              <RadioGroupItem id="mode-new" value={MODE_NEW} />
              <Label htmlFor="mode-new" className="cursor-pointer">Crear campaña nueva</Label>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-3">
              <RadioGroupItem id="mode-existing" value={MODE_EXISTING} />
              <Label htmlFor="mode-existing" className="cursor-pointer">Usar campaña existente</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Bloque: existente */}
        {mode === MODE_EXISTING ? (
          <div className="space-y-2">
            <Label htmlFor="existing-campaign">Campaña existente</Label>
            <Select
              value={selectedExisting ?? NONE}
              onValueChange={handlePickExisting}
            >
              <SelectTrigger id="existing-campaign">
                <SelectValue placeholder="Selecciona una campaña" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Selecciona…</SelectItem>
                {existingCampaigns.map((c) => (
                  <SelectItem key={c.metaCampaignId} value={c.metaCampaignId}>
                    {c.name || c.metaCampaignId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {existingCampaigns.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No hay campañas sincronizadas. Ve al paso anterior y pulsa “Sincronizar”.
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Bloque: nueva (tu UI original con disabled cuando mode === existing) */}
        <Alert>
          <AlertTitle>Objetivo y categoría fija</AlertTitle>
          <AlertDescription>
            Todas las campañas se publican con el objetivo <strong>MESSAGES</strong> y categoría especial{" "}
            <strong>EMPLOYMENT</strong> para cumplir con las políticas de Meta.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Nombre de la campaña</Label>
            <Input
              id="campaign-name"
              placeholder="Ej. Reclutamiento Operadores Q2"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              disabled={mode === MODE_EXISTING}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-select">Rol (opcional)</Label>
            <Select
              value={roleIdInput === "" ? undefined : roleIdInput}
              onValueChange={(v) => setRoleIdInput(v === NONE ? "" : v)}
              disabled={isLoadingRoles || roles.length === 0 || mode === MODE_EXISTING}
            >
              <SelectTrigger id="role-select">
                <SelectValue placeholder={isLoadingRoles ? "Cargando roles..." : "Selecciona un rol"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin rol</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.role_id} value={String(role.role_id)}>
                    {role.name}{role.shift ? ` • ${role.shift}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecciona un rol para precargar la plantilla. En “campaña existente” este campo se desactiva.
            </p>
            {isLoadingRoles ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Cargando roles…
              </div>
            ) : null}
            {!isLoadingRoles && roles.length === 0 ? (
              <p className="text-xs text-destructive">No hay roles activos para la compañía seleccionada.</p>
            ) : null}
            {selectedRole?.role_info && Object.keys(selectedRole.role_info).length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Info del rol:{" "}
                {Object.entries(selectedRole.role_info).map(([k, v]) => `${k}: ${String(v)}`).join(" • ")}
              </p>
            ) : null}
          </div>

          {mode === MODE_NEW && blueprint ? (
            <Alert>
              <AlertTitle>Plantilla aplicada</AlertTitle>
              <AlertDescription>
                Usaremos el blueprint <strong>{blueprint.name_template}</strong> ({blueprint.objective}) y podrás ajustar los
                siguientes pasos antes de publicar.
              </AlertDescription>
            </Alert>
          ) : mode === MODE_NEW && roles.length > 0 && !isLoadingRoles ? (
            <p className="text-xs text-muted-foreground">
              Este rol no tiene una plantilla registrada; configura la campaña manualmente.
            </p>
          ) : null}
        </div>
      </div>
    )

}
