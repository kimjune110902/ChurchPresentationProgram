import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'
import { useAppStore } from './store/useAppStore'
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({ success: false, message: 'No session' }),
}))
vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn(),
}))

describe('Authentication Flow', () => {
  beforeEach(() => {
    useAppStore.setState({
      auth: { isAuthenticated: false, user: null, login: vi.fn(), logout: vi.fn() },
    })
  })

  it('renders the login screen initially after loading', async () => {
    render(<App />)
    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/Professional Church Media Production/i)).toBeInTheDocument()
    })
  })

  it('validates email format before submission', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('+82 10 1234 5678 or email@example.com')).toBeInTheDocument()
    })

    const emailInput = screen.getByPlaceholderText('+82 10 1234 5678 or email@example.com')
    const loginButton = screen.getByText('Log In')

    // Type invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    const passwordInput = screen.getByPlaceholderText('••••••••')
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    // Login button should not be disabled because length requirement met, but click validation fails
    fireEvent.click(loginButton)
    expect(await screen.findByText('Please enter a valid email or phone number.')).toBeInTheDocument()
  })
})
