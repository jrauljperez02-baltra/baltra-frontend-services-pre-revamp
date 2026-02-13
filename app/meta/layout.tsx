"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { fetchUserAttributesSafe, isUserSuperadmin } from "@/lib/user-attributes"

export default function MetaLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const attrs = await fetchUserAttributesSafe()
        if (cancelled) return
        if (isUserSuperadmin(attrs)) {
          setAllowed(true)
        } else {
          setAllowed(false)
          // send them away
          router.replace("/")
        }
      } catch {
        if (!cancelled) {
          setAllowed(false)
          router.replace("/")
        }
      }
    }
    void check()
    return () => {
      cancelled = true
    }
  }, [router])

  if (allowed === null) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-muted-foreground">
        Verificando permisos...
      </div>
    )
  }

  if (!allowed) {
    // We already navigated away; keep a tiny placeholder to avoid flashing content
    return null
  }

  return <>{children}</>
}
