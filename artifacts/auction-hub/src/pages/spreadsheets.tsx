import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  useListSpreadsheets,
  useDownloadSpreadsheet,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import {
  Download,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SpreadsheetsPage() {
  const { data, refetch, isLoading } = useListSpreadsheets();

  const downloadMutation = useDownloadSpreadsheet();
  const { toast } = useToast();

  const handleDownload = (
    type: any,
    state: string,
    county: string,
    year: number,
    month: number,
    url?: string,
  ) => {
    downloadMutation.mutate(
      {
        data: { type, state, county, year, month, sourceUrl: url },
      },
      {
        onSuccess: () => {
          toast({
            title: "Download started",
            description: "The spreadsheet is being imported.",
          });
          refetch();
        },
        onError: (err) => {
          toast({
            title: "Download failed",
            description: err.error,
            variant: "destructive",
          });
        },
      },
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "imported":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> IMPORTED
          </Badge>
        );
      case "downloading":
        return (
          <Badge variant="info" className="gap-1 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" /> DOWNLOADING
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" /> PENDING
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" /> FAILED
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between border-b border-sidebar-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Spreadsheet Manager
            </h1>
            <p className="text-muted-foreground mt-1 font-mono text-sm">
              BID4ASSETS RAW DATA IMPORT
            </p>
          </div>
          <Button
            variant="terminal"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" /> REFRESH LIST
          </Button>
        </div>

        {/* Quick Launch Downloads */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <Card className="bg-sidebar border-sidebar-border border-l-4 border-l-primary hover:bg-sidebar-accent/50 transition-colors">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <div className="font-mono font-bold text-sm">
                  NV PRE-AUCTION
                </div>
                <div className="text-xs text-muted-foreground">
                  Current Month
                </div>
              </div>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() =>
                  handleDownload(
                    "pre_auction",
                    "NV",
                    "Washoe",
                    new Date().getFullYear(),
                    new Date().getMonth() + 1,
                  )
                }
              >
                <Download className="w-4 h-4 text-primary" />
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-sidebar border-sidebar-border border-l-4 border-l-success hover:bg-sidebar-accent/50 transition-colors">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <div className="font-mono font-bold text-sm">
                  NV POST-AUCTION
                </div>
                <div className="text-xs text-muted-foreground">Last Month</div>
              </div>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() =>
                  handleDownload(
                    "post_auction",
                    "NV",
                    "Washoe",
                    new Date().getFullYear(),
                    new Date().getMonth(),
                  )
                }
              >
                <Download className="w-4 h-4 text-success" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-background border-border shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono text-left">
              <thead className="bg-sidebar text-muted-foreground border-b border-sidebar-border">
                <tr>
                  <th className="px-4 py-3 font-medium">DOCUMENT</th>
                  <th className="px-4 py-3 font-medium">TYPE</th>
                  <th className="px-4 py-3 font-medium">LOCATION</th>
                  <th className="px-4 py-3 font-medium">DATE</th>
                  <th className="px-4 py-3 font-medium text-right">RECORDS</th>
                  <th className="px-4 py-3 font-medium text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sidebar-border">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      LOADING RECORDS...
                    </td>
                  </tr>
                ) : data?.spreadsheets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      NO SPREADSHEETS FOUND
                    </td>
                  </tr>
                ) : (
                  data?.spreadsheets.map((sheet) => (
                    <tr
                      key={sheet.id}
                      className="hover:bg-sidebar/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-primary" />
                          <span className="font-bold">
                            {sheet.id.toString().padStart(4, "0")}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase"
                        >
                          {sheet.type.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sheet.state} • {sheet.county}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sheet.year}-{sheet.month.toString().padStart(2, "0")}
                      </td>
                      <td className="px-4 py-3 text-right lcd-text">
                        {formatNumber(sheet.propertyCount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {getStatusBadge(sheet.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
