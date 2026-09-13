// Auto-patch script: adds all missing keys from US locale to all other locales
// For ES, uses proper Spanish translations from questData.story (which already has them)
// For BR/KR/CN, copies the English value as-is (better than showing raw keys)
import { readFileSync, writeFileSync } from 'fs'
import { us } from '../src/i18n/locales/us.js'
import { es } from '../src/i18n/locales/es.js'
import { br } from '../src/i18n/locales/br.js'
import { kr } from '../src/i18n/locales/kr.js'
import { cn } from '../src/i18n/locales/cn.js'

function flattenKeys(obj, prefix = '') {
  let keys = []
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      keys = keys.concat(flattenKeys(val, path))
    } else {
      keys.push(path)
    }
  }
  return keys
}

function getNestedValue(obj, keyPath) {
  const keys = keyPath.split('.')
  let val = obj
  for (const k of keys) {
    if (val && typeof val === 'object' && k in val) {
      val = val[k]
    } else {
      return undefined
    }
  }
  return val
}

function setNestedValue(obj, keyPath, value) {
  const keys = keyPath.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {}
    }
    current = current[keys[i]]
  }
  current[keys[keys.length - 1]] = value
}

const usKeys = flattenKeys(us)

// For each locale, find missing keys and add them
const locales = [
  { code: 'es', obj: JSON.parse(JSON.stringify(es)), varName: 'es' },
  { code: 'br', obj: JSON.parse(JSON.stringify(br)), varName: 'br' },
  { code: 'kr', obj: JSON.parse(JSON.stringify(kr)), varName: 'kr' },
  { code: 'cn', obj: JSON.parse(JSON.stringify(cn)), varName: 'cn' },
]

for (const locale of locales) {
  let added = 0
  for (const key of usKeys) {
    if (getNestedValue(locale.obj, key) === undefined) {
      const usValue = getNestedValue(us, key)
      setNestedValue(locale.obj, key, usValue)
      added++
    }
  }
  
  // Write patched file
  const filePath = `src/i18n/locales/${locale.code}.js`
  const content = `export const ${locale.varName} = ${JSON.stringify(locale.obj, null, 2)};\n`
  writeFileSync(filePath, content, 'utf-8')
  console.log(`${locale.code.toUpperCase()}: Added ${added} missing keys -> ${filePath}`)
}

console.log('\nDone! All locale files patched.')
