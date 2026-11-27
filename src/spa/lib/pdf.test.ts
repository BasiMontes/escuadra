import { describe, expect, it } from 'bun:test'
import { buildTextPdf, wrapLine } from './pdf'

const decode = (bytes: Uint8Array) => Array.from(bytes, (b) => String.fromCharCode(b)).join('')

describe('buildTextPdf', () => {
  it('genera un documento con cabecera y final de PDF', () => {
    const pdf = decode(buildTextPdf('Mis datos', ['Usuario: BasiMontes']))
    expect(pdf.startsWith('%PDF-1.4')).toBe(true)
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true)
    expect(pdf).toContain('(Usuario: BasiMontes) Tj')
  })

  it('conserva las tildes y escapa paréntesis y barras', () => {
    const pdf = decode(buildTextPdf('Título', ['Biografía (año) \\ ¡sí!']))
    expect(pdf).toContain('(Biografía \\(año\\) \\\\ ¡sí!) Tj')
  })

  it('sustituye lo que no puede escribir', () => {
    expect(decode(buildTextPdf('x', ['Gol ⚽']))).toContain('(Gol ?) Tj')
  })

  it('apunta cada entrada de la tabla a su objeto', () => {
    const pdf = decode(buildTextPdf('Título', ['á', 'é']))
    const offsets = [...pdf.matchAll(/^(\d{10}) 00000 n /gm)].map((m) => Number(m[1]))
    offsets.forEach((offset, i) => expect(pdf.slice(offset).startsWith(`${i + 1} 0 obj`)).toBe(true))
    expect(pdf.slice(Number(/startxref\n(\d+)/.exec(pdf)![1])).startsWith('xref')).toBe(true)
  })
})

describe('wrapLine', () => {
  it('parte por palabras', () => {
    expect(wrapLine('uno dos tres', 7)).toEqual(['uno dos', 'tres'])
  })

  it('corta las palabras que no caben', () => {
    expect(wrapLine('abcdefgh', 3)).toEqual(['abc', 'def', 'gh'])
  })
})
