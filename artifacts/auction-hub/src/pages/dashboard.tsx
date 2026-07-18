import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useGetAuctionSummary, useGetExcessProceedsSummary, useGetSpiderStatus, useListAuctions } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCompactCurrency, formatNumber } from "@/lib/utils"
import { Activity, DollarSign, Target, TrendingUp, ChevronRight, Zap } from "lucide-react"
import { Link } from "wouter"
import { Badge } from "@/components/ui/badge"

export default function Dashboard() {
  const { data: summary } = useGetAuctionSummary({ query: { queryKey: ["/api/auctions/summary"] } })
  const { data: proceeds } = useGetExcessProceedsSummary({ query: { queryKey: ["/api/excess-proceeds/summary"] } })
  const { data: spiderStatus } = useGetSpiderStatus({ query: { refetchInterval: 30000, queryKey: ["/api/spider/status"] } })
  const { data: liveAuctions } = useListAuctions({ auction_type: "live", limit: 5 }, { query: { queryKey: ["/api/auctions", { auction_type: "live", limit: 5 }] } })

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
            <p className="text-muted-foreground mt-1 font-mono text-sm">SYSTEM STATUS: NOMINAL</p>
          </div>
          
          <Card className="bg-sidebar border-sidebar-border max-w-xs">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-full p-2 bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono">SPIDER STATUS</p>
                <div className="flex items-center gap-2 mt-1">
                  {spiderStatus?.running ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-info opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-info glow-blue"></span>
                      </span>
                      <span className="font-mono text-sm font-bold text-info glow-text-blue uppercase">{spiderStatus.mode}</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-muted"></span>
                      <span className="font-mono text-sm font-bold text-muted-foreground">IDLE</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary hover:border-l-primary/80 transition-colors">
            <CardHeader className="pb-2">
              <CardDescription className="font-mono font-medium flex items-center justify-between">
                TOTAL AUCTIONS <Target className="w-4 h-4 text-primary" />
              </CardDescription>
              <CardTitle className="text-4xl font-bold lcd-text">
                {formatNumber(summary?.totalAuctions)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-xs text-muted-foreground font-mono mt-2">
                <span>PRE: {formatNumber(summary?.preAuctionCount)}</span>
                <span>LIVE: {formatNumber(summary?.liveCount)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-info hover:border-l-info/80 transition-colors">
            <CardHeader className="pb-2">
              <CardDescription className="font-mono font-medium flex items-center justify-between text-info">
                LIVE ACTIVITY <Zap className="w-4 h-4" />
              </CardDescription>
              <CardTitle className="text-4xl font-bold lcd-text text-glow-blue text-info">
                {formatNumber(summary?.liveCount)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground font-mono mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-info animate-pulse"></span>
                AUCTIONS IN PROGRESS
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success hover:border-l-success/80 transition-colors">
            <CardHeader className="pb-2">
              <CardDescription className="font-mono font-medium flex items-center justify-between text-success">
                UNCLAIMED PROCEEDS <DollarSign className="w-4 h-4" />
              </CardDescription>
              <CardTitle className="text-4xl font-bold lcd-text text-success text-glow-green">
                {formatCompactCurrency(proceeds?.unclaimedAmount)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground font-mono mt-2">
                ACROSS {formatNumber(proceeds?.unclaimedCount)} RECORDS
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning hover:border-l-warning/80 transition-colors">
            <CardHeader className="pb-2">
              <CardDescription className="font-mono font-medium flex items-center justify-between text-warning">
                TIER 3 OPPORTUNITIES <TrendingUp className="w-4 h-4" />
              </CardDescription>
              <CardTitle className="text-4xl font-bold lcd-text text-warning text-glow-amber">
                {formatNumber(summary?.priceTiers?.tier3)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground font-mono mt-2">
                PROPERTIES {'>'} $1.5M
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Price Tiers Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-mono text-sm tracking-wider text-muted-foreground">ASSET DISTRIBUTION</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="font-mono">
                    <div className="text-sm text-muted-foreground">TIER 1</div>
                    <div className="text-xs">$1k - $5k</div>
                  </div>
                  <div className="lcd-text text-xl">{formatNumber(summary?.priceTiers?.tier1)}</div>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, (summary?.priceTiers?.tier1 || 0) / (summary?.totalAuctions || 1) * 100)}%` }} />
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <div className="flex justify-between items-end">
                  <div className="font-mono">
                    <div className="text-sm text-muted-foreground">TIER 2</div>
                    <div className="text-xs">$400k - $1.4M</div>
                  </div>
                  <div className="lcd-text text-xl text-info text-glow-blue">{formatNumber(summary?.priceTiers?.tier2)}</div>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-info glow-blue" style={{ width: `${Math.min(100, (summary?.priceTiers?.tier2 || 0) / (summary?.totalAuctions || 1) * 100)}%` }} />
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <div className="flex justify-between items-end">
                  <div className="font-mono">
                    <div className="text-sm text-muted-foreground">TIER 3</div>
                    <div className="text-xs">$1.5M+</div>
                  </div>
                  <div className="lcd-text text-xl text-warning text-glow-amber">{formatNumber(summary?.priceTiers?.tier3)}</div>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-warning glow-amber" style={{ width: `${Math.min(100, (summary?.priceTiers?.tier3 || 0) / (summary?.totalAuctions || 1) * 100)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Feed */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-sidebar-border pb-4">
              <CardTitle className="font-mono text-sm tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-info animate-pulse"></span>
                ACTIVE MONITORING
              </CardTitle>
              <Link href="/auctions" className="text-xs font-mono text-primary hover:underline flex items-center">
                VIEW ALL <ChevronRight className="w-3 h-3 ml-1" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {liveAuctions?.auctions.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground font-mono text-sm py-12">
                  NO LIVE AUCTIONS FOUND
                </div>
              ) : (
                <div className="divide-y divide-sidebar-border">
                  {liveAuctions?.auctions.map(auction => (
                    <Link key={auction.id} href={`/auctions/${auction.id}`} className="block p-4 hover:bg-sidebar-accent/50 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Badge variant="terminal" className="mb-2">{auction.state} • {auction.county}</Badge>
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{auction.title}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono text-muted-foreground">CURRENT BID</div>
                          <div className="text-xl font-bold lcd-text text-info text-glow-blue">{formatCompactCurrency(auction.currentBid)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                        <span>BIDS: {auction.bidCount || 0}</span>
                        <span>RESERVE: {auction.hasReserve ? (auction.reserveMet ? 'MET' : 'NOT MET') : 'NONE'}</span>
                        <span className="ml-auto flex items-center gap-1 text-primary">
                          MONITOR <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
