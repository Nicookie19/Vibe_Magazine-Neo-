import { describe, it, expect } from 'vitest'
import { hexToRgba } from './colorUtils'

describe('colorUtils', () => {
  describe('hexToRgba', () => {
    it('converts 6-digit hex to rgba', () => {
      expect(hexToRgba('#ff0000')).toBe('rgba(255, 0, 0, 1)')
      expect(hexToRgba('#00ff00')).toBe('rgba(0, 255, 0, 1)')
      expect(hexToRgba('#0000ff')).toBe('rgba(0, 0, 255, 1)')
      expect(hexToRgba('#ffffff')).toBe('rgba(255, 255, 255, 1)')
      expect(hexToRgba('#000000')).toBe('rgba(0, 0, 0, 1)')
    })

    it('converts 3-digit hex to rgba', () => {
      expect(hexToRgba('#f00')).toBe('rgba(255, 0, 0, 1)')
      expect(hexToRgba('#0f0')).toBe('rgba(0, 255, 0, 1)')
      expect(hexToRgba('#00f')).toBe('rgba(0, 0, 255, 1)')
    })

    it('handles custom alpha values', () => {
      expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)')
      expect(hexToRgba('#00ff00', 0)).toBe('rgba(0, 255, 0, 0)')
      expect(hexToRgba('#0000ff', 1)).toBe('rgba(0, 0, 255, 1)')
    })

    it('handles hex without # prefix', () => {
      expect(hexToRgba('ff0000')).toBe('rgba(255, 0, 0, 1)')
      expect(hexToRgba('f00')).toBe('rgba(255, 0, 0, 1)')
    })

    it('handles mixed case hex', () => {
      expect(hexToRgba('#FF0000')).toBe('rgba(255, 0, 0, 1)')
      expect(hexToRgba('#Ff0000')).toBe('rgba(255, 0, 0, 1)')
    })

    it('handles complex colors', () => {
      expect(hexToRgba('#4C1D95')).toBe('rgba(76, 29, 149, 1)')
      expect(hexToRgba('#3B1360')).toBe('rgba(59, 19, 96, 1)')
      expect(hexToRgba('#312E81')).toBe('rgba(49, 46, 129, 1)')
    })
  })
})