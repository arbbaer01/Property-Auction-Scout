import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useListAuctions } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { formatCompactCurrency, formatCurrency } from "@/lib/utils"
import { Link } from "wouter"
import { Search, SlidersHorizontal, MapPin, Clock, Filter, AlertCircle } from "lucide-react"

// A custom Equalizer Knob component
function EqualizerKnob({ label, value, onChange, min, max, formatFn = (v: number) => v.toString() }: any) {
  // Simple CSS rotation based knob
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  const rotation = -135 + (percentage / 100) * 270 // -135 to 135 deg

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-background rounded-lg border border-border/50 shadow-inner">
      <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="relative w-16 h-16 rounded-full bg-sidebar border border-sidebar-border shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_2px_10px_rgba(0,0,0,0.5)] flex items-center justify-center cursor-pointer group">
        {/* Track */}
        <svg className="absolute inset-0 w-full h-full -rotate-[135deg]" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-sidebar-accent" strokeDasharray="251.2" strokeDashoffset="62.8" strokeLinecap="round" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-primary transition-all duration-300 ease-out" strokeDasharray="251.2" strokeDashoffset={251.2 - (percentage/100)*(251.2-62.8)} strokeLinecap="round" />
        </svg>
        {/* Knob Body */}
        <div 
          className="absolute inset-2 rounded-full bg-gradient-to-b from-sidebar-accent to-background shadow-[0_2px_5px_rgba(0,0,0,0.8)] border border-sidebar-border/50 flex justify-center pt-1 transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Indicator Marker */}
          <div className="w-1 h-3 bg-primary rounded-full shadow-[0_0_5px_rgba(234,179,8,0.5)]"></div>
        </div>
      </div>
      <div className="text-sm font-mono font-bold lcd-text text-primary text-glow-amber">
        {formatFn(value)}
      </div>
      {/* Hidden range input for actual interaction */}
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute w-16 h-16 opacity-0 cursor-pointer"
      />
    </div>
  )
}

function LedButton({ active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${active ? 'bg-sidebar-accent border-primary/50 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)]' : 'bg-background border-border/50 hover:bg-sidebar/50'}`}
    >
      <div className={`w-3 h-3 rounded-full shadow-inner ${active ? 'bg-primary glow-amber' : 'bg-muted-foreground/30'}`} />
      <span className={`text-xs font-mono font-bold tracking-wider ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
    </button>
  )
}

