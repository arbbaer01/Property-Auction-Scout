import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useGetAuction, useGetMonitoringStatus, useStartMonitoring, useStopMonitoring } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { useParams, Link } from "wouter"
import { ArrowLeft, Clock, MapPin, ExternalLink, Activity, AlertTriangle, ShieldCheck } from "lucide-react"

export default function AuctionDetail() {
  const { id } = useParams()
  const auctionId = Number(id)
  
  const { data: auction, isLoading: loadingAuction } = useGetAuction(auctionId, { 
    query: { queryKey: ["/api/auctions", auctionId], enabled: !!auctionId } 
  })
  
  const { data: monitorStatus, isLoading: loadingMonitor } = useGetMonitoringStatus(auctionId, {
    query: { 
      refetchInterval: 15000, 
      queryKey: ["/api/monitoring", auctionId],
      enabled: !!auctionId && auction?.auctionType === 'live'
    }
  })

  const startMonitor = useStartMonitoring()
  const stopMonitor = useStopMonitoring()

  const handleToggleMonitor = () => {
    if (monitorStatus?.auctionId) {
      stopMonitor.mutate({ auctionId })
    } else {
      startMonitor.mutate({ auctionId })
    }
  }

  if (loadingAuction) {
    return <AppLayout><div className="p-8 text-center font-mono">LOADING AUCTION DATA...</div></AppLayout>
  }

  if (!auction) {
    return <AppLayout><div className="p-8 text-center font-mono text-destructive">AUCTION NOT FOUND</div></AppLayout>
  }

  const isLive = auction.auctionType === 'live'
  const currentPrice = monitorStatus?.currentBid || auction.currentBid || auction.startingBid

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <Link href="/auctions" className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-primary transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> BACK TO SEARCH
        </Link>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Main Info Column */}
          <div className="flex-1 w-full space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant={isLive ? 'info' : 'secondary'} className="font-mono uppercase">
                  {auction.auctionType.replace('_', ' ')}
                </Badge>
                <Badge variant="terminal" className="font-mono">
                  {auction.state} • {auction.county}
                </Badge>
                {auction.parcelNumber && (
                  <span className="text-xs font-mono text-muted-foreground bg-sidebar px-2 py-1 rounded border">
                    APN: {auction.parcelNumber}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                {auction.title}
              </h1>
            </div>

            <Card className="bg-sidebar border-sidebar-border shadow-lg">
              <CardHeader className="bg-sidebar-accent/30 border-b border-sidebar-border flex flex-row items-center justify-between pb-4">
                <CardTitle className="font-mono text-sm tracking-wider">PROPERTY DETAILS</CardTitle>
                {auction.detailUrl && (
                  <a href={auction.detailUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm font-mono flex items-center gap-1">
                    BID4ASSETS <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-mono text-muted-foreground mb-1">ADDRESS</div>
                      <div className="font-medium flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {auction.address || 'Address not disclosed'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-mono text-muted-foreground mb-1">PROPERTY TYPE</div>
                      <div className="font-medium capitalize">{auction.propertyType}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-mono text-muted-foreground mb-1">AUCTION TIMELINE</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between border-b border-border/50 pb-1">
                          <span className="text-muted-foreground">START:</span>
                          <span className="font-mono">{auction.auctionStartAt ? new Date(auction.auctionStartAt).toLocaleString() : 'TBD'}</span>
                        </div>
                        <div className="flex justify-between border-b border-border/50 pb-1">
                          <span className="text-muted-foreground">END:</span>
                          <span className="font-mono">{auction.auctionEndAt ? new Date(auction.auctionEndAt).toLocaleString() : 'TBD'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description or Images would go here */}
            {auction.imageUrl && (
              <div className="rounded-lg overflow-hidden border border-border">
                <img src={auction.imageUrl} alt="Property" className="w-full h-auto max-h-[400px] object-cover" />
              </div>
            )}
          </div>

          {/* Right Sidebar - Monitor / Bidding */}
          <div className="w-full lg:w-[400px] shrink-0 space-y-6">
            
            {/* Live Monitor Panel */}
            <Card className={`border-2 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] ${
              isLive ? 'border-info/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-sidebar-border'
            }`}>
              <div className={`p-3 border-b flex justify-between items-center ${
                isLive ? 'bg-info/10 border-info/30' : 'bg-sidebar-accent border-sidebar-border'
              }`}>
                <div className="flex items-center gap-2 font-mono text-sm font-bold">
                  {isLive && <span className="w-2 h-2 rounded-full bg-info animate-pulse glow-blue"></span>}
                  <span className={isLive ? 'text-info glow-text-blue' : 'text-muted-foreground'}>
                    {isLive ? 'LIVE BIDDING DATA' : 'AUCTION STATUS'}
                  </span>
                </div>
                {isLive && (
                  <Button 
                    variant={monitorStatus?.auctionId ? "destructive" : "terminal"} 
                    size="sm" 
                    className="h-7 text-xs px-2"
                    onClick={handleToggleMonitor}
                    disabled={startMonitor.isPending || stopMonitor.isPending}
                  >
                    {monitorStatus?.auctionId ? 'STOP MONITOR' : 'START MONITOR'}
                  </Button>
                )}
              </div>
              
              <CardContent className="p-6 bg-sidebar/50 flex flex-col items-center justify-center text-center">
                {monitorStatus?.outbid && (
                  <div className="w-full bg-destructive/20 border border-destructive text-destructive px-4 py-2 rounded mb-4 font-mono font-bold flex items-center justify-center gap-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4" /> OUTBID ALERT
                  </div>
                )}
                
                <div className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-widest">CURRENT PRICE</div>
                <div className={`text-5xl font-bold lcd-text mb-6 ${
                  isLive ? 'text-info text-glow-blue' : 'text-foreground'
                }`}>
                  {formatCurrency(currentPrice)}
                </div>

                <div className="w-full grid grid-cols-2 gap-4 text-left">
                  <div className="bg-background border border-border/50 p-3 rounded text-center">
                    <div className="text-[10px] font-mono text-muted-foreground mb-1">BID COUNT</div>
                    <div className="font-mono text-xl font-bold">{monitorStatus?.bidCount ?? auction.bidCount ?? 0}</div>
                  </div>
                  <div className="bg-background border border-border/50 p-3 rounded text-center">
                    <div className="text-[10px] font-mono text-muted-foreground mb-1">RESERVE</div>
                    <div className={`font-mono text-sm font-bold mt-1 ${
                      (monitorStatus?.reserveMet ?? auction.reserveMet) ? 'text-success glow-green' : 'text-muted-foreground'
                    }`}>
                      {!auction.hasReserve ? 'NONE' : (monitorStatus?.reserveMet ?? auction.reserveMet) ? 'MET' : 'NOT MET'}
                    </div>
                  </div>
                </div>

                {isLive && (
                  <div className="w-full mt-6 pt-4 border-t border-border/50">
                    <div className="flex justify-between items-center text-sm font-mono">
                      <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/> REMAINING:</span>
                      <span className="font-bold text-primary">{monitorStatus?.timeRemainingSeconds ? `${Math.floor(monitorStatus.timeRemainingSeconds / 60)}m ${monitorStatus.timeRemainingSeconds % 60}s` : `${auction.daysLeft}d ${auction.hoursLeft}h`}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bid History Feed (Simulated via recentBids if we had it, but using placeholder structure) */}
            {isLive && monitorStatus?.recentBids && monitorStatus.recentBids.length > 0 && (
              <Card className="bg-sidebar border-sidebar-border">
                <CardHeader className="p-4 border-b border-sidebar-border">
                  <CardTitle className="font-mono text-sm">RECENT BIDS</CardTitle>
                </CardHeader>
                <div className="max-h-[300px] overflow-y-auto p-0">
                  {monitorStatus.recentBids.map((bid, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border-b border-sidebar-border/50 font-mono text-sm hover:bg-sidebar-accent/30 transition-colors">
                      <div className="text-muted-foreground">{new Date(bid.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</div>
                      <div className="text-primary">{bid.bidder || 'Unknown'}</div>
                      <div className="font-bold">{formatCurrency(bid.amount)}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Stats Summary */}
            <Card className="bg-background border-border/50 shadow-inner">
              <CardContent className="p-4 space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">STARTING BID</span>
                  <span>{formatCurrency(auction.startingBid)}</span>
                </div>
                {auction.hasReserve && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RESERVE AMOUNT</span>
                    <span>{auction.reserveAmount ? formatCurrency(auction.reserveAmount) : 'Hidden'}</span>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AppLayout>
  )
}
