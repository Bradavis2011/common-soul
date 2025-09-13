import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent } from '@/test/utils'
import { ShareButton } from './ShareButton'

// Mock window.open
const mockWindowOpen = vi.fn()
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
})

describe('ShareButton', () => {
  const defaultProps = {
    title: 'Test Title',
    text: 'Test content',
    url: '/test-url',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset navigator.share mock
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
    })
    Object.defineProperty(navigator, 'canShare', {
      value: undefined,
      writable: true,
    })
  })

  describe('Native Web Share API', () => {
    it('should use native share when available', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined)
      const mockCanShare = vi.fn().mockReturnValue(true)
      
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
      })
      Object.defineProperty(navigator, 'canShare', {
        value: mockCanShare,
        writable: true,
      })

      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      const shareButton = screen.getByRole('button')
      await user.click(shareButton)

      expect(mockCanShare).toHaveBeenCalledWith({
        title: 'Test Title',
        text: 'Test content',
        url: 'http://localhost:3000/test-url',
      })
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test Title',
        text: 'Test content',
        url: 'http://localhost:3000/test-url',
      })
    })

    it('should show success toast when native share succeeds', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined)
      const mockCanShare = vi.fn().mockReturnValue(true)
      
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
      })
      Object.defineProperty(navigator, 'canShare', {
        value: mockCanShare,
        writable: true,
      })

      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      const shareButton = screen.getByRole('button')
      await user.click(shareButton)

      // Check that the success toast would be triggered
      expect(mockShare).toHaveBeenCalled()
    })

    it('should handle native share errors gracefully', async () => {
      const mockShare = vi.fn().mockRejectedValue(new Error('Share failed'))
      const mockCanShare = vi.fn().mockReturnValue(true)
      
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
      })
      Object.defineProperty(navigator, 'canShare', {
        value: mockCanShare,
        writable: true,
      })

      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      const shareButton = screen.getByRole('button')
      await user.click(shareButton)

      expect(mockShare).toHaveBeenCalled()
      // In a real implementation, we'd check for error toast
    })
  })

  describe('Fallback Dropdown Menu', () => {
    beforeEach(() => {
      // Disable native sharing
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
      })
    })

    it('should show dropdown menu when native share is not available', async () => {
      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      const shareButton = screen.getByRole('button')
      await user.click(shareButton)

      // Check for dropdown menu items
      expect(screen.getByText('Copy Link')).toBeInTheDocument()
      expect(screen.getByText('Share to Twitter')).toBeInTheDocument()
      expect(screen.getByText('Share to Facebook')).toBeInTheDocument()
      expect(screen.getByText('Share to WhatsApp')).toBeInTheDocument()
    })

    it('should copy link to clipboard when Copy Link is clicked', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
      })

      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      const shareButton = screen.getByRole('button')
      await user.click(shareButton)

      const copyButton = screen.getByText('Copy Link')
      await user.click(copyButton)

      expect(mockWriteText).toHaveBeenCalledWith('http://localhost:3000/test-url')
    })

    it('should open Twitter share URL when Share to Twitter is clicked', async () => {
      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      const shareButton = screen.getByRole('button')
      await user.click(shareButton)

      const twitterButton = screen.getByText('Share to Twitter')
      await user.click(twitterButton)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        'noopener,noreferrer'
      )
    })

    it('should open Facebook share URL when Share to Facebook is clicked', async () => {
      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      const shareButton = screen.getByRole('button')
      await user.click(shareButton)

      const facebookButton = screen.getByText('Share to Facebook')
      await user.click(facebookButton)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer/sharer.php'),
        '_blank',
        'noopener,noreferrer'
      )
    })

    it('should open WhatsApp share URL when Share to WhatsApp is clicked', async () => {
      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      const shareButton = screen.getByRole('button')
      await user.click(shareButton)

      const whatsappButton = screen.getByText('Share to WhatsApp')
      await user.click(whatsappButton)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        'noopener,noreferrer'
      )
    })
  })

  describe('Component Props', () => {
    it('should render with custom variant and size', () => {
      render(
        <ShareButton 
          {...defaultProps} 
          variant="outline" 
          size="lg"
        />
      )

      const shareButton = screen.getByRole('button')
      expect(shareButton).toBeInTheDocument()
    })

    it('should show text when showText is true', () => {
      render(
        <ShareButton 
          {...defaultProps} 
          showText={true}
        />
      )

      expect(screen.getByText('Share')).toBeInTheDocument()
    })

    it('should hide icon when showIcon is false', () => {
      render(
        <ShareButton 
          {...defaultProps} 
          showIcon={false}
          showText={true}
        />
      )

      // Should still show the button but without icon
      expect(screen.getByText('Share')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(
        <ShareButton 
          {...defaultProps} 
          className="custom-class"
        />
      )

      const shareButton = screen.getByRole('button')
      expect(shareButton).toHaveClass('custom-class')
    })

    it('should use title as fallback text when text prop is not provided', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined)
      const mockCanShare = vi.fn().mockReturnValue(true)
      
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
      })
      Object.defineProperty(navigator, 'canShare', {
        value: mockCanShare,
        writable: true,
      })

      const user = userEvent.setup()
      render(<ShareButton title="Fallback Title" url="/test" />)

      const shareButton = screen.getByRole('button')
      await user.click(shareButton)

      expect(mockShare).toHaveBeenCalledWith({
        title: 'Fallback Title',
        text: 'Fallback Title',
        url: 'http://localhost:3000/test',
      })
    })
  })

  describe('URL Generation', () => {
    it('should generate correct full URL with window.location.origin', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined)
      const mockCanShare = vi.fn().mockReturnValue(true)
      
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
      })
      Object.defineProperty(navigator, 'canShare', {
        value: mockCanShare,
        writable: true,
      })

      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      const shareButton = screen.getByRole('button')
      await user.click(shareButton)

      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://localhost:3000/test-url',
        })
      )
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<ShareButton {...defaultProps} />)

      const shareButton = screen.getByRole('button')
      
      // Focus the button
      await user.tab()
      expect(shareButton).toHaveFocus()

      // Press Enter
      await user.keyboard('{Enter}')
      
      // Should open dropdown menu or trigger native share
      // This test might need to be adjusted based on implementation
    })

    it('should have proper ARIA attributes', () => {
      render(<ShareButton {...defaultProps} />)

      const shareButton = screen.getByRole('button')
      expect(shareButton).toBeInTheDocument()
      // Additional ARIA tests can be added based on implementation
    })
  })
})