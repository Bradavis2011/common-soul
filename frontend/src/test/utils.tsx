import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'

// Create a new QueryClient for each test to ensure test isolation
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})

interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient()

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) =>
  render(ui, {
    wrapper: AllTheProviders,
    ...options,
  })

// Mock user data for testing
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'CUSTOMER' as const,
  isVerified: true,
}

export const mockHealer = {
  id: 'test-healer-id',
  email: 'healer@example.com',
  name: 'Test Healer',
  role: 'HEALER' as const,
  isVerified: true,
  healerProfile: {
    id: 'healer-profile-id',
    specialties: ['Crystal Healing', 'Reiki'],
    bio: 'Test healer bio',
    certifications: ['Certified Reiki Master'],
    experience: 5,
    hourlyRate: 125,
    location: 'New York, NY',
    isVirtual: true,
    languages: ['English'],
  }
}

// Mock forum post data
export const mockForumPost = {
  id: 'post-1',
  title: 'Test Forum Post',
  content: 'This is a test forum post content',
  category: 'healing-experiences',
  author: {
    id: 'author-1',
    name: 'Test Author',
    avatarUrl: '/test-avatar.jpg',
    isVerified: true,
    userType: 'customer' as const,
  },
  createdAt: '2025-01-13T10:00:00Z',
  likesCount: 5,
  commentsCount: 3,
  viewsCount: 25,
  isLiked: false,
  isPinned: false,
  tags: ['healing', 'spiritual'],
  comments: [],
}

// Mock API responses
export const mockApiResponse = <T>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
})

// Re-export everything
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
export { customRender as render }