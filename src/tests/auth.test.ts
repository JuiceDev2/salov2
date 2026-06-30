import { describe, it, expect } from 'vitest'
import { getDashboardByRol } from '@/lib/auth'
import type { Rol } from '@/types'

describe('getDashboardByRol', () => {
  it('propietaria va a /propietaria', () => {
    expect(getDashboardByRol('propietaria')).toBe('/propietaria')
  })

  it('admin va a /admin', () => {
    expect(getDashboardByRol('admin')).toBe('/admin')
  })

  it('estilista va a /estilista', () => {
    expect(getDashboardByRol('estilista')).toBe('/estilista')
  })

  it('retorna string con / inicial para todos los roles', () => {
    const roles: Rol[] = ['propietaria', 'admin', 'estilista']
    roles.forEach(rol => {
      expect(getDashboardByRol(rol).startsWith('/')).toBe(true)
    })
  })
})
