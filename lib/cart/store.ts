'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mergeLine, setLineQty } from './totals'
import { MAX_LINES, type CartLine } from './types'

type CartState = {
  lines: CartLine[]
  expanded: boolean
  /** Метка последнего добавления — по ней HUD показывает кадр реакции */
  pulseAt: number
  /** До восстановления из localStorage считать корзину пустой нельзя */
  hydrated: boolean
  add: (productId: string, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  remove: (productId: string) => void
  clear: () => void
  setExpanded: (value: boolean) => void
  toggleExpanded: () => void
  prune: (knownIds: string[]) => void
  setHydrated: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      expanded: false,
      pulseAt: 0,
      hydrated: false,

      add: (productId, qty = 1) => {
        const { lines } = get()
        const isNew = !lines.some((l) => l.productId === productId)
        if (isNew && lines.length >= MAX_LINES) return
        set({ lines: mergeLine(lines, productId, qty), pulseAt: Date.now() })
      },

      setQty: (productId, qty) => set({ lines: setLineQty(get().lines, productId, qty) }),
      remove: (productId) => set({ lines: get().lines.filter((l) => l.productId !== productId) }),
      clear: () => set({ lines: [], expanded: false }),
      setExpanded: (expanded) => set({ expanded }),
      toggleExpanded: () => set({ expanded: !get().expanded }),

      /** Товар мог быть удалён или снят с публикации, пока корзина лежала в хранилище */
      prune: (knownIds) => {
        const known = new Set(knownIds)
        const lines = get().lines.filter((l) => known.has(l.productId))
        if (lines.length !== get().lines.length) set({ lines })
      },

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'mangal-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Разворачивание панели и вспышка — не состояние корзины, их не храним
      partialize: (state) => ({ lines: state.lines }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
)
