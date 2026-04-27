import { AppRouting } from '@/routing/app-routing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { LoadingBarContainer } from 'react-top-loading-bar';
import { Toaster } from '@/components/ui/sonner';

const { BASE_URL } = import.meta.env;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        storageKey="roofly-theme"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
      >
        <HelmetProvider>
          <LoadingBarContainer>
            <BrowserRouter basename={BASE_URL}>
              <Toaster />
              <AppRouting />
            </BrowserRouter>
          </LoadingBarContainer>
        </HelmetProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
