import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase, auth, ADMIN_UUID, SUPER_ADMIN_UUID } from './supabaseClient'

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    functions: {
      invoke: vi.fn(),
    },
    rpc: vi.fn(),
  }),
}))

describe('supabaseClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports ADMIN_UUID constant', () => {
    expect(ADMIN_UUID).toBe('cf6f292d-9800-49d6-b7ff-bc733067ca99')
  })

  it('exports SUPER_ADMIN_UUID constant', () => {
    expect(SUPER_ADMIN_UUID).toBe('5314c060-f221-4bf8-a63e-4b80cd8fa648')
  })

  it('exports supabase client', () => {
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
    expect(supabase.from).toBeDefined()
    expect(supabase.functions).toBeDefined()
    expect(supabase.rpc).toBeDefined()
  })

  describe('auth helpers', () => {
    it('exports auth object with all methods', () => {
      expect(auth.signIn).toBeDefined()
      expect(auth.signInWithGoogle).toBeDefined()
      expect(auth.signOut).toBeDefined()
      expect(auth.getCurrentUser).toBeDefined()
      expect(auth.getUserRole).toBeDefined()
      expect(auth.createUser).toBeDefined()
      expect(auth.createSuperAdmin).toBeDefined()
      expect(auth.getAllSuperAdmins).toBeDefined()
    })

    it('signIn calls supabase.auth.signInWithPassword', async () => {
      const mockSignIn = vi.fn().mockResolvedValue({ data: { user: {} }, error: null })
      supabase.auth.signInWithPassword = mockSignIn

      await auth.signIn('test@example.com', 'password')

      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      })
    })

    it('signInWithGoogle calls supabase.auth.signInWithOAuth', async () => {
      const mockOAuth = vi.fn().mockResolvedValue({ data: {}, error: null })
      supabase.auth.signInWithOAuth = mockOAuth

      await auth.signInWithGoogle('http://localhost:3000/callback')

      expect(mockOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: 'http://localhost:3000/callback' },
      })
    })

    it('signOut calls supabase.auth.signOut and clears localStorage', async () => {
      const mockSignOut = vi.fn().mockResolvedValue({ error: null })
      supabase.auth.signOut = mockSignOut
      localStorage.setItem('vibeUser', 'test')
      localStorage.setItem('vibeRole', 'admin')

      await auth.signOut()

      expect(mockSignOut).toHaveBeenCalled()
      expect(localStorage.getItem('vibeUser')).toBeNull()
      expect(localStorage.getItem('vibeRole')).toBeNull()
    })

    it('getCurrentUser calls supabase.auth.getUser', async () => {
      const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null })
      supabase.auth.getUser = mockGetUser

      await auth.getCurrentUser()

      expect(mockGetUser).toHaveBeenCalled()
    })

    it('getUserRole queries user_profiles table', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
      supabase.from = vi.fn(() => ({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      }))

      await auth.getUserRole('user-123')

      expect(supabase.from).toHaveBeenCalledWith('user_profiles')
      expect(mockSelect).toHaveBeenCalledWith('role')
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123')
      expect(mockSingle).toHaveBeenCalled()
    })

    it('createUser invokes create-user function', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({ data: {}, error: null })
      supabase.functions.invoke = mockInvoke

      await auth.createUser('test@example.com', 'testuser', 'admin')

      expect(mockInvoke).toHaveBeenCalledWith('create-user', {
        body: { email: 'test@example.com', username: 'testuser', role: 'admin' },
      })
    })

    it('createSuperAdmin invokes create-superadmin function', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({ data: {}, error: null })
      supabase.functions.invoke = mockInvoke

      await auth.createSuperAdmin('test@example.com', 'testuser', 'Test User', 'password')

      expect(mockInvoke).toHaveBeenCalledWith('create-superadmin', {
        body: {
          email: 'test@example.com',
          username: 'testuser',
          display_name: 'Test User',
          password: 'password',
        },
      })
    })

    it('getAllSuperAdmins calls get_all_superadmins rpc', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null })
      supabase.rpc = mockRpc

      await auth.getAllSuperAdmins()

      expect(mockRpc).toHaveBeenCalledWith('get_all_superadmins')
    })
  })
})