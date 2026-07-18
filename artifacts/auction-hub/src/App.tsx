import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import Dashboard from './pages/dashboard';
import AuctionsPage from './pages/auctions';
import AuctionDetail from './pages/auction-detail';
import PropertiesPage from './pages/properties';
import ExcessProceedsPage from './pages/excess-proceeds';
import SpreadsheetsPage from './pages/spreadsheets';
import SpiderControlPage from './pages/spider';
import SettingsPage from './pages/settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/auctions" component={AuctionsPage} />
      <Route path="/auctions/:id" component={AuctionDetail} />
      <Route path="/properties" component={PropertiesPage} />
      <Route path="/excess-proceeds" component={ExcessProceedsPage} />
      <Route path="/spreadsheets" component={SpreadsheetsPage} />
      <Route path="/spider" component={SpiderControlPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
