"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Building2, MapPin, Users, TrendingUp, ExternalLink } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { useCompanyID } from "@/context/CompanyContext"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchStores, toggleStoreActive, type StoreItem } from "@/lib/admin-api"
import type { UserAttributes } from "@/lib/user-attributes";

function parseSelectedCompanyId(selected: string, fallbackCompanyId: number): number {
  if (!selected || selected === "all") return fallbackCompanyId;
  const m = selected.match(/(\d+)/);
  return m ? Number(m[1]) : fallbackCompanyId;
}

function formatDateTimeToDateHourMinutes(value?: string): string {
  if (!value) return "";
  const s = value.trim();
  if (!s) return "";
  // Normalize separator by replacing 'T' (or 't') with space
  let cleaned = s.replace('T', ' ').replace('t', ' ');
  // Trim timezone designators: 'Z' or offsets like +05:00 / -03:00
  const zIndex = cleaned.indexOf('Z');
  if (zIndex !== -1) cleaned = cleaned.slice(0, zIndex);
  const plusIdx = cleaned.indexOf('+');
  const minusIdx = cleaned.indexOf('-', 11); // look for minus after date part
  const cutIdx = plusIdx !== -1 ? plusIdx : (minusIdx !== -1 ? minusIdx : -1);
  if (cutIdx !== -1) cleaned = cleaned.slice(0, cutIdx);
  cleaned = cleaned.trim();
  // Expect formats like YYYY-MM-DD HH:MM:SS(.sss)?
  const m1 = cleaned.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
  if (m1) return `${m1[1]} ${m1[2]}`;
  // If only date is available
  const m2 = cleaned.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (m2) return m2[1];
  // As a fallback, try to construct Date and format minimal
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }
  return cleaned;
}

export function AdminStoreNavigation({ selectedStore, dateRange, attrs, onSelectStore }: { selectedStore: string; dateRange?: { startDate: string; endDate: string }; attrs: UserAttributes; onSelectStore: (value: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500)
    return () => clearTimeout(t)
  }, [searchTerm])
  const baseCompanyId = useCompanyID()
  const companyId = useMemo(() => parseSelectedCompanyId(selectedStore, baseCompanyId), [selectedStore, baseCompanyId])
  const selectedId = useMemo(() => {
    const m = selectedStore?.match(/(\d+)/)
    return m ? Number(m[1]) : null
  }, [selectedStore])
  const queryClient = useQueryClient()

  const { data: storesData } = useQuery({
    queryKey: ["admin-stores", companyId, debouncedSearchTerm, dateRange?.startDate, dateRange?.endDate, attrs?.companiesIds],
    queryFn: async () => fetchStores(
      companyId,
      debouncedSearchTerm.length ? debouncedSearchTerm : undefined,
      "all",
      dateRange ? { start_date: dateRange.startDate, end_date: dateRange.endDate, company_ids: attrs?.companiesIds ?? [] } : { company_ids: attrs?.companiesIds ?? [] }
    ),
    enabled: !!attrs,
    keepPreviousData: true,
  })

  const stores: (StoreItem & { activeRecruitment?: number; conversionRate?: number; last_login_user?: { email?: string; last_login?: string } })[] = useMemo(() => {
    return (storesData ?? []).map((s) => {
      const sid = (s as any)?.id ?? (s as any)?.store_id ?? (s as any)?.business_unit_id;
      const sname = (s as any)?.name ?? (s as any)?.store_name ?? `Tienda ${sid ?? ''}`.trim();
      return {
        id: sid,
        name: sname,
        location: (s as any)?.location,
        hires: (s as any)?.hires,
        activeRecruitment: (s as any)?.active_recruitment,
        conversionRate: (s as any)?.conversion_rate,
        isActive: (s as any)?.is_active ?? true,
        last_login_user: (s as any)?.last_login_user,
      };
    })
  }, [storesData])

  const filteredStores = stores
    .filter((store) => {
      const allowList = attrs?.companiesIds;
      if (Array.isArray(allowList) && allowList.length > 0) {
        const idNum = Number((store as any)?.id);
        if (!Number.isFinite(idNum) || !allowList.includes(idNum)) return false;
      }
      return true;
    })
    .filter(
      (store) =>
        (store.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (store.location || "").toLowerCase().includes(searchTerm.toLowerCase()),
    )

  const toggleStoreStatus = async (storeId: string | number, current: boolean) => {
    try {
      await toggleStoreActive(companyId, storeId, !current)
      await queryClient.invalidateQueries({ queryKey: ["admin-stores", companyId] })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Navegación de Tiendas</CardTitle>
          <CardDescription>Accede a los dashboards individuales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Buscar tienda por nombre o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredStores.length} de {stores.length} tiendas
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.map((store, idx) => {
          const id = store?.id as any;
          // Ensure unique and stable React keys even when names repeat or id is missing
          const key = id != null ? `store-${String(id)}` : `store-fallback-${idx}-${store?.name ?? 'unknown'}`;
          const isSelected = id != null && selectedId === Number(id);
          const handleClick = () => { if (id != null) onSelectStore(`store-${String(id)}`); };
          const lastLoginUser = (store as any)?.last_login_user as { email?: string; last_login?: string } | undefined;
          const email = (lastLoginUser?.email ?? '').trim();
          const rawDatetime = (lastLoginUser?.last_login ?? '').trim();
          const datetime = formatDateTimeToDateHourMinutes(rawDatetime);
          const hasAny = !!(email || datetime);
          return (
          <Card
            key={key}
            className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''} ${id == null ? 'opacity-90' : ''}`}
            onClick={handleClick}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: '#dbeafe' }}>
                    <Building2 className="h-5 w-5" style={{ color: '#1e40af' }} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{store.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {store.location}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <span className="text-sm text-muted-foreground">{store.isActive ? "Activa" : "Inactiva"}</span>
                  <Switch disabled={id == null} checked={!!store.isActive} onCheckedChange={() => id != null && toggleStoreStatus(id, !!store.isActive)} />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <div className="text-lg font-bold">{store.hires ?? '-'}</div>
                  <div className="text-xs text-muted-foreground">Contratados</div>
                </div>

                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <div className="text-lg font-bold">{store.conversionRate ?? '-'}%</div>
                  <div className="text-xs text-muted-foreground">Conversión Evaluados a Ingresados</div>
                </div>
              </div>

              {/* Último usuario en iniciar sesión */}
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Último acceso de usuario</div>
                <div className="rounded-md border bg-muted/40 px-3 py-2">
                  {hasAny ? (
                    <>
                      <div className="text-sm font-medium truncate">{email || "—"}</div>
                      <div className="text-xs text-muted-foreground">{datetime || "—"}</div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Sin datos de último acceso</div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <Button
                className="w-full"
                style={{ backgroundColor: '#1e40af', borderColor: '#1e40af' }}
                disabled={id == null}
                onClick={(e) => {
                  e.stopPropagation()
                  if (id != null) onSelectStore(`store-${String(id)}`)
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Dashboard
              </Button>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Show more stores indicator */}
      {/*{stores.length < 33 && (*/}
      {/*  <Card>*/}
      {/*    <CardContent className="text-center py-8">*/}
      {/*      <div className="text-muted-foreground">*/}
      {/*        Mostrando {stores.length} de 33 tiendas.*/}
      {/*        <Button variant="link" className="ml-2">*/}
      {/*          Cargar más tiendas*/}
      {/*        </Button>*/}
      {/*      </div>*/}
      {/*    </CardContent>*/}
      {/*  </Card>*/}
      {/*)}*/}
    </div>
  )
}
