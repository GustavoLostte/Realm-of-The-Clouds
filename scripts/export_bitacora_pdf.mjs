import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const ARTIFACT_MD_PATH = '/Users/wizzard/.gemini/antigravity-ide/brain/d34ecec4-709c-4f3e-9094-979847e056ed/bitacora_entrega_version.md'
const DESKTOP_PDF_PATH = '/Users/wizzard/Desktop/Bitacora_Entrega_TOC_FOE_v1.2.0.pdf'
const PROJECT_PDF_PATH = '/Users/wizzard/Desktop/TOC FOE/Bitacora_Entrega_TOC_FOE_v1.2.0.pdf'
const TEMP_HTML_PATH = '/tmp/bitacora_toc_foe.html'

async function main() {
  console.log('📖 Leyendo archivo markdown de la bitácora...')
  if (!fs.existsSync(ARTIFACT_MD_PATH)) {
    console.error('No se encontró el archivo:', ARTIFACT_MD_PATH)
    process.exit(1)
  }

  const mdContent = fs.readFileSync(ARTIFACT_MD_PATH, 'utf-8')

  // Convert markdown to HTML using marked via npx or import
  console.log('⚙️ Parseando markdown con marked...')
  const markedHtml = execSync('npx -y marked', { input: mdContent, encoding: 'utf-8' })

  const styledHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Bitácora de Entrega - Throne of Clans: Fall of Empires (TOC FOE)</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
      @bottom-right {
        content: counter(page);
      }
    }
    
    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      font-size: 13.5px;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    /* Cover / Header Section */
    h1 {
      color: #0f172a;
      font-size: 26px;
      margin-top: 0;
      margin-bottom: 8px;
      font-weight: 800;
      letter-spacing: -0.02em;
      border-bottom: 3px solid #d97706;
      padding-bottom: 10px;
    }

    h2 {
      color: #1e293b;
      font-size: 18px;
      font-weight: 700;
      margin-top: 26px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #e2e8f0;
      page-break-after: avoid;
    }

    h3 {
      color: #334155;
      font-size: 15px;
      font-weight: 600;
      margin-top: 18px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }

    p {
      margin-top: 0;
      margin-bottom: 10px;
      text-align: justify;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 12px;
      padding-left: 22px;
    }

    li {
      margin-bottom: 5px;
    }

    strong {
      color: #0f172a;
    }

    hr {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 20px 0;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12.5px;
      page-break-inside: avoid;
    }

    th, td {
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }

    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    /* Diagrams & Code blocks */
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 11.5px;
      line-height: 1.45;
      overflow-x: auto;
      page-break-inside: avoid;
      border-left: 4px solid #f59e0b;
    }

    code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 12px;
      background: #f1f5f9;
      padding: 2px 5px;
      border-radius: 4px;
      color: #b45309;
    }

    pre code {
      background: transparent;
      padding: 0;
      color: inherit;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }

    /* Print Specific */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      h1, h2, h3 {
        page-break-after: avoid;
      }
      table, pre {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${markedHtml}
</body>
</html>`

  fs.writeFileSync(TEMP_HTML_PATH, styledHtml, 'utf-8')
  console.log('✅ Archivo HTML estilizado generado en:', TEMP_HTML_PATH)

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  console.log('🚀 Compilando PDF mediante Chrome Headless...')

  const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${DESKTOP_PDF_PATH}" "${TEMP_HTML_PATH}"`
  execSync(cmd)

  // Copy also to project folder
  fs.copyFileSync(DESKTOP_PDF_PATH, PROJECT_PDF_PATH)

  console.log('🎉 ¡PDF generado con éxito!')
  console.log('📁 Ubicación 1 (Escritorio):', DESKTOP_PDF_PATH)
  console.log('📁 Ubicación 2 (Proyecto):', PROJECT_PDF_PATH)
}

main().catch(err => {
  console.error('Error generando PDF:', err)
  process.exit(1)
})
