"use client"

import { useState, useEffect, useMemo } from "react"
import { fetchLambdaHealth, type LambdaHealthStatus } from "@/lib/admin-api"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { AlertCircle, CheckCircle2, RefreshCw, Clock, Server, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LambdaHealthPage() {
    const [data, setData] = useState<LambdaHealthStatus[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [window, setWindow] = useState<string>("5m")
    const [selectedFunctions, setSelectedFunctions] = useState<string[]>([])
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
    const [openErrors, setOpenErrors] = useState<Set<string>>(new Set())

    // Get unique function names from data
    const availableFunctions = useMemo(() => {
        return Array.from(new Set(data.map((item) => item.function))).sort()
    }, [data])

    const loadData = async () => {
        setLoading(true)
        setError(null)
        try {
            const params: { window?: string; functions?: string } = { window }
            if (selectedFunctions.length > 0) {
                params.functions = selectedFunctions.join(",")
            }
            const result = await fetchLambdaHealth(params)
            setData(result)
            setLastRefresh(new Date())
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load Lambda health data")
            console.error("Error loading Lambda health:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [window, selectedFunctions.join(",")])

    const filteredData = useMemo(() => {
        if (selectedFunctions.length === 0) return data
        return data.filter((item) => selectedFunctions.includes(item.function))
    }, [data, selectedFunctions])

    const stats = useMemo(() => {
        const total = filteredData.length
        const healthy = filteredData.filter((item) => item.status === "healthy").length
        const unhealthy = filteredData.filter((item) => item.status === "unhealthy").length
        const error = filteredData.filter((item) => item.status === "error").length
        const totalErrors = filteredData.reduce((sum, item) => sum + item.errorCount, 0)

        return { total, healthy, unhealthy, error, totalErrors }
    }, [filteredData])

    const toggleFunction = (functionName: string) => {
        setSelectedFunctions((prev) =>
            prev.includes(functionName)
                ? prev.filter((f) => f !== functionName)
                : [...prev, functionName]
        )
    }

    const toggleErrorSection = (functionName: string) => {
        setOpenErrors((prev) => {
            const next = new Set(prev)
            if (next.has(functionName)) {
                next.delete(functionName)
            } else {
                next.add(functionName)
            }
            return next
        })
    }

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-baltra-900">Lambda Health</h1>
                    <p className="text-sm text-baltra-600 mt-1">
                        CloudWatch logs monitor
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lastRefresh && (
                        <span className="text-xs text-baltra-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lastRefresh.toLocaleTimeString()}
                        </span>
                    )}
                    <Button
                        onClick={loadData}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="gap-2 border-baltra-300 text-baltra-700 hover:bg-baltra-50"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats - Minimalist */}
            <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-baltra-50/50 border border-baltra-200">
                    <Server className="h-5 w-5 text-baltra-600" />
                    <div>
                        <div className="text-xs text-baltra-600">Total</div>
                        <div className="text-lg font-semibold text-baltra-900">{stats.total}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-baltra-50/50 border border-baltra-200">
                    <CheckCircle2 className="h-5 w-5 text-baltra-500" />
                    <div>
                        <div className="text-xs text-baltra-600">Healthy</div>
                        <div className="text-lg font-semibold text-baltra-700">{stats.healthy}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-baltra-50/50 border border-baltra-200">
                    <AlertCircle className="h-5 w-5 text-baltra-600" />
                    <div>
                        <div className="text-xs text-baltra-600">Unhealthy</div>
                        <div className="text-lg font-semibold text-baltra-700">{stats.unhealthy}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-baltra-50/50 border border-baltra-200">
                    <AlertCircle className="h-5 w-5 text-baltra-600" />
                    <div>
                        <div className="text-xs text-baltra-600">Errors</div>
                        <div className="text-lg font-semibold text-baltra-700">{stats.totalErrors}</div>
                    </div>
                </div>
            </div>

            {/* Filters - Minimalist */}
            <div className="flex items-center gap-4 pb-4 border-b border-baltra-200">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-baltra-700">Window:</label>
                    <Select value={window} onValueChange={setWindow}>
                        <SelectTrigger className="w-32 h-8 border-baltra-300">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5m">5m</SelectItem>
                            <SelectItem value="15m">15m</SelectItem>
                            <SelectItem value="30m">30m</SelectItem>
                            <SelectItem value="1h">1h</SelectItem>
                            <SelectItem value="3h">3h</SelectItem>
                            <SelectItem value="6h">6h</SelectItem>
                            <SelectItem value="12h">12h</SelectItem>
                            <SelectItem value="24h">24h</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2 flex-1">
                    <label className="text-sm text-baltra-700">Functions:</label>
                    <div className="flex flex-wrap gap-1.5">
                        {availableFunctions.length > 0 ? (
                            availableFunctions.map((func) => (
                                <Badge
                                    key={func}
                                    variant={selectedFunctions.includes(func) ? "default" : "outline"}
                                    className={cn(
                                        "cursor-pointer text-xs h-6 px-2",
                                        selectedFunctions.includes(func)
                                            ? "bg-baltra-500 text-white border-baltra-500 hover:bg-baltra-600"
                                            : "border-baltra-300 text-baltra-700 hover:bg-baltra-50"
                                    )}
                                    onClick={() => toggleFunction(func)}
                                >
                                    {func.replace("production-baltra-", "")}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-xs text-baltra-500">No functions</span>
                        )}
                    </div>
                    {selectedFunctions.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFunctions([])}
                            className="h-6 px-2 text-xs text-baltra-600 hover:text-baltra-700"
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-baltra-500" />
                </div>
            )}

            {/* Functions List - Minimalist */}
            {!loading && filteredData.length > 0 && (
                <div className="space-y-2">
                    {filteredData.map((item) => {
                        const hasErrors = item.recentErrors && item.recentErrors.length > 0
                        const isOpen = openErrors.has(item.function)
                        
                        return (
                            <div
                                key={item.function}
                                className={cn(
                                    "rounded-lg border transition-colors",
                                    item.status === "healthy"
                                        ? "border-baltra-200 bg-white"
                                        : "border-baltra-300 bg-baltra-50/30"
                                )}
                            >
                                <Collapsible open={isOpen} onOpenChange={() => toggleErrorSection(item.function)}>
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {item.status === "healthy" ? (
                                                <CheckCircle2 className="h-5 w-5 text-baltra-500 flex-shrink-0" />
                                            ) : (
                                                <AlertCircle className="h-5 w-5 text-baltra-600 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-baltra-900 truncate">
                                                    {item.function.replace("production-baltra-", "")}
                                                </div>
                                                <div className="text-xs text-baltra-600 mt-0.5 font-mono truncate">
                                                    {item.function}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={cn(
                                                    "text-xs",
                                                    item.status === "healthy"
                                                        ? "bg-baltra-500 text-white"
                                                        : "bg-baltra-600 text-white"
                                                )}
                                            >
                                                {item.status}
                                            </Badge>
                                            {item.errorCount > 0 && (
                                                <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                                                    {item.errorCount}
                                                </Badge>
                                            )}
                                            {hasErrors && (
                                                <CollapsibleTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-baltra-600 hover:text-baltra-700 hover:bg-baltra-100"
                                                    >
                                                        {isOpen ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </CollapsibleTrigger>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {hasErrors && (
                                        <CollapsibleContent>
                                            <div className="px-4 pb-4 space-y-2 border-t border-baltra-200 pt-3">
                                                <div className="text-xs font-medium text-baltra-700 mb-2">
                                                    Errors ({item.recentErrors.length} of {item.errorCount})
                                                </div>
                                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                                    {item.recentErrors.map((error, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="rounded border border-red-200 bg-red-50/50 p-3"
                                                        >
                                                            <div className="space-y-2 text-xs">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-baltra-600 font-medium mb-1">Timestamp</div>
                                                                        <div className="font-mono text-baltra-900">{error.timestamp}</div>
                                                                    </div>
                                                                    {error.logStream && (
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="text-baltra-600 font-medium mb-1">Log Stream</div>
                                                                            <div className="font-mono text-baltra-900 truncate" title={error.logStream}>
                                                                                {error.logStream}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="text-baltra-600 font-medium mb-1">Message</div>
                                                                    <div className="font-mono p-2 bg-white rounded border border-baltra-200 text-baltra-900 break-all whitespace-pre-wrap text-xs">
                                                                        {error.message}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    )}
                                </Collapsible>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredData.length === 0 && !error && (
                <div className="py-12 text-center">
                    <p className="text-baltra-500">No Lambda functions found</p>
                </div>
            )}
        </div>
    )
}

