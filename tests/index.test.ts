import { describe, it, expect, vi } from 'vitest'
import { main } from '../src/index'

describe('main', () => {
  it('logs startup message', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    main()
    expect(spy).toHaveBeenCalledWith('Daily Briefing Bot started.')
    spy.mockRestore()
  })
})
