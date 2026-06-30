import '@testing-library/jest-dom'

// Mock next/navigation — necesario para componentes que usan useRouter/usePathname
vi.mock('next/navigation', () => ({
  useRouter:   () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
  redirect:    vi.fn(),
}))

// Mock next/headers — necesario para server components en tests
vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set:    vi.fn(),
    get:    vi.fn(),
  }),
}))

// Silenciar console.error en tests (mantener console.log visible)
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suprimir warnings conocidos de React Testing Library
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return
    originalError(...args)
  }
})
afterAll(() => { console.error = originalError })
