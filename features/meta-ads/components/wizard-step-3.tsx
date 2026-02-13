"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useDebounce } from "@/hooks/use-debounce"
import { Globe2, MapPin, Target } from "lucide-react"
import { useCompanyID } from "@/context/CompanyContext"
import { metaAdsApi } from "../lib/api-client"
import type {
  AdSetSettings,
  GeoLocationCity,
  LocationSearchResult,
  DistanceUnit,
  GeoLocationCustom,
} from "../types"

interface WizardStep3Props {
  value?: AdSetSettings
  onChange: (value: AdSetSettings) => void
  adAccountId?: string
  disabled?: boolean
  roleLocation?: GeoLocationCustom
}

const COUNTRY_PLACEHOLDER = "MX,US"
const DEFAULT_NAME = "Conjunto Meta Ads"
const COORD_EPS = 1e-6
const samePoint = (a: GeoLocationCustom, b: GeoLocationCustom) =>
  Math.abs(a.latitude - b.latitude) < COORD_EPS &&
  Math.abs(a.longitude - b.longitude) < COORD_EPS

const MIN_RADIUS_KM = 17
const MIN_RADIUS_MI = 10
const minRadiusByUnit = (u: DistanceUnit) => (u === "mile" ? MIN_RADIUS_MI : MIN_RADIUS_KM)
const clampRadius = (val: number | undefined, unit: DistanceUnit) => {
  const v = typeof val === "number" && Number.isFinite(val) ? val : 0
  const min = minRadiusByUnit(unit)
  return v < min ? min : v
}

