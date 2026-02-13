"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, Plus, X } from "lucide-react"
import type { CreativeSettings, CreativeVariant } from "../types"

interface WizardStep4Props {
  value?: CreativeSettings
  onChange: (value: CreativeSettings) => void
  disabled?: boolean
}

const MAX_VARIANTS = 5

const CTA_OPTIONS = [
  { value: "WHATSAPP_MESSAGE", label: "Enviar mensaje de WhatsApp" },
  { value: "LEARN_MORE", label: "Más información" },
  { value: "SIGN_UP", label: "Regístrate" },
]

function createEmptyVariant(): CreativeVariant {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    primaryText: "",
    title: "",
    description: "",
  }
}

export function WizardStep4({ value, onChange, disabled }: WizardStep4Props) {
  const [imageUrl, setImageUrl] = useState(value?.imageUrl ?? "")
  const [imageBase64, setImageBase64] = useState<string | undefined>(value?.imageBase64)
  const [callToAction, setCallToAction] = useState(value?.callToAction ?? CTA_OPTIONS[0].value)
  const [variants, setVariants] = useState<CreativeVariant[]>(value?.variants ?? [createEmptyVariant()])

  useEffect(() => {
    if (!value) return
    setImageUrl(value.imageUrl)
    setImageBase64(value.imageBase64)
    setCallToAction(value.callToAction ?? CTA_OPTIONS[0].value)
    setVariants(value.variants.length > 0 ? value.variants : [createEmptyVariant()])
  }, [value])

  const previewVariant = useMemo(() => variants[0], [variants])

  useEffect(() => {
    if (variants.length === 0) {
      setVariants([createEmptyVariant()])
      return
    }

    onChange({
      imageUrl,
      imageBase64,
      callToAction,
      variants,
    })
  }, [imageUrl, imageBase64, callToAction, variants, onChange])

  const handleVariantChange = (id: string, patch: Partial<CreativeVariant>) => {
    setVariants((prev) => prev.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)))
  }

  const handleAddVariant = () => {
    if (variants.length >= MAX_VARIANTS) return
    setVariants((prev) => [...prev, createEmptyVariant()])
  }

  const handleRemoveVariant = (id: string) => {
    if (variants.length === 1) return
    setVariants((prev) => prev.filter((variant) => variant.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Creatividades</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define la imagen principal y hasta {MAX_VARIANTS} variantes de copy para probar diferentes mensajes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <Card className="p-4">
          <h3 className="text-sm font-semibold">Previsualización</h3>
          <div className="mt-4 space-y-4 rounded-lg border bg-background p-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 flex-shrink-0 rounded-full bg-muted" />
              <div>
                <p className="text-xs font-semibold">Tu página</p>
                <p className="text-xs text-muted-foreground">Patrocinado</p>
              </div>
            </div>
            {imageBase64 || imageUrl ? (
              <img src={imageBase64 || imageUrl} alt="Vista previa" className="h-40 w-full rounded object-cover" />
            ) : (
              <div className="flex h-40 w-full items-center justify-center rounded bg-muted">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{previewVariant?.title || "Título del anuncio"}</p>
              <p className="text-xs text-muted-foreground">
                {previewVariant?.primaryText || "El copy principal aparecerá aquí."}
              </p>
              <p className="text-xs text-muted-foreground">
                {previewVariant?.description || "Agrega una descripción corta."}
              </p>
              <Button size="sm" variant="secondary" className="mt-2 w-full" disabled>
                {CTA_OPTIONS.find((cta) => cta.value === callToAction)?.label ?? "Enviar mensaje"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Imagen principal</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="image-file" className="text-xs">Subir imagen (recomendado)</Label>
                  <Input
                    id="image-file"
                    type="file"
                    accept="image/*"
                    disabled={disabled}
                    onChange={async (e) => {
                      const inputEl = e.target as HTMLInputElement | null
                      const file = inputEl?.files?.[0]
                      if (!file) return
                      const toBase64 = (file: File) =>
                        new Promise<string>((resolve, reject) => {
                          const reader = new FileReader()
                          reader.onload = () => resolve(String(reader.result))
                          reader.onerror = reject
                          reader.readAsDataURL(file)
                        })
                      try {
                        const dataUrl = await toBase64(file)
                        setImageBase64(dataUrl)
                        // opcional: limpiar URL para evitar confusión
                        setImageUrl("")
                      } catch (err) {
                        console.error("Error leyendo imagen", err)
                      } finally {
                        // reset input to allow same file re-selection
                        if (inputEl) inputEl.value = ""
                      }
                    }}
                  />
                  {imageBase64 ? (
                    <Button variant="ghost" size="sm" type="button" onClick={() => setImageBase64(undefined)} disabled={disabled}>
                      Quitar imagen subida
                    </Button>
                  ) : null}
                  <p className="text-xs text-muted-foreground">Puedes subir JPG o PNG. Se enviará como base64 al backend.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-url" className="text-xs">O usar URL de imagen</Label>
                  <Input
                    id="image-url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(event) => {
                      setImageUrl(event.target.value)
                      // si el usuario escribe una URL, descartamos la imagen subida para que prevalezca la URL
                      if (event.target.value) setImageBase64(undefined)
                    }}
                    disabled={disabled}
                  />
                  {imageUrl ? (
                    <Button variant="ghost" size="sm" type="button" onClick={() => setImageUrl("")} disabled={disabled}>
                      Limpiar URL
                    </Button>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Usa una URL pública accesible por Meta. Puedes alojarla en S3, Vercel Blob o tu CDN.
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Nota: Si subes una imagen, se usará esa en lugar de la URL.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta">Llamado a la acción</Label>
            <Select value={callToAction} onValueChange={setCallToAction} disabled={disabled}>
              <SelectTrigger id="cta">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CTA_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <Card key={variant.id} className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Variante {index + 1}</h4>
                  {variants.length > 1 ? (
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveVariant(variant.id)} disabled={disabled}>
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`title-${variant.id}`}>Título</Label>
                    <Input
                      id={`title-${variant.id}`}
                      placeholder="Ej. Únete a nuestro equipo"
                      value={variant.title}
                      onChange={(event) => handleVariantChange(variant.id, { title: event.target.value })}
                      maxLength={40}
                      disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">{variant.title.length}/40 caracteres</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`primaryText-${variant.id}`}>Texto principal</Label>
                    <Textarea
                      id={`primaryText-${variant.id}`}
                      placeholder="Comparte los beneficios y la propuesta de valor."
                      value={variant.primaryText}
                      onChange={(event) => handleVariantChange(variant.id, { primaryText: event.target.value })}
                      rows={4}
                      maxLength={125}
                      disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">{variant.primaryText.length}/125 caracteres</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`description-${variant.id}`}>Descripción</Label>
                    <Textarea
                      id={`description-${variant.id}`}
                      placeholder="Ej. Contratación inmediata, prestaciones superiores."
                      value={variant.description}
                      onChange={(event) => handleVariantChange(variant.id, { description: event.target.value })}
                      rows={2}
                      maxLength={60}
                      disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">{variant.description.length}/60 caracteres</p>
                  </div>
                </div>
              </Card>
            ))}

            {variants.length < MAX_VARIANTS ? (
              <Button type="button" variant="outline" className="w-full" onClick={handleAddVariant} disabled={disabled}>
                <Plus className="mr-2 h-4 w-4" /> Añadir variante ({variants.length}/{MAX_VARIANTS})
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
