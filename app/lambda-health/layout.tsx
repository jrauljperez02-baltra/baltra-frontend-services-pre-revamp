"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"

const PASSWORD = "#Baltra159#"
const STORAGE_KEY = "lambda-health-auth"

export default function LambdaHealthLayout({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    // Check if already authenticated in sessionStorage
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored === "true") {
      setAuthenticated(true)
    } else {
      setAuthenticated(false)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (password === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "true")
      setAuthenticated(true)
    } else {
      setError("Incorrect password. Please try again.")
      setPassword("")
    }
  }

  if (authenticated === null) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Lambda Health Monitor</CardTitle>
            <CardDescription>
              Enter the password to access the Lambda health dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError("")
                  }}
                  placeholder="Enter password"
                  autoFocus
                  className={error ? "border-red-500" : ""}
                />
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Access Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

