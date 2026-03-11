import '@/styles/index.css'
import React from 'react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { PSSBuilder } from '@/pages/PSSBuilder'
import { ToastHost } from '@/widgets/Toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5
    }
  }
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PSSBuilder />
      <ToastHost />
    </QueryClientProvider>
  )
}

export default App
