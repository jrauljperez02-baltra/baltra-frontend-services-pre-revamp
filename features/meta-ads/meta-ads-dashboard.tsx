"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useCompanyID } from "@/context/CompanyContext"
import { metaAdsApi } from "./lib/api-client"
import type { CompanyCampaign, CompanySummary } from "./types"
import { Copy, DollarSign, Edit, Eye, Loader2, Pause, Play, Plus, RefreshCw, TrendingUp, Users } from "lucide-react"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MetaAdsDashboardProps {
  adAccountId?: string
}

interface AdData {
  id: string
  name: string
  status: "ACTIVE" | "PAUSED"
  daily_budget: number
  impressions: number
  reach: number
  spend: number
  conversations: number
  cpm: number
  cpp: number
}

export function MetaAdsDashboard({ adAccountId }: MetaAdsDashboardProps) {
  const router = useRouter()
  const rawCompanyId = useCompanyID()
  // Do not auto-use context company for dashboard data to avoid premature requests
  const contextCompanyId = rawCompanyId > 0 ? rawCompanyId : undefined
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState("today")
  const [ads, setAds] = useState<AdData[]>([])
  const [kpis, setKpis] = useState({
    conversations: 0,
    reach: 0,
    impressions: 0,
    spend: 0,
    cpm: 0,
    cpp: 0,
  })
  const [chartData, setChartData] = useState<any[]>([])

  // Administración
  const [companies, setCompanies] = useState<CompanySummary[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined)
  const effectiveCompanyId = useMemo(() => selectedCompanyId, [selectedCompanyId])
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)
  const [campaigns, setCampaigns] = useState<CompanyCampaign[]>([])
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false)

  // cargar compañías
  useEffect(() => {
    let cancelled = false
    async function loadCompanies() {
      setIsLoadingCompanies(true)
      try {
        const list = await metaAdsApi.getCompanies()
        if (cancelled) return
        setCompanies(list)
        // Do not auto-select a company to avoid premature API calls
      } catch (err) {
        console.error("[meta-ads] Error cargando compañías", err)
      } finally {
        if (!cancelled) setIsLoadingCompanies(false)
      }
    }
    void loadCompanies()
    return () => {
      cancelled = true
    }
  }, [])

  // cargar campañas de la compañía
  useEffect(() => {
    let cancelled = false
    async function loadCompanyCampaigns() {
      if (!effectiveCompanyId) {
        setCampaigns([])
        return
      }
      setIsLoadingCampaigns(true)
      try {
        const data = await metaAdsApi.getCompanyCampaigns(effectiveCompanyId)
        if (cancelled) return
        setCampaigns(data)
      } catch (err) {
        console.error("[meta-ads] Error cargando campañas", err)
        if (!cancelled) setCampaigns([])
      } finally {
        if (!cancelled) setIsLoadingCampaigns(false)
      }
    }
    void loadCompanyCampaigns()
    return () => {
      cancelled = true
    }
  }, [effectiveCompanyId])

  const handleSyncCampaigns = async () => {
    if (!effectiveCompanyId) return
    setIsLoadingCampaigns(true)
    try {
      await metaAdsApi.syncCompanyCampaigns(effectiveCompanyId)
      const data = await metaAdsApi.getCompanyCampaigns(effectiveCompanyId)
      setCampaigns(data)
    } catch (err) {
      console.error("[meta-ads] Error sincronizando campañas", err)
    } finally {
      setIsLoadingCampaigns(false)
    }
  }

  const handleRefreshCampaigns = async () => {
    if (!effectiveCompanyId) return
    setIsLoadingCampaigns(true)
    try {
      const data = await metaAdsApi.getCompanyCampaigns(effectiveCompanyId)
      setCampaigns(data)
    } catch (err) {
      console.error("[meta-ads] Error refrescando campañas", err)
    } finally {
      setIsLoadingCampaigns(false)
    }
  }

  const toggleStatus = (current?: string) => (current === "ACTIVE" ? "PAUSED" : "ACTIVE")

  const handleToggleCampaignStatus = async (campaignId?: string, current?: string) => {
    if (!campaignId || !effectiveCompanyId) return
    const next = toggleStatus(current)
    try {
      await metaAdsApi.updateCampaignStatus(campaignId, effectiveCompanyId, next as any)
      setCampaigns((prev) =>
        prev.map((c) => (c.metaCampaignId === campaignId ? { ...c, status: next } : c)),
      )
    } catch (err) {
      console.error("[meta-ads] Error actualizando estado de campaña", err)
    }
  }

  const handleToggleAdSetStatus = async (adSetId?: string, current?: string) => {
    if (!adSetId || !effectiveCompanyId) return
    const next = toggleStatus(current)
    try {
      await metaAdsApi.updateAdSetStatus(adSetId, effectiveCompanyId, next as any)
      setCampaigns((prev) =>
        prev.map((c) => ({
          ...c,
          adSets: c.adSets?.map((s) => (s.metaAdSetId === adSetId ? { ...s, status: next } : s)),
        })),
      )
    } catch (err) {
      console.error("[meta-ads] Error actualizando estado de ad set", err)
    }
  }

  const handleToggleAdStatus = async (adId?: string, current?: string) => {
    if (!adId || !effectiveCompanyId) return
    const next = toggleStatus(current)
    try {
      await metaAdsApi.updateAdStatus(adId, effectiveCompanyId, next as any)
      setCampaigns((prev) =>
        prev.map((c) => ({
          ...c,
          adSets: c.adSets?.map((s) => ({
            ...s,
            ads: s.ads?.map((a) => (a.metaAdId === adId ? { ...a, status: next } : a)),
          })),
        })),
      )
    } catch (err) {
      console.error("[meta-ads] Error actualizando estado de ad", err)
    }
  }

  const handleUpdateAdBudget = async (adId: string, value: string) => {
    const parsed = Number.parseFloat(value)
    const cents = Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
    if (!adId || !effectiveCompanyId || cents <= 0) return
    try {
      await metaAdsApi.updateAdBudget(adId, effectiveCompanyId, cents)
      // no hay representación local del presupuesto por ad, se deja como side-effect
    } catch (err) {
      console.error("[meta-ads] Error actualizando presupuesto", err)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadDashboardData() {
      if (!effectiveCompanyId) {
        return
      }
      const selectedCompany = companies.find((c) => c.id === effectiveCompanyId)
      const selectedAdAccountId = selectedCompany?.adAccount?.account_id || selectedCompany?.adAccount?.id || adAccountId
      setLoading(true)
      try {
        const adsResponse = await metaAdsApi.getAds(selectedAdAccountId, effectiveCompanyId)
        const rawAds = Array.isArray(adsResponse) ? adsResponse : []

        // Until backend delivers full payloads, keep the mock enrichment localised here.
        const mockAds: AdData[] = rawAds.map((ad: any, index: number) => ({
          id: ad.id,
          name: ad.name,
          status: ad.status,
          daily_budget: 5000 + index * 1000,
          impressions: 12500 + index * 2000,
          reach: 8300 + index * 1500,
          spend: 45.5 + index * 10,
          conversations: 23 + index * 5,
          cpm: 3.64 + index * 0.5,
          cpp: 1.98 + index * 0.3,
        }))

        if (cancelled) {
          return
        }

        setAds(mockAds)

        const totals = mockAds.reduce(
          (acc, ad) => ({
            conversations: acc.conversations + ad.conversations,
            reach: acc.reach + ad.reach,
            impressions: acc.impressions + ad.impressions,
            spend: acc.spend + ad.spend,
            cpm: acc.cpm + ad.cpm,
            cpp: acc.cpp + ad.cpp,
          }),
          { conversations: 0, reach: 0, impressions: 0, spend: 0, cpm: 0, cpp: 0 },
        )

        const length = mockAds.length || 1
        const normalized = {
          conversations: totals.conversations,
          reach: totals.reach,
          impressions: totals.impressions,
          spend: totals.spend,
          cpm: totals.cpm / length,
          cpp: totals.cpp / length,
        }

        setKpis(normalized)

        const days = dateRange === "today" ? 1 : dateRange === "7d" ? 7 : 28
        const generatedChart = Array.from({ length: days }, (_, i) => ({
          date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toLocaleDateString("es-MX", {
            month: "short",
            day: "numeric",
          }),
          conversations: Math.floor(Math.random() * 50) + 20,
          spend: Math.floor(Math.random() * 100) + 50,
        }))

        setChartData(generatedChart)
      } catch (error) {
        if (!cancelled) {
          console.error("[meta-ads] Failed to load dashboard data:", error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDashboardData()

    return () => {
      cancelled = true
    }
  }, [adAccountId, effectiveCompanyId, dateRange, companies])

  const handleStatusToggle = async (adId: string, currentStatus: "ACTIVE" | "PAUSED") => {
    try {
      if (!effectiveCompanyId) return
      const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE"
      await metaAdsApi.updateAdStatus(adId, effectiveCompanyId, nextStatus)
      setAds((prev) => prev.map((ad) => (ad.id === adId ? { ...ad, status: nextStatus } : ad)))
    } catch (error) {
      console.error("[meta-ads] Failed to update ad status:", error)
      alert("No fue posible actualizar el estado del anuncio.")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meta Ads - Administración</h1>
          <p className="mt-1 text-muted-foreground">Administra campañas, conjuntos y anuncios. Esta vista es independiente del wizard.</p>
        </div>
        <Button onClick={() => router.push("/meta/wizard?step=1")}>
          <Plus className="mr-2 h-4 w-4" />
          Crear campaña (wizard)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[280px,1fr]">
        {/* Sidebar de administración */}
        <Card className="p-4 space-y-4 h-fit">
          <div className="space-y-2">
            <p className="text-sm font-medium">Compañía</p>
            <Select
              value={effectiveCompanyId ? String(effectiveCompanyId) : undefined}
              onValueChange={(v) => setSelectedCompanyId(Number(v))}
              disabled={isLoadingCompanies}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingCompanies ? "Cargando..." : "Selecciona compañía"} />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleRefreshCampaigns} disabled={!effectiveCompanyId || isLoadingCampaigns}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refrescar
            </Button>
            <Button size="sm" onClick={handleSyncCampaigns} disabled={!effectiveCompanyId || isLoadingCampaigns}>
              <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar
            </Button>
          </div>

          <div className="pt-2 border-t text-xs text-muted-foreground">
            Acciones rápidas
            <ul className="mt-2 space-y-1 list-disc pl-4">
              <li>Listar campañas</li>
              <li>Cambiar estado</li>
              <li>Actualizar presupuesto</li>
            </ul>
          </div>
        </Card>

        {/* Contenido principal */}
        <div className="space-y-6">
          <Tabs defaultValue="overview">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="campaigns">Campañas</TabsTrigger>
                <TabsTrigger value="ads">Anuncios</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="7d">Últimos 7 días</SelectItem>
                    <SelectItem value="28d">Últimos 28 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Conversaciones</p>
                      <p className="mt-2 text-3xl font-bold">{kpis.conversations.toLocaleString()}</p>
                    </div>
                    <div className="rounded-full bg-primary/10 p-3">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Alcance</p>
                      <p className="mt-2 text-3xl font-bold">{kpis.reach.toLocaleString()}</p>
                    </div>
                    <div className="rounded-full bg-chart-2/10 p-3">
                      <Users className="h-6 w-6 text-chart-2" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Impresiones</p>
                      <p className="mt-2 text-3xl font-bold">{kpis.impressions.toLocaleString()}</p>
                    </div>
                    <div className="rounded-full bg-chart-3/10 p-3">
                      <Eye className="h-6 w-6 text-chart-3" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gasto</p>
                      <p className="mt-2 text-3xl font-bold">${kpis.spend.toFixed(2)}</p>
                    </div>
                    <div className="rounded-full bg-chart-4/10 p-3">
                      <DollarSign className="h-6 w-6 text-chart-4" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CPM</p>
                      <p className="mt-2 text-3xl font-bold">${kpis.cpm.toFixed(2)}</p>
                    </div>
                    <div className="rounded-full bg-muted p-3">
                      <DollarSign className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Costo por conversación</p>
                      <p className="mt-2 text-3xl font-bold">${kpis.cpp.toFixed(2)}</p>
                    </div>
                    <div className="rounded-full bg-muted p-3">
                      <TrendingUp className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Conversaciones vs gasto</h2>
                <ChartContainer
                  config={{
                    conversations: { label: "Conversaciones", color: "hsl(var(--chart-1))" },
                    spend: { label: "Gasto ($)", color: "hsl(var(--chart-4))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="conversations"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--chart-1))" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="spend"
                        stroke="hsl(var(--chart-4))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--chart-4))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </Card>
            </TabsContent>

            <TabsContent value="ads" className="space-y-6">
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold">Campañas activas</h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Presupuesto</TableHead>
                      <TableHead className="text-right">Conversaciones</TableHead>
                      <TableHead className="text-right">Alcance</TableHead>
                      <TableHead className="text-right">Gasto</TableHead>
                      <TableHead className="text-right">CPM</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ads.map((ad) => (
                      <TableRow key={ad.id}>
                        <TableCell className="font-medium">{ad.name}</TableCell>
                        <TableCell>
                          <Badge variant={ad.status === "ACTIVE" ? "default" : "secondary"}>{ad.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">${(ad.daily_budget / 100).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{ad.conversations}</TableCell>
                        <TableCell className="text-right">{ad.reach.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${ad.spend.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${ad.cpm.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusToggle(ad.id, ad.status)}
                              title={ad.status === "ACTIVE" ? "Pausar" : "Reanudar"}
                            >
                              {ad.status === "ACTIVE" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" title="Duplicar">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6">
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Campañas (Meta → Ad Sets → Ads)</h2>
                {isLoadingCampaigns ? (
                  <div className="flex min-h-[120px] items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : campaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay campañas para esta compañía.</p>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((c) => (
                      <div key={c.metaCampaignId} className="rounded-md border p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{c.name || c.metaCampaignId}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>ID: {c.metaCampaignId}</span>
                              {c.updatedAt ? <span>• Actualizada: {new Date(c.updatedAt).toLocaleString()}</span> : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>{c.status || "-"}</Badge>
                            <Button size="sm" variant="outline" onClick={() => handleToggleCampaignStatus(c.metaCampaignId, c.status)}>
                              {c.status === "ACTIVE" ? "Pausar" : "Activar"}
                            </Button>
                          </div>
                        </div>

                        {(c.adSets || []).map((s) => (
                          <div key={s.metaAdSetId} className="mt-4 rounded-md border p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{s.name || s.metaAdSetId}</p>
                                <div className="text-xs text-muted-foreground">ID: {s.metaAdSetId}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={s.status === "ACTIVE" ? "default" : "secondary"}>{s.status || "-"}</Badge>
                                <Button size="sm" variant="outline" onClick={() => handleToggleAdSetStatus(s.metaAdSetId, s.status)}>
                                  {s.status === "ACTIVE" ? "Pausar" : "Activar"}
                                </Button>
                              </div>
                            </div>

                            {(s.ads || []).map((a) => (
                              <div key={a.metaAdId} className="mt-3 grid items-center gap-2 sm:grid-cols-[1fr_auto_auto]">
                                <div>
                                  <p className="text-sm">{a.name || a.metaAdId}</p>
                                  <div className="text-xs text-muted-foreground">ID: {a.metaAdId}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={a.status === "ACTIVE" ? "default" : "secondary"}>{a.status || "-"}</Badge>
                                  <Button size="sm" variant="outline" onClick={() => handleToggleAdStatus(a.metaAdId, a.status)}>
                                    {a.status === "ACTIVE" ? "Pausar" : "Activar"}
                                  </Button>
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                  <Input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    placeholder="Presupuesto diario"
                                    className="w-40"
                                    onBlur={(e) => a.metaAdId && handleUpdateAdBudget(a.metaAdId, e.currentTarget.value)}
                                  />
                                  <Button size="sm" variant="secondary" onClick={(e) => {
                                    const input = (e.currentTarget.previousSibling as HTMLInputElement | null)
                                    if (input && a.metaAdId) handleUpdateAdBudget(a.metaAdId, input.value)
                                  }}>Actualizar presupuesto</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
