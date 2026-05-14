import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock Tauri plugin shell
vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn(),
}));
