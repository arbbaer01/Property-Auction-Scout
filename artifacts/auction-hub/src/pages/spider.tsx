import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useGetSpiderStatus, useStartSpider, useStopSpider } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Activity, Play, Square, Settings2, Globe, Database, Network } from "lucide-react"

export default function SpiderControlPage() {
  const { data: status, refetch } = useGetSpiderStatus({ query: { refetchInterval: 5000, queryKey: ["/api/spider/status"] } })
  const startMutation = useStartSpider()
  const stopMutation = useStopSpider()
  const { toast } = useToast()

  const handleStart = (mode: 'pre_auction' | 'live_auction' | 'post_auction') => {
    startMutation.mutate({
      data: { mode }
    }, {
      onSuccess: () => {
        toast({ title: "Spider Initialized", description: `Sequence ${mode} commenced.` })
        refetch()
      },
      onError: (err) => {
        toast({ title: "Launch Failed", description: err.error, variant: "destructive" })
      }
    })
  }

  const handleStop = () => {
    stopMutation.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Spider Halted", description: "Scraping sequence aborted." })
        refetch()
      }
    })
  }

  const isRunning = status?.running;
  const currentMode = status?.mode;

  const renderPanel = (mode: 'pre_auction' | 'live_auction' | 'post_auction', title: string, colorClass: string, glowClass: string, Icon: any) => {
    const isThisRunning = isRunning && currentMode === mode;
    
    return (
      <Card className={`relative overflow-hidden border-2 transition-all duration-500 ${
        isThisRunning ? `border-${colorClass} shadow-[0_0_20px_rgba(var(--${colorClass}-rgb),0.2)]` : 'border-sidebar-border bg-sidebar'
      }`}>
        {isThisRunning && (
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none" />
        )}
        
        <CardHeader className="border-b border-sidebar-border/50 relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 font-mono">
                <Icon className={`w-5 h-5 ${isThisRunning ? `text-${colorClass} ${glowClass}` : 'text-muted-foreground'}`} />
                {title}
              </CardTitle>
              <CardDescription className="font-mono text-xs mt-1 uppercase">Extraction Sequence</CardDescription>
            </div>
            <Badge variant="outline" className={`font-mono ${isThisRunning ? `bg-${colorClass}/20 text-${colorClass} border-${colorClass}` : ''}`}>
              {isThisRunning ? 'ACTIVE' : 'STANDBY'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 relative z-10 space-y-6">
          <div className="flex justify-center py-4">
            <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center relative ${
              isThisRunning ? `border-${colorClass}/30` : 'border-sidebar-border'
            }`}>
              {isThisRunning && (
                <>
                  <div className={`absolute inset-0 rounded-full border-t-4 border-${colorClass} animate-radar`} />
                  <div className={`absolute w-full h-[2px] bg-gradient-to-r from-transparent via-${colorClass} to-transparent animate-spin`} style={{ animationDuration: '3s' }} />
                </>
              )}
              <Activity className={`w-12 h-12 ${isThisRunning ? `text-${colorClass} animate-pulse` : 'text-muted-foreground/30'}`} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-background/50 p-4 rounded border border-sidebar-border/50">
            <div>
              <div className="text-[10px] font-mono text-muted-foreground">PAGES SCANNED</div>
              <div className={`text-2xl font-bold lcd-text ${isThisRunning ? 'text-foreground' : 'text-muted-foreground'}`}>
                {isThisRunning ? status.pagesScanned : 0}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-muted-foreground">DATA NODES</div>
              <div className={`text-2xl font-bold lcd-text ${isThisRunning ? `text-${colorClass}` : 'text-muted-foreground'}`}>
                {isThisRunning ? status.auctionsFound : 0}
              </div>
            </div>
          </div>

          {isThisRunning && status.currentUrl && (
            <div className="text-xs font-mono text-muted-foreground truncate bg-background p-2 rounded border border-border/50">
              {status.currentUrl}
            </div>
          )}

          <div className="pt-4 border-t border-sidebar-border/50">
            {isThisRunning ? (
              <Button variant="destructive" className="w-full font-mono font-bold" onClick={handleStop} disabled={stopMutation.isPending}>
                <Square className="w-4 h-4 mr-2" /> ABORT SEQUENCE
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className={`w-full font-mono font-bold border-${colorClass}/50 hover:bg-${colorClass}/10 hover:text-${colorClass}`} 
                onClick={() => handleStart(mode)}
                disabled={isRunning}
              >
                <Play className="w-4 h-4 mr-2" /> INITIALIZE
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between border-b border-sidebar-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Spider Control</h1>
            <p className="text-muted-foreground mt-1 font-mono text-sm">AUTONOMOUS DATA EXTRACTION SUBSYSTEMS</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {renderPanel('pre_auction', 'PRE-AUCTION SPIDER', 'primary', 'glow-amber', Database)}
          {renderPanel('live_auction', 'LIVE AUCTION SPIDER', 'info', 'glow-blue', Network)}
          {renderPanel('post_auction', 'POST-AUCTION SPIDER', 'success', 'glow-green', Globe)}
        </div>
      </div>
    </AppLayout>
  )
}
