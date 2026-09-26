// Script to count missing keys per locale
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

const usKeys = flattenKeys(us)
console.log(`Total US keys: ${usKeys.length}`)

const locales = { es, br, kr, cn }
for (const [code, locale] of Object.entries(locales)) {
  const missing = usKeys.filter(k => getNestedValue(locale, k) === undefined)
  console.log(`${code.toUpperCase()}: ${flattenKeys(locale).length} keys, MISSING ${missing.length}`)
}
