import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MagazineProvider, useMagazines } from './MagazineContext'

const mockMagazines = [
  { id: '1', title: 'Magazine 1', cover: 'https://example.com/1.jpg' },
  { id: '2', title: 'Magazine 2', cover: 'https://example.com/2.jpg' },
  { id: '3', title: 'Magazine 3', cover: 'https://example.com/3.jpg' },
]

const TestComponent = () => {
  const { magazines, removeMagazine } = useMagazines()
  return (
    <div>
      <ul data-testid="magazine-list">
        {magazines.map(mag => (
          <li key={mag.id} data-testid={`magazine-${mag.id}`}>
            {mag.title}
            <button onClick={() => removeMagazine(mag.id)} data-testid={`remove-${mag.id}`}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const TestProvider = ({ children }) => (
  <MagazineProvider initialMagazines={mockMagazines}>
    {children}
  </MagazineProvider>
)

describe('MagazineContext', () => {
  it('provides initial magazines', () => {
    render(
      <TestProvider>
        <TestComponent />
      </TestProvider>
    )
    expect(screen.getByTestId('magazine-1')).toBeInTheDocument()
    expect(screen.getByTestId('magazine-2')).toBeInTheDocument()
    expect(screen.getByTestId('magazine-3')).toBeInTheDocument()
  })

  it('removeMagazine removes a magazine by id', () => {
    render(
      <TestProvider>
        <TestComponent />
      </TestProvider>
    )
    
    expect(screen.getByTestId('magazine-1')).toBeInTheDocument()
    
    fireEvent.click(screen.getByTestId('remove-1'))
    
    expect(screen.queryByTestId('magazine-1')).not.toBeInTheDocument()
    expect(screen.getByTestId('magazine-2')).toBeInTheDocument()
    expect(screen.getByTestId('magazine-3')).toBeInTheDocument()
  })

  it('maintains state across re-renders', () => {
    const { rerender } = render(
      <TestProvider>
        <TestComponent />
      </TestProvider>
    )
    
    expect(screen.getByTestId('magazine-1')).toBeInTheDocument()
    
    rerender(
      <TestProvider>
        <TestComponent />
      </TestProvider>
    )
    
    expect(screen.getByTestId('magazine-1')).toBeInTheDocument()
  })
})