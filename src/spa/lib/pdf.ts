/**
 * PDF mínimo de una sola página con líneas de texto, para "Descargar mis datos".
 * Usa la fuente Helvetica del lector con codificación WinAnsi (cubre el español).
 */
const MAX_LINES = 50
const LINE_LENGTH = 85

/** Parte las líneas largas por palabras para que no se salgan de la página. */
export function wrapLine(line: string, length = LINE_LENGTH): string[] {
  const out: string[] = []
  let current = ''
  for (const word of line.split(' ')) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= length) {
      current = next
      continue
    }
    if (current) out.push(current)
    current = word
    while (current.length > length) {
      out.push(current.slice(0, length))
      current = current.slice(length)
    }
  }
  out.push(current)
  return out
}

/** Escapa los caracteres con significado en PDF y descarta los que WinAnsi no tiene. */
function escapeText(text: string): string {
  return text.replace(/[^\x20-\x7e\xa0-\xff]/g, '?').replace(/[\\()]/g, '\\$&')
}

export function buildTextPdf(title: string, lines: string[]): Uint8Array<ArrayBuffer> {
  const body = lines.flatMap((l) => wrapLine(l)).slice(0, MAX_LINES)
  const content = [
    'BT /F1 18 Tf 56 780 Td',
    `(${escapeText(title)}) Tj`,
    '/F1 11 Tf 0 -16 TD',
    ...body.map((l) => `0 -14 Td (${escapeText(l)}) Tj`),
    'ET',
  ].join('\n')

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ]

  // Todo el texto es de un byte por carácter: las posiciones en bytes coinciden con las de la cadena
  let pdf = '%PDF-1.4\n'
  const offsets = objects.map((object, i) => {
    const offset = pdf.length
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`
    return offset
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`

  return Uint8Array.from(pdf, (char) => char.charCodeAt(0))
}
