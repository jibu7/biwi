import React from 'react'
import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui/card'

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    )
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <Card className="custom-class">
        <p>Card with custom class</p>
      </Card>
    )
    const card = screen.getByText('Card with custom class').closest('div')
    expect(card).toHaveClass('custom-class')
  })

  it('renders with default styling', () => {
    render(
      <Card>
        <p>Default card</p>
      </Card>
    )
    const card = screen.getByText('Default card').closest('div')
    expect(card).toBeInTheDocument()
  })
})
