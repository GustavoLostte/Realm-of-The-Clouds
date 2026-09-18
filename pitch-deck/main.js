// Realm of Kingdoms - Pitch Deck Interactive Script
// Developed by WizzarDev Studios

document.addEventListener('DOMContentLoaded', () => {
  // Update year
  const yearEl = document.getElementById('current-year')
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear()
  }

  // Copy Email Functionality
  const copyBtn = document.getElementById('btn-copy-email')
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault()
      const email = 'kalellostte@gmail.com'
      navigator.clipboard.writeText(email).then(() => {
        const originalText = copyBtn.innerHTML
        copyBtn.innerHTML = '<span>✓ Copiado al portapapeles</span>'
        copyBtn.style.borderColor = '#34d399'
        copyBtn.style.color = '#34d399'
        setTimeout(() => {
          copyBtn.innerHTML = originalText
          copyBtn.style.borderColor = ''
          copyBtn.style.color = ''
        }, 2500)
      })
    })
  }

  // Header scroll blur effect
  const header = document.querySelector('.site-header')
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.style.background = 'rgba(6, 8, 13, 0.95)'
      header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)'
    } else {
      header.style.background = 'rgba(6, 8, 13, 0.85)'
      header.style.boxShadow = 'none'
    }
  }, { passive: true })
})
