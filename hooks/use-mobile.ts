import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    
    // Set state inside a timeout to avoid synchronous setState during effect setup
    const timeoutId = setTimeout(() => {
      if (isMobile !== (window.innerWidth < MOBILE_BREAKPOINT)) {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }
    }, 0)
    
    return () => {
      mql.removeEventListener("change", onChange)
      clearTimeout(timeoutId)
    }
  }, [isMobile])

  return !!isMobile
}
