// Realm of Kingdoms - Interactive Investor Slide Deck
// Developed by WizzarDev Studios (Founder: Gustavo / Wizzard)

let currentSlide = 0
const slides = document.querySelectorAll('.slide')
const totalSlides = slides.length

const categoryEl = document.getElementById('slide-category')
const counterEl = document.getElementById('slide-counter')
const dotsContainer = document.getElementById('deck-dots')
const btnPrev = document.getElementById('btn-prev')
const btnNext = document.getElementById('btn-next')

// Initialize progress dots
function initDots() {
  if (!dotsContainer) return
  dotsContainer.innerHTML = ''
  slides.forEach((_, idx) => {
    const dot = document.createElement('div')
    dot.className = `dot ${idx === 0 ? 'active' : ''}`
    dot.title = `Go to Slide ${idx + 1}`
    dot.addEventListener('click', () => goToSlide(idx))
    dotsContainer.appendChild(dot)
  })
}

// Pause any active videos when navigating away
function pauseVideos() {
  document.querySelectorAll('video').forEach((v) => {
    try {
      v.pause()
    } catch {}
  })
}

// Update slide display
function goToSlide(index) {
  if (index < 0 || index >= totalSlides) return
  pauseVideos()

  slides[currentSlide].classList.remove('active')
  currentSlide = index
  slides[currentSlide].classList.add('active')

  // Update Category Badge & Counter
  const category = slides[currentSlide].getAttribute('data-category') || `SLIDE ${currentSlide + 1}`
  if (categoryEl) categoryEl.textContent = category
  if (counterEl) counterEl.textContent = `${currentSlide + 1} / ${totalSlides}`

  // Update Dots
  if (dotsContainer) {
    const dots = dotsContainer.querySelectorAll('.dot')
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlide)
    })
  }

  // Update Button States
  if (btnPrev) btnPrev.disabled = currentSlide === 0
  if (btnNext) btnNext.disabled = currentSlide === totalSlides - 1

  // Update URL Hash
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

// Keyboard Navigation
window.addEventListener('keydown', (e) => {
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

// Touch Swipe Navigation for Mobile Devices
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

// Copy Email Functionality
document.addEventListener('DOMContentLoaded', () => {
  initDots()

  // Handle direct hash navigation (#slide-3)
  if (window.location.hash) {
    const match = window.location.hash.match(/slide-(\d+)/)
    if (match && match[1]) {
      const targetIndex = parseInt(match[1], 10) - 1
      if (targetIndex >= 0 && targetIndex < totalSlides) {
        goToSlide(targetIndex)
      }
    }
  }

  // Copy email with feedback
  const copyBtn = document.getElementById('copy-email-btn')
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault()
      const email = 'kalellostte@gmail.com'
      navigator.clipboard.writeText(email).then(() => {
        const valEl = document.getElementById('email-text')
        if (valEl) {
          const original = valEl.textContent
          valEl.textContent = '✓ Copied!'
          valEl.style.color = '#34d399'
          setTimeout(() => {
            valEl.textContent = original
            valEl.style.color = ''
          }, 2000)
        }
      })
    })
  }
})
