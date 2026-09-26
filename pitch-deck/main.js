// Realm of Kingdoms - Ultra-Vibrant Interactive Investor Slide Deck
// Developed by WizzarDev Studios (Founder: Gustavo / Wizzard)

let currentSlide = 0
let currentLang = 'en' // default English

const slides = document.querySelectorAll('.slide')
const totalSlides = slides.length

const counterEl = document.getElementById('slide-counter')
const dotsContainer = document.getElementById('deck-dots')

const btnPrev = document.getElementById('btn-prev')
const btnNext = document.getElementById('btn-next')
const sidePrev = document.getElementById('side-prev-btn')
const sideNext = document.getElementById('side-next-btn')

const topSegments = document.querySelectorAll('.top-progress-segment')
const tabsStrip = document.getElementById('deck-tabs')
const slideTabs = document.querySelectorAll('.deck-tab')

const langToggleBtn = document.getElementById('lang-toggle-btn')
const langFlag = document.getElementById('lang-flag')
const langText = document.getElementById('lang-text')

// ==================== INITIALIZE PROGRESS DOTS ====================
function initDots() {
  if (!dotsContainer) return
  dotsContainer.innerHTML = ''
  slides.forEach((_, idx) => {
    const dot = document.createElement('div')
    dot.className = `b-dot ${idx === 0 ? 'active' : ''}`
    dot.title = `Ir a diapositiva ${idx + 1}`
    dot.addEventListener('click', () => goToSlide(idx))
    dotsContainer.appendChild(dot)
  })
}

// ==================== TOP SEGMENTS CLICK LISTENERS ====================
topSegments.forEach((segment) => {
  segment.addEventListener('click', () => {
    const idx = parseInt(segment.getAttribute('data-index'), 10)
    if (!isNaN(idx)) goToSlide(idx)
  })
})

// ==================== TABS CLICK LISTENERS ====================
slideTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const idx = parseInt(tab.getAttribute('data-index'), 10)
    if (!isNaN(idx)) goToSlide(idx)
  })
})

// ==================== SIDE ARROWS CLICK LISTENERS ====================
if (sidePrev) sidePrev.addEventListener('click', prevSlide)
if (sideNext) sideNext.addEventListener('click', nextSlide)

// ==================== PAUSE VIDEOS ON SLIDE CHANGE ====================
function pauseVideos() {
  document.querySelectorAll('video').forEach((v) => {
    try {
      v.pause()
    } catch {}
  })
}

// ==================== SLIDE NAVIGATION CORE ====================
function goToSlide(index) {
  if (index < 0 || index >= totalSlides) return
  pauseVideos()

  slides[currentSlide].classList.remove('active')
  currentSlide = index
  slides[currentSlide].classList.add('active')

  // Update Slide Counter
  if (counterEl) {
    counterEl.textContent = `${currentSlide + 1} / ${totalSlides}`
  }

  // Update Dots
  if (dotsContainer) {
    const dots = dotsContainer.querySelectorAll('.b-dot')
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlide)
    })
  }

  // Update Top Progress Segments
  topSegments.forEach((seg, idx) => {
    seg.classList.remove('completed', 'active')
    if (idx < currentSlide) {
      seg.classList.add('completed')
    } else if (idx === currentSlide) {
      seg.classList.add('active')
    }
  })

  // Update Tabs Strip
  slideTabs.forEach((tab, idx) => {
    const isActive = idx === currentSlide
    tab.classList.toggle('active', isActive)
    if (isActive && tabsStrip) {
      tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  })

  // Update Navigation Buttons (Disabled state)
  const isFirst = currentSlide === 0
  const isLast = currentSlide === totalSlides - 1

  if (btnPrev) btnPrev.disabled = isFirst
  if (btnNext) btnNext.disabled = isLast
  if (sidePrev) sidePrev.disabled = isFirst
  if (sideNext) sideNext.disabled = isLast

  // Sync URL hash
  window.location.hash = `slide-${currentSlide + 1}`
}

