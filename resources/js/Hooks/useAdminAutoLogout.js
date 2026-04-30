import { useCallback, useEffect, useRef, useState } from 'react'

const WARNING_AFTER_MS = 18 * 60 * 1000
const LOGOUT_AFTER_MS = 20 * 60 * 1000
const LOGOUT_COUNTDOWN_SECONDS = 120
const ACTIVITY_STORAGE_KEY = 'admin_last_activity_at'
const LOGOUT_STORAGE_KEY = 'admin_force_logout_at'
const BROADCAST_CHANNEL_NAME = 'admin-auth-events'

const readCsrfToken = () => {
  const meta = document.querySelector('meta[name="csrf-token"]')
  return meta?.getAttribute('content') || ''
}

const clearAdminClientState = () => {
  const removablePrefixes = ['admin_', 'auth_']
  const removableKeys = ['token', 'auth_token', 'admin_data', 'user']

  Object.keys(localStorage).forEach((key) => {
    if (removableKeys.includes(key) || removablePrefixes.some((prefix) => key.startsWith(prefix))) {
      localStorage.removeItem(key)
    }
  })
}

export default function useAdminAutoLogout() {
  const [showWarning, setShowWarning] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(LOGOUT_COUNTDOWN_SECONDS)

  const warningTimeoutRef = useRef(null)
  const logoutTimeoutRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const lastActivityWriteRef = useRef(0)
  const isLoggingOutRef = useRef(false)
  const channelRef = useRef(null)

  const clearTimers = useCallback(() => {
    if (warningTimeoutRef.current) window.clearTimeout(warningTimeoutRef.current)
    if (logoutTimeoutRef.current) window.clearTimeout(logoutTimeoutRef.current)
    if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current)
    warningTimeoutRef.current = null
    logoutTimeoutRef.current = null
    countdownIntervalRef.current = null
  }, [])

  const performLogout = useCallback(async (reason = 'timeout') => {
    if (isLoggingOutRef.current) return
    isLoggingOutRef.current = true

    clearTimers()
    setShowWarning(false)
    setCountdownSeconds(LOGOUT_COUNTDOWN_SECONDS)

    const at = Date.now()
    localStorage.setItem(LOGOUT_STORAGE_KEY, JSON.stringify({ at, reason }))
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'logout', at, reason })
    }

    const csrf = readCsrfToken()

    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrf,
        },
      })
    } catch (_) {
      // Continue logout flow even if API logout fails.
    }

    try {
      await fetch('/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrf,
        },
      })
    } catch (_) {
      // Continue with client-side cleanup and redirect.
    }

    clearAdminClientState()
    window.location.assign('/admin/login')
  }, [clearTimers])

  const scheduleFromTimestamp = useCallback((lastActivityAt) => {
    clearTimers()

    const elapsed = Date.now() - lastActivityAt
    const warningDelay = Math.max(0, WARNING_AFTER_MS - elapsed)
    const logoutDelay = Math.max(0, LOGOUT_AFTER_MS - elapsed)

    if (logoutDelay <= 0) {
      performLogout('timeout')
      return
    }

    if (warningDelay <= 0) {
      setShowWarning(true)
      setCountdownSeconds(Math.max(1, Math.ceil(logoutDelay / 1000)))
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdownSeconds((prev) => Math.max(0, prev - 1))
      }, 1000)
    } else {
      setShowWarning(false)
      setCountdownSeconds(LOGOUT_COUNTDOWN_SECONDS)
      warningTimeoutRef.current = window.setTimeout(() => {
        setShowWarning(true)
        setCountdownSeconds(LOGOUT_COUNTDOWN_SECONDS)
        countdownIntervalRef.current = window.setInterval(() => {
          setCountdownSeconds((prev) => Math.max(0, prev - 1))
        }, 1000)
      }, warningDelay)
    }

    logoutTimeoutRef.current = window.setTimeout(() => {
      performLogout('timeout')
    }, logoutDelay)
  }, [clearTimers, performLogout])

  const stampActivity = useCallback((force = false) => {
    const now = Date.now()
    if (!force && now - lastActivityWriteRef.current < 1000) return
    lastActivityWriteRef.current = now
    localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now))
    scheduleFromTimestamp(now)
  }, [scheduleFromTimestamp])

  const stayLoggedIn = useCallback(() => {
    stampActivity(true)
  }, [stampActivity])

  const logoutNow = useCallback(() => {
    performLogout('manual')
  }, [performLogout])

  useEffect(() => {
    channelRef.current = 'BroadcastChannel' in window ? new BroadcastChannel(BROADCAST_CHANNEL_NAME) : null

    const initialTs = Number(localStorage.getItem(ACTIVITY_STORAGE_KEY)) || Date.now()
    localStorage.setItem(ACTIVITY_STORAGE_KEY, String(initialTs))
    scheduleFromTimestamp(initialTs)

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll']
    const onActivity = () => stampActivity()
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, onActivity, { passive: true })
    })

    const onStorage = (event) => {
      if (event.key === ACTIVITY_STORAGE_KEY && event.newValue) {
        const ts = Number(event.newValue)
        if (ts) scheduleFromTimestamp(ts)
      }

      if (event.key === LOGOUT_STORAGE_KEY && event.newValue) {
        clearAdminClientState()
        window.location.assign('/admin/login')
      }
    }

    const onBroadcast = (event) => {
      if (event?.data?.type === 'logout') {
        clearAdminClientState()
        window.location.assign('/admin/login')
      }
    }

    window.addEventListener('storage', onStorage)
    channelRef.current?.addEventListener('message', onBroadcast)

    return () => {
      clearTimers()
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, onActivity)
      })
      window.removeEventListener('storage', onStorage)
      channelRef.current?.removeEventListener('message', onBroadcast)
      channelRef.current?.close()
      channelRef.current = null
    }
  }, [clearTimers, scheduleFromTimestamp, stampActivity])

  return {
    showWarning,
    countdownSeconds,
    stayLoggedIn,
    logoutNow,
  }
}
