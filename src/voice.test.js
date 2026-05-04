import { describe, it, expect } from 'vitest'
import { parseCommand } from './voice.js'

describe('parseCommand', () => {
  it('should parse "agregar leche" as add action', () => {
    const result = parseCommand('agregar leche')
    expect(result.action).toBe('add')
    expect(result.item).toBe('leche')
    expect(result.category).toBeNull()
  })

  it('should parse "ok lista agregar leche" with trigger', () => {
    const result = parseCommand('ok lista agregar leche')
    expect(result.action).toBe('add')
    expect(result.item).toBe('leche')
  })

  it('should extract category from command', () => {
    const result = parseCommand('agregar manzanas frutas')
    expect(result.action).toBe('add')
    expect(result.category).toBe('frutas')
    // Note: item keeps original form, not singularized
  })

  it('should handle "ok lista" trigger only', () => {
    const result = parseCommand('ok lista')
    expect(result).toBeNull()
  })

  it('should default to add when no action specified', () => {
    const result = parseCommand('leche')
    expect(result.action).toBe('add')
    expect(result.item).toBe('leche')
  })

  it('should parse "marcar leche" as mark action', () => {
    const result = parseCommand('marcar leche')
    expect(result.action).toBe('mark')
    expect(result.item).toBe('leche')
  })

  it('should handle category "verduras" as "frutas"', () => {
    const result = parseCommand('agregar lechuga verduras')
    expect(result.category).toBe('frutas')
  })

  it('should normalize trigger case insensitive', () => {
    const result = parseCommand('OK LISTA agregar pan')
    expect(result.action).toBe('add')
    expect(result.item).toBe('pan')
  })

  it('should handle "ok lista, agregar pan" with comma', () => {
    const result = parseCommand('ok lista, agregar pan')
    expect(result.action).toBe('add')
    expect(result.item).toBe('pan')
  })

  it('should extract category "carnes"', () => {
    const result = parseCommand('agregar pollo carnes')
    expect(result.category).toBe('carnes')
    expect(result.item).toBe('pollo')
  })

  it('should extract category "lacteos"', () => {
    const result = parseCommand('agregar leche lacteos')
    expect(result.category).toBe('lacteos')
  })

  it('should handle multiple words in item name', () => {
    const result = parseCommand('agregar leche condensada')
    expect(result.action).toBe('add')
    expect(result.item).toBe('leche condensada')
  })

  it('should handle category with "s" suffix', () => {
    const result = parseCommand('agregar manzanas frutass')
    expect(result.category).toBe('frutas')
  })

  it('should handle single word category extraction', () => {
    const result = parseCommand('agregar pan general')
    expect(result.action).toBe('add')
    expect(result.item).toBe('pan')
    expect(result.category).toBe('general')
  })
})