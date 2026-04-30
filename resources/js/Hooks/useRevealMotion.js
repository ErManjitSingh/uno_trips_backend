import { useEffect } from 'react'

export default function useRevealMotion(selector = '[data-reveal]') {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll(selector))
    if (!nodes.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.animate(
            [
              { opacity: 0, transform: 'translateY(14px)' },
              { opacity: 1, transform: 'translateY(0px)' },
            ],
            { duration: 520, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' }
          )
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12 }
    )

    nodes.forEach((node) => {
      node.style.opacity = 0
      observer.observe(node)
    })

    return () => observer.disconnect()
  }, [selector])
}