export default function AuctionsPage() {
  const [params, setParams] = React.useState({
    min_bid: 0,
    max_bid: 10000000,
    days_left_max: 90,
    has_reserve: false,
    auction_type: 'live' as const,
    state: '',
    limit: 20
  });

  const { data, isLoading } = useListAuctions(params, { 
    query: { queryKey: ["/api/auctions", params] } 
  });

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Auction Search</h1>
            <p className="text-muted-foreground mt-1 font-mono text-sm">EQUALIZER BOARD // FILTER PARAMS</p>
          </div>
        </div>

        {/* EQUALIZER BOARD */}
        <Card className="bg-sidebar border-sidebar-border overflow-hidden">
          <div className="bg-sidebar-accent/30 p-2 border-b border-sidebar-border flex items-center justify-between">
            <div className="flex items-center gap-2 px-2 text-xs font-mono text-muted-foreground">
              <SlidersHorizontal className="w-4 h-4" /> MASTER CONTROLS
            </div>
            <div className="flex gap-2">
              <Badge variant="terminal" className="cursor-pointer" onClick={() => setParams({...params, min_bid: 1000, max_bid: 5000})}>TIER 1 (1k-5k)</Badge>
              <Badge variant="terminal" className="cursor-pointer" onClick={() => setParams({...params, min_bid: 400000, max_bid: 1400000})}>TIER 2 (400k-1.4M)</Badge>
              <Badge variant="terminal" className="cursor-pointer" onClick={() => setParams({...params, min_bid: 1500000, max_bid: 10000000})}>TIER 3 (1.5M+)</Badge>
            </div>
          </div>
          <CardContent className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <EqualizerKnob 
              label="MIN BID" 
              min={0} max={10000000} 
              value={params.min_bid} 
              onChange={(v: number) => setParams({...params, min_bid: v})}
              formatFn={formatCompactCurrency}
            />
            <EqualizerKnob 
              label="MAX BID" 
              min={0} max={10000000} 
              value={params.max_bid} 
              onChange={(v: number) => setParams({...params, max_bid: v})}
              formatFn={(v: number) => v === 10000000 ? 'MAX' : formatCompactCurrency(v)}
            />
            <EqualizerKnob 
              label="DAYS LEFT" 
              min={0} max={90} 
              value={params.days_left_max} 
              onChange={(v: number) => setParams({...params, days_left_max: v})}
              formatFn={(v: number) => v === 90 ? 'ANY' : `${v}d`}
            />
            
            <LedButton 
              label="RESERVE MET / NO RESERVE" 
              active={!params.has_reserve} 
              onClick={() => setParams({...params, has_reserve: !params.has_reserve})} 
            />

            <div className="flex flex-col gap-2 p-4 bg-background rounded-lg border border-border/50 shadow-inner">
               <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">PHASE</div>
               <div className="flex flex-col gap-2">
                 <button 
                  className={`text-xs font-mono py-1 px-2 rounded border text-left transition-colors ${params.auction_type === 'pre_auction' ? 'bg-primary/20 border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-sidebar-accent'}`}
                  onClick={() => setParams({...params, auction_type: 'pre_auction'})}
                 >PRE-AUCTION</button>
                 <button 
                  className={`text-xs font-mono py-1 px-2 rounded border text-left transition-colors ${params.auction_type === 'live' ? 'bg-info/20 border-info text-info glow-blue' : 'border-transparent text-muted-foreground hover:bg-sidebar-accent'}`}
                  onClick={() => setParams({...params, auction_type: 'live'})}
                 >LIVE</button>
                 <button 
                  className={`text-xs font-mono py-1 px-2 rounded border text-left transition-colors ${params.auction_type === 'ended' ? 'bg-muted border-muted-foreground text-foreground' : 'border-transparent text-muted-foreground hover:bg-sidebar-accent'}`}
                  onClick={() => setParams({...params, auction_type: 'ended'})}
                 >ENDED</button>
               </div>
            </div>

            <div className="col-span-full pt-4 border-t border-sidebar-border mt-2 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-mono text-muted-foreground mr-2">STATE FILTER:</span>
              {['ALL', 'NV', 'CA', 'AZ', 'TX', 'FL'].map(state => (
                <button
                  key={state}
                  onClick={() => setParams({...params, state: state === 'ALL' ? '' : state})}
                  className={`px-3 py-1 rounded-full text-xs font-mono border transition-all ${
                    (state === 'ALL' && params.state === '') || params.state === state
                      ? 'bg-primary text-primary-foreground border-primary glow-amber font-bold'
                      : 'bg-transparent border-sidebar-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* RESULTS GRID */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-mono font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" /> 
              SEARCH RESULTS 
              <span className="text-muted-foreground font-normal text-sm ml-2">({data?.total || 0} MATCHES)</span>
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="h-64 bg-sidebar rounded-lg border border-sidebar-border animate-pulse"></div>
              ))}
            </div>
          ) : data?.auctions.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-sidebar-border rounded-lg bg-sidebar/30">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-mono text-muted-foreground">NO AUCTIONS MATCH CRITERIA</p>
              <Button variant="outline" className="mt-4 font-mono" onClick={() => setParams({...params, min_bid: 0, max_bid: 10000000, state: ''})}>RESET FILTERS</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {data?.auctions.map(auction => (
                <Link key={auction.id} href={`/auctions/${auction.id}`}>
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group bg-sidebar border-sidebar-border overflow-hidden flex flex-col">
                    <div className="h-2 w-full bg-sidebar-border">
                      {auction.auctionType === 'live' && <div className="h-full bg-info glow-blue w-full animate-pulse"></div>}
                      {auction.auctionType === 'pre_auction' && <div className="h-full bg-primary w-full"></div>}
                      {auction.auctionType === 'ended' && <div className="h-full bg-muted-foreground w-full"></div>}
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant={auction.auctionType === 'live' ? 'info' : 'outline'} className="font-mono text-[10px]">
                          {auction.auctionType === 'live' ? 'LIVE NOW' : auction.auctionType.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="secondary" className="font-mono text-[10px]">{auction.state} • {auction.county}</Badge>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors flex-1">
                        {auction.title}
                      </h3>
                      
                      <div className="space-y-3 mt-auto pt-4 border-t border-sidebar-border">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-mono text-muted-foreground uppercase">
                            {auction.auctionType === 'pre_auction' ? 'STARTING BID' : 'CURRENT BID'}
                          </span>
                          <span className={`text-xl font-bold lcd-text ${auction.auctionType === 'live' ? 'text-info text-glow-blue' : 'text-foreground'}`}>
                            {formatCurrency(auction.currentBid || auction.startingBid)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground bg-background rounded p-2">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {auction.daysLeft !== null ? `${auction.daysLeft}d left` : 'TBD'}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {auction.propertyType.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
