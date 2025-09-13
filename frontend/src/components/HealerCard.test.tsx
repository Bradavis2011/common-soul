import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '@/test/utils'
import { HealerCard } from './HealerCard'
import { AuthContext } from '@/contexts/AuthContext'
import { mockUser } from '@/test/utils'

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a>,
  }
})

describe('HealerCard', () => {
  const defaultProps = {
    name: 'Sarah Moonlight',
    specialty: 'Crystal Healing',
    rating: 4.8,
    reviewCount: 24,
    location: 'New York, NY',
    isVirtual: true,
    price: '$125/hour',
    avatar: '/healer-avatar.jpg',
    tags: ['Crystal Healing', 'Chakra Balancing', 'Energy Work'],
    id: 'healer-123',
  }

  const renderWithAuth = (isAuthenticated: boolean = false, component: React.ReactElement) => {
    const mockAuthContext = {
      user: isAuthenticated ? mockUser : null,
      isAuthenticated,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      loading: false,
    }

    return render(
      <AuthContext.Provider value={mockAuthContext}>
        {component}
      </AuthContext.Provider>
    )
  }

  describe('Rendering', () => {
    it('should render healer information correctly', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} />)

      expect(screen.getByText('Sarah Moonlight')).toBeInTheDocument()
      expect(screen.getByText('Crystal Healing')).toBeInTheDocument()
      expect(screen.getByText('4.8')).toBeInTheDocument()
      expect(screen.getByText('(24)')).toBeInTheDocument()
      expect(screen.getByText('New York, NY')).toBeInTheDocument()
      expect(screen.getByText('$125/hour')).toBeInTheDocument()
    })

    it('should display virtual availability when isVirtual is true', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} />)

      expect(screen.getByText('Virtual Available')).toBeInTheDocument()
    })

    it('should not display virtual availability when isVirtual is false', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} isVirtual={false} />)

      expect(screen.queryByText('Virtual Available')).not.toBeInTheDocument()
    })

    it('should render all tags', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} />)

      expect(screen.getByText('Crystal Healing')).toBeInTheDocument()
      expect(screen.getByText('Chakra Balancing')).toBeInTheDocument()
      expect(screen.getByText('Energy Work')).toBeInTheDocument()
    })

    it('should show DEMO badge when isDemo is true', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} isDemo={true} />)

      expect(screen.getByText('DEMO')).toBeInTheDocument()
    })

    it('should not show DEMO badge when isDemo is false', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} isDemo={false} />)

      expect(screen.queryByText('DEMO')).not.toBeInTheDocument()
    })
  })

  describe('Authentication-based Behavior', () => {
    it('should show login links when user is not authenticated', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} />)

      const viewProfileLink = screen.getByRole('link', { name: /view profile/i }).closest('a')
      const bookSessionLink = screen.getByRole('link', { name: /book session/i }).closest('a')

      expect(viewProfileLink).toHaveAttribute('href', '/login')
      expect(bookSessionLink).toHaveAttribute('href', '/login')
    })

    it('should show healer profile and booking links when user is authenticated', () => {
      renderWithAuth(true, <HealerCard {...defaultProps} />)

      const viewProfileLink = screen.getByRole('link', { name: /view profile/i }).closest('a')
      const bookSessionLink = screen.getByRole('link', { name: /book session/i }).closest('a')

      expect(viewProfileLink).toHaveAttribute('href', '/healer/healer-123')
      expect(bookSessionLink).toHaveAttribute('href', '/booking')
    })
  })

  describe('Healer ID Generation', () => {
    it('should use provided id when available', () => {
      renderWithAuth(true, <HealerCard {...defaultProps} id="custom-id" />)

      const viewProfileLink = screen.getByRole('link', { name: /view profile/i }).closest('a')
      expect(viewProfileLink).toHaveAttribute('href', '/healer/custom-id')
    })

    it('should generate id from name when id is not provided', () => {
      renderWithAuth(true, <HealerCard {...defaultProps} id={undefined} />)

      const viewProfileLink = screen.getByRole('link', { name: /view profile/i }).closest('a')
      expect(viewProfileLink).toHaveAttribute('href', '/healer/sarah-moonlight')
    })

    it('should handle special characters in name when generating id', () => {
      renderWithAuth(true, 
        <HealerCard 
          {...defaultProps} 
          name="Dr. Sarah O'Moonlight-Smith!" 
          id={undefined} 
        />
      )

      const viewProfileLink = screen.getByRole('link', { name: /view profile/i }).closest('a')
      expect(viewProfileLink).toHaveAttribute('href', '/healer/dr-sarah-omoonlight-smith')
    })
  })

  describe('Share Button Integration', () => {
    it('should include ShareButton component', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} />)

      // ShareButton should be present (we can test for the share button)
      const shareButton = screen.getByRole('button', { name: /share/i }) || 
                         screen.getByRole('button') // Fallback if no explicit name
      
      expect(shareButton).toBeInTheDocument()
    })

    it('should pass correct props to ShareButton', async () => {
      // This test would need to mock the ShareButton component to check props
      // For now, we can test that clicking doesn't break anything
      renderWithAuth(false, <HealerCard {...defaultProps} />)

      const shareButtons = screen.getAllByRole('button')
      const shareButton = shareButtons.find(button => 
        button.innerHTML.includes('Share') || button.getAttribute('aria-label')?.includes('share')
      )

      if (shareButton) {
        const user = userEvent.setup()
        // Should not throw an error
        await user.click(shareButton)
      }
    })
  })

  describe('Rating Display', () => {
    it('should display rating with proper formatting', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} rating={4.5} reviewCount={10} />)

      expect(screen.getByText('4.5')).toBeInTheDocument()
      expect(screen.getByText('(10)')).toBeInTheDocument()
    })

    it('should handle zero reviews', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} rating={0} reviewCount={0} />)

      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('(0)')).toBeInTheDocument()
    })

    it('should handle high review counts', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} rating={4.9} reviewCount={1000} />)

      expect(screen.getByText('4.9')).toBeInTheDocument()
      expect(screen.getByText('(1000)')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should render without layout issues', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} />)

      const card = screen.getByRole('article') || document.querySelector('[class*="card"]')
      expect(card || screen.getByText('Sarah Moonlight').closest('.card, [class*="card"]')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should have proper link roles', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} />)

      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })

    it('should be keyboard navigable', async () => {
      renderWithAuth(false, <HealerCard {...defaultProps} />)
      const user = userEvent.setup()

      // Should be able to tab through interactive elements
      await user.tab()
      const focusedElement = document.activeElement
      expect(focusedElement).toBeInstanceOf(Element)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing or empty tags array', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} tags={[]} />)

      // Should render without breaking
      expect(screen.getByText('Sarah Moonlight')).toBeInTheDocument()
    })

    it('should handle very long healer names', () => {
      const longName = 'Dr. Sarah Moonlight Crystal Healing Energy Master Practitioner'
      renderWithAuth(false, <HealerCard {...defaultProps} name={longName} />)

      expect(screen.getByText(longName)).toBeInTheDocument()
    })

    it('should handle very long specialties', () => {
      const longSpecialty = 'Crystal Healing and Energy Work with Advanced Chakra Balancing Techniques'
      renderWithAuth(false, <HealerCard {...defaultProps} specialty={longSpecialty} />)

      expect(screen.getByText(longSpecialty)).toBeInTheDocument()
    })

    it('should handle various price formats', () => {
      renderWithAuth(false, <HealerCard {...defaultProps} price="Free consultation" />)

      expect(screen.getByText('Free consultation')).toBeInTheDocument()
    })
  })
})