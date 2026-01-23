import React from 'react'
import { render } from '@testing-library/react'
import { test, expect } from 'vitest'
import App from './App'

test('renders Sovereign OS app shell', () => {
  const { getByText, unmount } = render(<App />)
  expect(getByText(/Sovereign Life-Management OS/i)).toBeTruthy()
  unmount()
})
