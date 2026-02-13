import Link from "next/link"
import { ArrowRight, Layers, LayoutDashboard, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MetaLandingPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase text-primary">
              <Sparkles className="h-3 w-3" /> Meta Ads Wizard
            </span>
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
              Crea campañas de Meta Ads de extremo a extremo en minutos
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Vincula tus activos, personaliza la campaña, define la segmentación y publica todo con una sola llamada al
              endpoint <code>/api/v1/meta/full-campaign</code>. Este laboratorio reúne el wizard, templates y dashboard
              para que pruebes el flujo completo.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/meta/wizard?step=1">
                  Iniciar wizard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/docs/frontend_ads_wizard_api.md" target="_blank">
                  Ver documentación API
                </Link>
              </Button>
            </div>
          </div>
          <div className="hidden h-full min-w-[220px] rounded-xl border bg-background p-6 shadow-sm lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Flujo recomendado</p>
              <ul className="mt-2 space-y-2 text-sm">
                <li>1. Vincula activos de Meta</li>
                <li>2. Aplica plantillas opcionales por rol</li>
                <li>3. Ajusta targeting y creatividades</li>
                <li>4. Envía todo al endpoint <code>full-campaign</code></li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: Usa el environment de pruebas de Meta para validar los recursos antes de publicar en producción.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Wizard de campañas</CardTitle>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Experiencia guiada de cinco pasos para recolectar los datos mínimos y construir el payload que consume el
              backend.
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>Validaciones en vivo y precarga mediante blueprints de rol</li>
              <li>Sincronización del paso actual vía querystring (`?step=`)</li>
              <li>Listo para extender con más pasos o validaciones empresariales</li>
            </ul>
            <Button asChild variant="outline">
              <Link href="/meta/wizard?step=1">Abrir wizard</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Dashboard y plantillas</CardTitle>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <LayoutDashboard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Visualiza métricas, administra anuncios y conserva presets de targeting o copy que puedes reutilizar en el
              wizard.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/meta/dashboard">Ir al dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/meta/templates">Ver plantillas</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">API de Meta Ads Wizard</CardTitle>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Todos los pasos del wizard envían datos al backend descrito en `docs/frontend_ads_wizard_api.md`.</p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                GET <code>/meta/business/client-ad-accounts</code> y{" "}
                <code>/meta/business/owned-ad-accounts</code> para descubrir activos
              </li>
              <li>
                POST <code>/companies/{`{`}business_unit_id{`}`}/link-ad-account</code> para persistir la vinculación
              </li>
              <li>
                POST <code>/meta/full-campaign</code> para publicar campaña, ad set, creativo y anuncio en una llamada
              </li>
            </ul>
            <p>
              Ajusta la capa de <code>metaAdsApi</code> si cambian las rutas del backend o necesitas headers adicionales.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
