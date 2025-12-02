const showToast = (message: string, backgroundColor: string, durationMs: number) => {
  const container = document.createElement('div')
  container.textContent = message
  Object.assign(container.style, {
    position: 'fixed',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 14px',
    borderRadius: '8px',
    color: '#fff',
    backgroundColor,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.35)',
    zIndex: '10000',
    fontSize: '14px',
    opacity: '0',
    transition: 'opacity 150ms ease',
    pointerEvents: 'none'
  })
  document.body.appendChild(container)
  requestAnimationFrame(() => { container.style.opacity = '0.95' })
  setTimeout(() => {
    container.style.opacity = '0'
    setTimeout(() => { container.remove() }, 180)
  }, durationMs)
}

export const showErrorToast = (message: string) => {
  showToast(message, '#DC2626', 3000)
}

export const showSuccessToast = (message: string) => {
  showToast(message, '#10B981', 2000)
}

export const showInfoToast = (message: string) => {
  showToast(message, '#3B82F6', 2000)
}

