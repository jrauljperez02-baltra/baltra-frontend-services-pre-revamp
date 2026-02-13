"use client"

import { useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, ImageIcon, Plus, Target, Trash2, Edit } from "lucide-react"

interface CopyTemplate {
    id: string
    name: string
    position: string
    city: string
    title: string
    body: string
    description: string
}

interface TargetingPreset {
    id: string
    name: string
    ageMin: number
    ageMax: number
    gender: string
    countries: string[]
}

interface ImageAsset {
    id: string
    name: string
    url: string
    uploadDate: string
}

const defaultCopyForm = {
    name: "",
    position: "",
    city: "",
    title: "",
    body: "",
    description: "",
}

const defaultTargetingForm = {
    name: "",
    ageMin: "18",
    ageMax: "65",
    gender: "all",
    countries: [] as string[],
}

export function MetaAdsTemplates() {
    const [copyTemplates, setCopyTemplates] = useState<CopyTemplate[]>([
        {
            id: "1",
            name: "Software Engineer Template",
            position: "Software Engineer",
            city: "San Francisco",
            title: "Join Our Engineering Team",
            body: "We're looking for talented software engineers in San Francisco. Great benefits and competitive salary.",
            description: "Apply now",
        },
    ])

    const [targetingPresets, setTargetingPresets] = useState<TargetingPreset[]>([
        {
            id: "1",
            name: "Tech Professionals US",
            ageMin: 25,
            ageMax: 45,
            gender: "all",
            countries: ["US"],
        },
    ])

    const [imageAssets, setImageAssets] = useState<ImageAsset[]>([
        {
            id: "1",
            name: "Office Team Photo",
            url: "/placeholder.svg?height=200&width=300",
            uploadDate: new Date().toLocaleDateString(),
        },
    ])

    const [showCopyDialog, setShowCopyDialog] = useState(false)
    const [showTargetingDialog, setShowTargetingDialog] = useState(false)
    const [editingCopy, setEditingCopy] = useState<CopyTemplate | null>(null)
    const [editingTargeting, setEditingTargeting] = useState<TargetingPreset | null>(null)
    const [copyForm, setCopyForm] = useState(defaultCopyForm)
    const [targetingForm, setTargetingForm] = useState(defaultTargetingForm)

    const handleSaveCopyTemplate = () => {
        if (!copyForm.name || !copyForm.position || !copyForm.city) {
            alert("Please fill in all required fields")
            return
        }

        if (editingCopy) {
            setCopyTemplates((prev) =>
                prev.map((template) => (template.id === editingCopy.id ? { ...template, ...copyForm } : template)),
            )
        } else {
            setCopyTemplates((prev) => [...prev, { id: Date.now().toString(), ...copyForm }])
        }

        setShowCopyDialog(false)
        setEditingCopy(null)
        setCopyForm(defaultCopyForm)
    }

    const handleSaveTargetingPreset = () => {
        if (!targetingForm.name || targetingForm.countries.length === 0) {
            alert("Please fill in all required fields")
            return
        }

        const normalizedPreset: TargetingPreset = {
            id: editingTargeting?.id ?? Date.now().toString(),
            name: targetingForm.name,
            ageMin: Number.parseInt(targetingForm.ageMin, 10),
            ageMax: Number.parseInt(targetingForm.ageMax, 10),
            gender: targetingForm.gender,
            countries: targetingForm.countries,
        }

        if (editingTargeting) {
            setTargetingPresets((prev) => prev.map((preset) => (preset.id === editingTargeting.id ? normalizedPreset : preset)))
        } else {
            setTargetingPresets((prev) => [...prev, normalizedPreset])
        }

        setShowTargetingDialog(false)
        setEditingTargeting(null)
        setTargetingForm(defaultTargetingForm)
    }

    const handleEditCopy = (template: CopyTemplate) => {
        setEditingCopy(template)
        setCopyForm({
            name: template.name,
            position: template.position,
            city: template.city,
            title: template.title,
            body: template.body,
            description: template.description,
        })
        setShowCopyDialog(true)
    }

    const handleEditTargeting = (preset: TargetingPreset) => {
        setEditingTargeting(preset)
        setTargetingForm({
            name: preset.name,
            ageMin: preset.ageMin.toString(),
            ageMax: preset.ageMax.toString(),
            gender: preset.gender,
            countries: preset.countries,
        })
        setShowTargetingDialog(true)
    }

    const handleDeleteCopy = (id: string) => {
        if (confirm("Are you sure you want to delete this template?")) {
            setCopyTemplates((prev) => prev.filter((template) => template.id !== id))
        }
    }

    const handleDeleteTargeting = (id: string) => {
        if (confirm("Are you sure you want to delete this preset?")) {
            setTargetingPresets((prev) => prev.filter((preset) => preset.id !== id))
        }
    }

    const handleDeleteImage = (id: string) => {
        if (confirm("Are you sure you want to delete this image?")) {
            setImageAssets((prev) => prev.filter((image) => image.id !== id))
        }
    }

    const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) {
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setImageAssets((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    name: file.name,
                    url: reader.result as string,
                    uploadDate: new Date().toLocaleDateString(),
                },
            ])
        }
        reader.readAsDataURL(file)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Templates & Assets</h1>
                <p className="mt-1 text-muted-foreground">Manage reusable templates, targeting presets, and image library</p>
            </div>

            <Tabs defaultValue="copy" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="copy" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Copy Templates
                    </TabsTrigger>
                    <TabsTrigger value="targeting" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Targeting Presets
                    </TabsTrigger>
                    <TabsTrigger value="images" className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Image Library
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="copy" className="space-y-4">
                    <div className="flex justify-end">
                        <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={() => {
                                        setEditingCopy(null)
                                        setCopyForm(defaultCopyForm)
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Copy Template
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>{editingCopy ? "Edit" : "Create"} Copy Template</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="template-name">Template Name</Label>
                                            <Input
                                                id="template-name"
                                                value={copyForm.name}
                                                onChange={(event) => setCopyForm({ ...copyForm, name: event.target.value })}
                                                placeholder="e.g., Software Engineer Template"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="position">Position</Label>
                                            <Input
                                                id="position"
                                                value={copyForm.position}
                                                onChange={(event) => setCopyForm({ ...copyForm, position: event.target.value })}
                                                placeholder="e.g., Software Engineer"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={copyForm.city}
                                            onChange={(event) => setCopyForm({ ...copyForm, city: event.target.value })}
                                            placeholder="e.g., San Francisco"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Ad Title</Label>
                                        <Input
                                            id="title"
                                            value={copyForm.title}
                                            onChange={(event) => setCopyForm({ ...copyForm, title: event.target.value })}
                                            placeholder="e.g., Join Our Engineering Team"
                                            maxLength={40}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="body">Ad Body</Label>
                                        <Textarea
                                            id="body"
                                            value={copyForm.body}
                                            onChange={(event) => setCopyForm({ ...copyForm, body: event.target.value })}
                                            placeholder="Main ad copy..."
                                            rows={4}
                                            maxLength={125}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Input
                                            id="description"
                                            value={copyForm.description}
                                            onChange={(event) => setCopyForm({ ...copyForm, description: event.target.value })}
                                            placeholder="e.g., Apply now"
                                            maxLength={30}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setShowCopyDialog(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleSaveCopyTemplate}>Save Template</Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Template Name</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>City</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {copyTemplates.map((template) => (
                                    <TableRow key={template.id}>
                                        <TableCell className="font-medium">{template.name}</TableCell>
                                        <TableCell>{template.position}</TableCell>
                                        <TableCell>{template.city}</TableCell>
                                        <TableCell>{template.title}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleEditCopy(template)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteCopy(template.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="targeting" className="space-y-4">
                    <div className="flex justify-end">
                        <Dialog open={showTargetingDialog} onOpenChange={setShowTargetingDialog}>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={() => {
                                        setEditingTargeting(null)
                                        setTargetingForm(defaultTargetingForm)
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Targeting Preset
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingTargeting ? "Edit" : "Create"} Targeting Preset</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="preset-name">Preset Name</Label>
                                        <Input
                                            id="preset-name"
                                            value={targetingForm.name}
                                            onChange={(event) => setTargetingForm({ ...targetingForm, name: event.target.value })}
                                            placeholder="e.g., Tech Professionals US"
                                        />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="age-min">Min Age</Label>
                                            <Input
                                                id="age-min"
                                                type="number"
                                                value={targetingForm.ageMin}
                                                onChange={(event) => setTargetingForm({ ...targetingForm, ageMin: event.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="age-max">Max Age</Label>
                                            <Input
                                                id="age-max"
                                                type="number"
                                                value={targetingForm.ageMax}
                                                onChange={(event) => setTargetingForm({ ...targetingForm, ageMax: event.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Countries (comma-separated)</Label>
                                        <Input
                                            value={targetingForm.countries.join(", ")}
                                            onChange={(event) =>
                                                setTargetingForm({
                                                    ...targetingForm,
                                                    countries: event.target.value.split(",").map((country) => country.trim()),
                                                })
                                            }
                                            placeholder="e.g., US, MX, CA"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setShowTargetingDialog(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleSaveTargetingPreset}>Save Preset</Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Preset Name</TableHead>
                                    <TableHead>Age Range</TableHead>
                                    <TableHead>Countries</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {targetingPresets.map((preset) => (
                                    <TableRow key={preset.id}>
                                        <TableCell className="font-medium">{preset.name}</TableCell>
                                        <TableCell>
                                            {preset.ageMin} - {preset.ageMax}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {preset.countries.map((country) => (
                                                    <Badge key={country} variant="secondary">
                                                        {country}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleEditTargeting(preset)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteTargeting(preset.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="images" className="space-y-4">
                    <div className="flex justify-end">
                        <Button asChild>
                            <label className="cursor-pointer">
                                <Plus className="mr-2 h-4 w-4" />
                                Upload Image
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                        </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {imageAssets.map((image) => (
                            <Card key={image.id} className="overflow-hidden">
                                <div className="aspect-video overflow-hidden bg-muted">
                                    <img src={image.url || "/placeholder.svg"} alt={image.name} className="h-full w-full object-cover" />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-medium">{image.name}</h3>
                                    <p className="mt-1 text-xs text-muted-foreground">Uploaded {image.uploadDate}</p>
                                    <div className="mt-3 flex justify-end">
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteImage(image.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
