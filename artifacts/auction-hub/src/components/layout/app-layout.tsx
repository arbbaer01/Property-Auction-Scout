import * as React from "react"
import { Sidebar } from "./sidebar"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sidebar-accent/20 via-background to-background z-0" />
        <div className="relative z-10 p-6 min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