function nextSlide() {
  if (currentSlide < totalSlides - 1) {
    goToSlide(currentSlide + 1)
  }
}

function prevSlide() {
  if (currentSlide > 0) {
    goToSlide(currentSlide - 1)
  }
}

// ==================== BILINGUAL LANGUAGE SWITCHER ====================
function setLanguage(lang) {
  currentLang = lang
  document.body.dataset.lang = lang
  document.documentElement.lang = lang

  // Update toggle button visuals
  if (langToggleBtn && langFlag && langText) {
    if (lang === 'en') {
      langFlag.textContent = '🇺🇸'
      langText.textContent = 'EN'
      langToggleBtn.title = 'Cambiar a Español'
    } else {
      langFlag.textContent = '🇪🇸'
      langText.textContent = 'ES'
      langToggleBtn.title = 'Switch to English'
    }
  }

  // Update all elements with data-es and data-en
  document.querySelectorAll('[data-es][data-en]').forEach((el) => {
    const translation = el.getAttribute(`data-${lang}`)
    if (translation) {
      el.textContent = translation
    }
  })

  localStorage.setItem('rok_deck_lang', lang)
}

if (langToggleBtn) {
  langToggleBtn.addEventListener('click', () => {
    setLanguage(currentLang === 'es' ? 'en' : 'es')
  })
}

// ==================== KEYBOARD NAVIGATION ====================
window.addEventListener('keydown', (e) => {
  if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase())) return

  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
    e.preventDefault()
    nextSlide()
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault()
    prevSlide()
  } else if (e.key === 'Home') {
    e.preventDefault()
    goToSlide(0)
  } else if (e.key === 'End') {
    e.preventDefault()
    goToSlide(totalSlides - 1)
  }
})

// ==================== TOUCH SWIPE NAVIGATION ====================
let touchStartX = 0
let touchEndX = 0

window.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX
}, { passive: true })

window.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX
  handleSwipe()
}, { passive: true })

function handleSwipe() {
  const swipeThreshold = 50
  if (touchEndX < touchStartX - swipeThreshold) {
    nextSlide() // Swipe left -> Next
  }
  if (touchEndX > touchStartX + swipeThreshold) {
    prevSlide() // Swipe right -> Prev
  }
}

// ==================== COPY EMAIL FUNCTIONALITY ====================
document.addEventListener('DOMContentLoaded', () => {
  initDots()

  // Default to English as primary language (with optional ?lang= query or localStorage)
  const urlParams = new URLSearchParams(window.location.search)
  const queryLang = urlParams.get('lang')
  const savedLang = queryLang || localStorage.getItem('rok_deck_lang') || 'en'
  setLanguage(savedLang === 'es' && !queryLang ? 'en' : savedLang)

  // Handle direct hash navigation (#slide-4)
  if (window.location.hash) {
    const match = window.location.hash.match(/slide-(\d+)/)
    if (match && match[1]) {
      const targetIndex = parseInt(match[1], 10) - 1
      if (targetIndex >= 0 && targetIndex < totalSlides) {
        goToSlide(targetIndex)
      }
    }
  } else {
    goToSlide(0)
  }

  // Copy email with animated feedback
  const copyBtn = document.getElementById('copy-email-btn')
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault()
      const email = 'kalellostte@gmail.com'
      navigator.clipboard.writeText(email).then(() => {
        const valEl = document.getElementById('email-text')
        const subEl = document.getElementById('email-sub-label')
        if (valEl) {
          const original = valEl.textContent
          valEl.textContent = currentLang === 'en' ? '✓ Copied to clipboard!' : '✓ ¡Copiado al portapapeles!'
          valEl.style.color = '#10b981'
          if (subEl) subEl.textContent = 'OK'
          setTimeout(() => {
            valEl.textContent = original
            valEl.style.color = ''
            if (subEl) subEl.textContent = currentLang === 'en' ? 'Email (Click to copy)' : 'Email (Clic para copiar)'
          }, 2500)
        }
      })
    })
  }
})
