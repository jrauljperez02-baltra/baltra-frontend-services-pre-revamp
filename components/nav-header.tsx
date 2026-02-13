'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export function NavHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">v0</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/ads/dashboard">Dashboard</Link>
            <Link href="/ads/templates">Templates</Link>
          </nav>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <div className="grid gap-4 py-6">
              <Link href="/" className="flex items-center space-x-2">
                <span className="font-bold">v0</span>
              </Link>
              <Link href="/ads/dashboard">Dashboard</Link>
              <Link href="/ads/templates">Templates</Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}