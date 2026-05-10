import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import '@/index.css'
import router from '@/router'
import { AppProvider } from '@/contexts/app.context'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { queryClient } from '@/lib/queryClient'
import AppWebSocketProvider from '@/components/AppWebSocketProvider/AppWebSocketProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <ThemeProvider attribute='class' defaultTheme='light' disableTransitionOnChange>
            <AppWebSocketProvider>
              <RouterProvider router={router} />
              <Toaster richColors position='top-right' offset='70px' />
            </AppWebSocketProvider>
          </ThemeProvider>
        </AppProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>
)
