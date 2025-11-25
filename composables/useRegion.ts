// composables/useRegion.ts
import { useCookie } from '#app'
import type { Region } from '~/utils/regions'
import { REGIONS } from '~/utils/regions'

const REGION_COOKIE_KEY = 'region'

export const useRegion = () => {
  const regionCookie = useCookie<string | null>(REGION_COOKIE_KEY, {
    sameSite: 'lax',
    path: '/',
  })

  const setRegion = (id: string) => {
    regionCookie.value = id
  }

  const getRegion = (): Region | null => {
    if (!regionCookie.value) return null
    return REGIONS.find(r => r.id === regionCookie.value) || null
  }

  return { regionCookie, setRegion, getRegion, REGIONS }
}