function toDateInputValue(iso?: string) {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

function toTimeInputValue(iso?: string) {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(11, 16)
}

function toIsoString(date: string, time: string) {
  if (!date || !time) return undefined
  const combined = new Date(`${date}T${time}:00`)
  if (Number.isNaN(combined.getTime())) return undefined
  return combined.toISOString()
}

type LocationMode = "countries" | "cities" | "custom"

export function WizardStep3({ value, onChange, adAccountId, disabled, roleLocation }: WizardStep3Props) {
  const rawCompanyId = useCompanyID()
  const companyId = rawCompanyId > 0 ? rawCompanyId : undefined

  // Básicos
  const [adSetName, setAdSetName] = useState(value?.name ?? DEFAULT_NAME)
  const [budgetType, setBudgetType] = useState<"DAILY" | "LIFETIME">(value?.budgetType === "LIFETIME" ? "LIFETIME" : "DAILY")
  const initialBudget = useMemo(() => {
    if (value?.budgetType === "LIFETIME") return value.lifetimeBudgetCents ? (value.lifetimeBudgetCents / 100).toString() : ""
    return value ? (value.dailyBudgetCents / 100).toString() : ""
  }, [value])
  const [budget, setBudget] = useState(initialBudget)
  const [optimizationGoal, setOptimizationGoal] = useState<"CONVERSATIONS" | "LINK_CLICKS">(
    value?.optimizationGoal === "LINK_CLICKS" ? "LINK_CLICKS" : "CONVERSATIONS",
  )
  const [startDate, setStartDate] = useState(() => toDateInputValue(value?.startTime))
  const [startTime, setStartTime] = useState(() => toTimeInputValue(value?.startTime) || "09:00")
  const [endDate, setEndDate] = useState(() => toDateInputValue(value?.endTime))
  const [endTime, setEndTime] = useState(() => toTimeInputValue(value?.endTime) || "21:00")

  // Targeting: edad y género
  const [ageMin, setAgeMin] = useState(value?.targeting.ageMin ?? 21)
  const [ageMax, setAgeMax] = useState(value?.targeting.ageMax ?? 55)
  const [gender, setGender] = useState<"all" | "male" | "female">(() => {
    if (!value?.targeting.genders || value.targeting.genders.length === 0) return "all"
    return value.targeting.genders[0] === 1 ? "male" : "female"
  })

  // Modo de ubicación
  const [locationMode, setLocationMode] = useState<LocationMode>(() => {
    if (value?.targeting.geoLocations.customLocations?.length) return "custom"
    if (value?.targeting.geoLocations.cities?.length) return "cities"
    return "countries"
  })

  // Países
  const [countriesInput, setCountriesInput] = useState(() =>
    value?.targeting.geoLocations.countries?.join(",") ?? "",
  )

  // Ciudades
  const [citySearch, setCitySearch] = useState("")
  const [cityResults, setCityResults] = useState<LocationSearchResult[]>([])
  const [selectedCities, setSelectedCities] = useState<GeoLocationCity[]>(value?.targeting.geoLocations.cities ?? [])
  const debouncedSearch = useDebounce(citySearch, 400)

  // Custom (colonias por punto y radio)
  const [selectedCustom, setSelectedCustom] = useState<GeoLocationCustom[]>(
    value?.targeting.geoLocations.customLocations ?? [],
  )
  const [newLat, setNewLat] = useState<string>("")
  const [newLng, setNewLng] = useState<string>("")
  const [newRadius, setNewRadius] = useState<string>("17")
  const [newUnit, setNewUnit] = useState<DistanceUnit>("kilometer")
  const [newAddress, setNewAddress] = useState<string>("")
  const roleLocationAppliedRef = useRef(false)
  const roleLocationKeyRef = useRef<string | null>(null)

  // Evita loops al elevar cambios
  const lastEmittedRef = useRef<string>("")
  const suppressEmitRef = useRef(false)

  useEffect(() => {
    if (!roleLocation) {
      roleLocationAppliedRef.current = false
      roleLocationKeyRef.current = null
      return
    }

    const unit = roleLocation.distanceUnit ?? "kilometer"
    const candidate: GeoLocationCustom = {
      latitude: roleLocation.latitude,
      longitude: roleLocation.longitude,
      radius: clampRadius(roleLocation.radius, unit),
      distanceUnit: unit,
      address: roleLocation.address ?? undefined,
    }
    const key = `${candidate.latitude}:${candidate.longitude}:${candidate.radius}:${candidate.distanceUnit}:${candidate.address ?? ""}`
    if (roleLocationKeyRef.current !== key) {
      roleLocationAppliedRef.current = false
      roleLocationKeyRef.current = key
    }

    if (roleLocationAppliedRef.current) return

    setSelectedCustom((prev) => {
      if (prev.some((point) => samePoint(point, candidate))) {
        roleLocationAppliedRef.current = true
        return prev
      }
      roleLocationAppliedRef.current = true
      return [...prev, candidate]
    })

    setLocationMode((prev) => (prev === "custom" ? prev : "custom"))
  }, [roleLocation])

  // Sincroniza estados cuando cambia `value`
  useEffect(() => {
    if (!value) return

    suppressEmitRef.current = true

    if (value.name !== adSetName) setAdSetName(value.name)

    const nextBudgetType = value.budgetType === "LIFETIME" ? "LIFETIME" : "DAILY"
    if (nextBudgetType !== budgetType) setBudgetType(nextBudgetType)

    const newBudget = nextBudgetType === "LIFETIME"
      ? (value.lifetimeBudgetCents ? (value.lifetimeBudgetCents / 100).toString() : "")
      : (value.dailyBudgetCents / 100).toString()
    if (newBudget !== budget) setBudget(newBudget)

    const nextOpt = value.optimizationGoal === "LINK_CLICKS" ? "LINK_CLICKS" : "CONVERSATIONS"
    if (nextOpt !== optimizationGoal) setOptimizationGoal(nextOpt)

    const newStartDate = toDateInputValue(value.startTime)
    if (newStartDate !== startDate) setStartDate(newStartDate)

    const newStartTime = toTimeInputValue(value.startTime) || "09:00"
    if (newStartTime !== startTime) setStartTime(newStartTime)

    const newEndDate = toDateInputValue(value.endTime)
    if (newEndDate !== endDate) setEndDate(newEndDate)

    const newEndTime = toTimeInputValue(value.endTime) || "21:00"
    if (newEndTime !== endTime) setEndTime(newEndTime)

    if (value.targeting.ageMin !== ageMin) setAgeMin(value.targeting.ageMin)
    if (value.targeting.ageMax !== ageMax) setAgeMax(value.targeting.ageMax)

    const newGender = value.targeting.genders.length === 0 ? "all" : value.targeting.genders[0] === 1 ? "male" : "female"
    if (newGender !== gender) setGender(newGender)

    const hasCustom = Boolean(value.targeting.geoLocations.customLocations?.length)
    const hasCities = Boolean(value.targeting.geoLocations.cities?.length)
    const newLocationMode = hasCustom ? "custom" : hasCities ? "cities" : "countries"
    if (newLocationMode !== locationMode) setLocationMode(newLocationMode)

    const newCountriesInput = value.targeting.geoLocations.countries?.join(",") ?? ""
    if (newCountriesInput !== countriesInput) setCountriesInput(newCountriesInput)

    if (JSON.stringify(value.targeting.geoLocations.cities ?? []) !== JSON.stringify(selectedCities)) {
      setSelectedCities((value.targeting.geoLocations.cities ?? []).map(c => {
        const unit = c.distanceUnit ?? "kilometer"
        return {
          key: c.key,
          name: c.name,
          radius: clampRadius(c.radius, unit),
          distanceUnit: unit,
        }
      }))
    }
    if (JSON.stringify(value.targeting.geoLocations.customLocations ?? []) !== JSON.stringify(selectedCustom)) {
      setSelectedCustom((value.targeting.geoLocations.customLocations ?? []).map(p => {
        const unit = p.distanceUnit ?? "kilometer"
        return {
          latitude: p.latitude,
          longitude: p.longitude,
          radius: clampRadius(p.radius, unit),
          distanceUnit: unit,
          address: p.address ?? undefined,
        }
      }))
    }

    const t = setTimeout(() => { suppressEmitRef.current = false }, 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Búsqueda de ciudades (Meta targetingsearch)
  useEffect(() => {
    if (!debouncedSearch || !adAccountId || locationMode !== "cities") {
      setCityResults([])
      return
    }

    let isMounted = true
    const search = async () => {
      if (!companyId) return
      try {
        const results = await metaAdsApi.searchLocations({
          actId: adAccountId,
          query: debouncedSearch,
        })
        if (isMounted) setCityResults(results)
      } catch (error) {
        console.error("Error searching locations", error)
        if (isMounted) setCityResults([])
      }
    }

    void search()
    return () => {
      isMounted = false
    }
  }, [companyId, debouncedSearch, adAccountId, locationMode])

  // Genders → números Meta
  const genders = useMemo(() => {
    if (gender === "male") return [1]
    if (gender === "female") return [2]
    return []
  }, [gender])

  // Empuja cambios hacia arriba (solo si hay cambios reales)
  useEffect(() => {
    if (suppressEmitRef.current) return

    const parsed = Number.parseFloat(budget)
    const cents = Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : 0
    const startIso = toIsoString(startDate, startTime || "09:00")
    const endIso = endDate ? toIsoString(endDate, endTime || "21:00") : undefined

    if (!adSetName || !startIso) return
    // Validación mínima local según tipo de presupuesto
    if (budgetType === "LIFETIME") {
      if (cents <= 0 || !endIso) return
    } else {
      if (cents <= 0) return
    }

    const geoLocations =
      locationMode === "countries"
        ? {
            countries: countriesInput
              .split(",")
              .map((country) => country.trim().toUpperCase())
              .filter(Boolean),
          }
        : locationMode === "cities"
        ? {
            cities: selectedCities.map((city) => {
              const unit = city.distanceUnit || "kilometer"
              return {
                key: city.key,
                name: city.name,
                radius: clampRadius(city.radius, unit),
                distanceUnit: unit,
              }
            }),
          }
        : {
            customLocations: selectedCustom.map((p) => {
              const unit = p.distanceUnit ?? "kilometer"
              return {
                latitude: p.latitude,
                longitude: p.longitude,
                radius: clampRadius(p.radius, unit),
                distanceUnit: unit,
                address: p.address ?? undefined,
              }
            }),
          }

    const nextPayload: AdSetSettings = {
      name: adSetName,
      budgetType,
      dailyBudgetCents: budgetType === "DAILY" ? cents : 0,
      lifetimeBudgetCents: budgetType === "LIFETIME" ? cents : undefined,
      optimizationGoal,
      startTime: startIso,
      endTime: endIso,
      targeting: {
        ageMin,
        ageMax,
        genders,
        geoLocations,
      },
    }

    const serialized = JSON.stringify(nextPayload)
    if (serialized !== lastEmittedRef.current) {
      lastEmittedRef.current = serialized
      onChange(nextPayload)
    }
  }, [
    adSetName,
    budget,
    startDate,
    startTime,
    endDate,
    endTime,
    ageMin,
    ageMax,
    genders,
    locationMode,
    countriesInput,
    selectedCities,
    selectedCustom,
    onChange,
  ])

  // Ciudades: agregar/editar/quitar
  const handleAddCity = (result: LocationSearchResult) => {
    if (selectedCities.some((city) => city.key === result.key)) return
    setSelectedCities((prev) => [...prev, { key: result.key, name: result.name, radius: MIN_RADIUS_KM, distanceUnit: "kilometer" }])
    setCitySearch("")
    setCityResults([])
  }

  const handleUpdateCity = (key: string, patch: Partial<GeoLocationCity>) => {
    setSelectedCities((prev) => prev.map((city) => (city.key === key ? { ...city, ...patch } : city)))
  }

  const handleRemoveCity = (key: string) => {
    setSelectedCities((prev) => prev.filter((city) => city.key !== key))
  }

  // Custom: agregar punto
  const handleAddCustomPoint = () => {
    const lat = Number.parseFloat(newLat)
    const lng = Number.parseFloat(newLng)
    const rad = Number.parseFloat(newRadius)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    const radius = Number.isFinite(rad) && rad > 0 ? rad : 1
    const clamped = clampRadius(radius, newUnit)
    setSelectedCustom((prev) => [
      ...prev,
      {
        latitude: lat,
        longitude: lng,
        radius: clamped,
        distanceUnit: newUnit,
        address: newAddress?.trim() ? newAddress.trim() : undefined,
      },
    ])
    setNewLat("")
    setNewLng("")
    setNewRadius("1")
    setNewAddress("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Configura el conjunto de anuncios</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define presupuesto, fechas y la segmentación que utilizaremos en Meta Ads.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adset-name">Nombre del conjunto</Label>
            <Input
              id="adset-name"
              placeholder="Ej. Operadores Norte"
              value={adSetName}
              onChange={(event) => setAdSetName(event.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de presupuesto</Label>
            <Select value={budgetType} onValueChange={(v) => setBudgetType(v as any)} disabled={disabled}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Diario</SelectItem>
                <SelectItem value="LIFETIME">Total (de por vida)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">{budgetType === "LIFETIME" ? "Presupuesto total (en moneda local)" : "Presupuesto diario (en moneda local)"}</Label>
            <Input
              id="budget"
              type="number"
              min="1"
              step="0.01"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              placeholder="500"
              disabled={disabled}
            />
            {budgetType === "LIFETIME" ? (
              <p className="text-xs text-muted-foreground">Para presupuesto total debes indicar fecha y hora de fin.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Objetivo de rendimiento</Label>
            <Select value={optimizationGoal} onValueChange={(v) => setOptimizationGoal(v as any)} disabled={disabled}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONVERSATIONS">Conversaciones</SelectItem>
                <SelectItem value="LINK_CLICKS">Clics</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date">Fecha de inicio</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-time">Hora de inicio</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="end-date">Fecha de fin (opcional)</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                min={startDate}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">Hora de fin</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rango de edad</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                min={18}
                max={ageMax - 1}
                value={ageMin}
                onChange={(event) => setAgeMin(Number.parseInt(event.target.value) || 18)}
                disabled={disabled}
              />
              <Input
                type="number"
                min={ageMin + 1}
                max={65}
                value={ageMax}
                onChange={(event) => setAgeMax(Number.parseInt(event.target.value) || 65)}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Género</Label>
            <RadioGroup
              value={gender}
              onValueChange={(val) => setGender(val as "all" | "male" | "female")}
              className="grid grid-cols-3 gap-2"
            >
              <div className="flex items-center gap-2 rounded-md border p-3">
                <RadioGroupItem value="all" id="gender-all" disabled={disabled} />
                <Label htmlFor="gender-all" className="cursor-pointer">Todos</Label>
              </div>
              <div className="flex items-center gap-2 rounded-md border p-3">
                <RadioGroupItem value="male" id="gender-male" disabled={disabled} />
                <Label htmlFor="gender-male" className="cursor-pointer">Hombres</Label>
              </div>
              <div className="flex items-center gap-2 rounded-md border p-3">
                <RadioGroupItem value="female" id="gender-female" disabled={disabled} />
                <Label htmlFor="gender-female" className="cursor-pointer">Mujeres</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="location-mode" className="flex items-center gap-2">
              <Target className="h-4 w-4" /> Segmentación geográfica
            </Label>
            <Select
              value={locationMode}
              onValueChange={(v) => setLocationMode(v as LocationMode)}
              disabled={disabled}
            >
              <SelectTrigger id="location-mode">
                <SelectValue placeholder="Selecciona el tipo de segmentación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="countries">Países completos</SelectItem>
                <SelectItem value="cities">Ciudades con radio</SelectItem>
                <SelectItem value="custom">Colonias (punto y radio)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {locationMode === "countries" ? (
            <div className="space-y-2">
              <Label htmlFor="countries" className="flex items-center gap-2">
                <Globe2 className="h-4 w-4" /> Países (códigos ISO separados por coma)
              </Label>
              <Textarea
                id="countries"
                rows={3}
                placeholder={COUNTRY_PLACEHOLDER}
                value={countriesInput}
                onChange={(event) => setCountriesInput(event.target.value)}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">Ejemplo: MX,US,CO.</p>
            </div>
          ) : locationMode === "cities" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="city-search" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Buscar ciudad
                </Label>
                <Input
                  id="city-search"
                  placeholder="Ej. Tlalnepantla"
                  value={citySearch}
                  onChange={(event) => setCitySearch(event.target.value)}
                  disabled={disabled || !adAccountId}
                />
                {!adAccountId ? (
                  <p className="text-xs text-muted-foreground">
                    Selecciona primero una cuenta publicitaria para habilitar la búsqueda.
                  </p>
                ) : null}
              </div>

              {cityResults.length > 0 ? (
                <div className="space-y-2 rounded-md border p-3 text-sm">
                  <p className="font-medium">Resultados</p>
                  <div className="flex flex-wrap gap-2">
                    {cityResults.map((result) => (
                      <Button
                        key={result.key}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddCity(result)}
                      >
                        {result.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-sm font-medium">Ciudades seleccionadas</p>
                {selectedCities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Agrega al menos una ciudad para continuar.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedCities.map((city) => (
                      <div key={city.key} className="rounded-md border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{city.name || city.key}</p>
                            <p className="text-xs text-muted-foreground">ID {city.key}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveCity(city.key)}>
                            Quitar
                          </Button>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`radius-${city.key}`}>Radio (km)</Label>
                            <Input
                              id={`radius-${city.key}`}
                              type="number"
                              min={city.distanceUnit === 'mile' ? MIN_RADIUS_MI : MIN_RADIUS_KM}
                              max={80}
                              value={city.radius ?? MIN_RADIUS_KM}
                              onChange={(event) => {
                                const unit = city.distanceUnit ?? 'kilometer'
                                const raw = Number.parseFloat(event.target.value)
                                const clamped = clampRadius(raw, unit)
                                handleUpdateCity(city.key, { radius: clamped })
                              }}
                              disabled={disabled}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`distance-${city.key}`}>Unidad</Label>
                            <Select
                              value={city.distanceUnit ?? "kilometer"}
                              onValueChange={(v) => {
                                const unit = v as DistanceUnit
                                // clamp radius when unit changes
                                const current = selectedCities.find(c => c.key === city.key)
                                const newRadius = clampRadius(current?.radius, unit)
                                handleUpdateCity(city.key, { distanceUnit: unit, radius: newRadius })
                              }}
                              disabled={disabled}
                            >
                              <SelectTrigger id={`distance-${city.key}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kilometer">Kilómetros</SelectItem>
                                <SelectItem value="mile">Millas</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // CUSTOM (colonias por punto y radio)
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Agregar punto (lat, lon, radio)
                </Label>
                <div className="grid gap-2 md:grid-cols-5">
                  <Input
                    placeholder="Latitud"
                    type="number"
                    step="0.00001"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    disabled={disabled}
                  />
                  <Input
                    placeholder="Longitud"
                    type="number"
                    step="0.00001"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    disabled={disabled}
                  />
                  <Input
                    placeholder={newUnit === 'mile' ? `Radio (${MIN_RADIUS_MI}+ mi)` : `Radio (${MIN_RADIUS_KM}+ km)`}
                    type="number"
                    min={newUnit === 'mile' ? MIN_RADIUS_MI : MIN_RADIUS_KM}
                    step="1"
                    value={newRadius}
                    onChange={(e) => setNewRadius(e.target.value)}
                    disabled={disabled}
                  />
                  <Select value={newUnit} onValueChange={(v) => {
                    const unit = v as DistanceUnit
                    setNewUnit(unit)
                    // ensure input respects min
                    const parsed = Number.parseFloat(newRadius)
                    const clamped = clampRadius(Number.isFinite(parsed) ? parsed : undefined, unit)
                    setNewRadius(String(clamped))
                  }} disabled={disabled}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kilometer">Kilómetros</SelectItem>
                      <SelectItem value="mile">Millas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={handleAddCustomPoint} disabled={disabled}>
                    Agregar
                  </Button>
                </div>
                <Input
                  className="mt-2"
                  placeholder="Etiqueta / colonia (opcional)"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  Tip: en Google Maps, clic derecho → “¿Qué hay aquí?” para copiar lat, lon. Radio mínimo recomendado: 1 km.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Puntos agregados</p>
                {selectedCustom.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Agrega al menos un punto.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedCustom.map((p, idx) => (
                      <div key={`${p.latitude},${p.longitude}:${idx}`} className="rounded-md border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">
                              {p.address ?? `${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              lat {p.latitude} • lon {p.longitude}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCustom((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            Quitar
                          </Button>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Radio</Label>
                            <Input
                              type="number"
                              min={0.1}
                              step="0.1"
                              value={p.radius}
                              onChange={(e) =>
                                setSelectedCustom((prev) =>
                                  prev.map((it, i) =>
                                    i === idx ? { ...it, radius: Number.parseFloat(e.target.value) || 1 } : it,
                                  ),
                                )
                              }
                              disabled={disabled}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Unidad</Label>
                            <Select
                              value={p.distanceUnit ?? "kilometer"}
                              onValueChange={(v) =>
                                setSelectedCustom((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, distanceUnit: v as DistanceUnit } : it)),
                                )
                              }
                              disabled={disabled}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kilometer">Kilómetros</SelectItem>
                                <SelectItem value="mile">Millas</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Etiqueta</Label>
                            <Input
                              placeholder="Colonia / referencia"
                              value={p.address ?? ""}
                              onChange={(e) =>
                                setSelectedCustom((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, address: e.target.value } : it)),
                                )
                              }
                              disabled={disabled}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
