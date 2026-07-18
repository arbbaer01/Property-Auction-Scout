import * as React from "react"
import { Link, useLocation } from "wouter"
import { 
  BarChart, 
  Search, 
  Map, 
  DollarSign, 
  FileSpreadsheet, 
  Settings, 
  Activity,
  LogOut,
  TerminalSquare
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStatus, useLogoutHandler } from "@/hooks/use-auth"
import { useGetSpiderStatus } from "@workspace/api-client-react"

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: BarChart },
  { name: "Auction Search", href: "/auctions", icon: Search },
  { name: "Properties", href: "/properties", icon: Map },
  { name: "Excess Proceeds", href: "/excess-proceeds", icon: DollarSign },
  { name: "Spreadsheets", href: "/spreadsheets", icon: FileSpreadsheet },
  { name: "Spider Control", href: "/spider", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const [location] = useLocation()
  const { authStatus } = useAuthStatus()
  const logout = useLogoutHandler()
  const { data: spiderStatus } = useGetSpiderStatus({ query: { refetchInterval: 30000 } })

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
      <div className="p-4 flex items-center gap-3 font-mono font-bold text-lg border-b border-sidebar-border">
        <TerminalSquare className="w-6 h-6 text-primary" />
        <span className="text-white">AUCTION<span className="text-primary">HUB</span></span>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link key={item.name} href={item.href} className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border" 
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}>
                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.name}
                {item.name === "Spider Control" && spiderStatus?.running && (
                  <span className="ml-auto flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-info opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-info glow-blue"></span>
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border text-xs font-mono text-muted-foreground flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span>B4A AUTH:</span>
          {authStatus?.loggedIn ? (
            <span className="text-success glow-green font-bold">ACTIVE</span>
          ) : (
            <span className="text-destructive font-bold">DISCONNECTED</span>
          )}
        </div>
        {authStatus?.loggedIn && (
          <div className="flex justify-between items-center mt-2">
            <span className="truncate max-w-[120px]" title={authStatus.username || ""}>{authStatus.username}</span>
            <button 
              onClick={() => logout.mutate()} 
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
