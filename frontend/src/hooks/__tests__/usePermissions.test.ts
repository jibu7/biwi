
import { renderHook } from '@testing-library/react';
import { usePermissions } from '@/hooks/usePermissions';
import * as authStore from '@/store/authStore';

jest.mock('@/store/authStore');

describe('usePermissions Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return permissions state', () => {
    (authStore.useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: {
        id: 1,
        email: 'test@example.com',
        role: 'admin'
      },
      permissions: ['read:items', 'write:items', 'delete:items']
    })

    const { result } = renderHook(() => usePermissions())

    expect(result.current).toBeDefined()
    expect(typeof result.current.hasPermission).toBe('function')
  })

  it('should check permissions correctly when user has permission', () => {
    (authStore.useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: {
        id: 1,
        email: 'test@example.com',
        role: 'admin'
      },
      permissions: ['read:items', 'write:items', 'delete:items']
    })

    const { result } = renderHook(() => usePermissions())

    if (result.current.hasPermission) {
      const hasReadPermission = result.current.hasPermission('read:items')
      expect(hasReadPermission).toBe(true)
    }
  })

  it('should return false when user lacks permission', () => {
    (authStore.useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: {
        id: 1,
        email: 'test@example.com',
        role: 'user'
      },
      permissions: ['read:items']
    })

    const { result } = renderHook(() => usePermissions())

    if (result.current.hasPermission) {
      const hasDeletePermission = result.current.hasPermission('delete:items')
      expect(hasDeletePermission).toBe(false)
    }
  })

  it('should handle null user state', () => {
    (authStore.useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: null,
      permissions: []
    })

    const { result } = renderHook(() => usePermissions())

    expect(result.current).toBeDefined()
    if (result.current.hasPermission) {
      const hasAnyPermission = result.current.hasPermission('read:items')
      expect(hasAnyPermission).toBe(false)
    }
  })
})
