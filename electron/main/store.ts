import Store from 'electron-store'

export interface AppStoreSchema {
  windowBounds: {
    width: number
    height: number
    x?: number
    y?: number
  }
  preferences: Record<string, unknown>
}

const store = new Store<AppStoreSchema>({
  defaults: {
    windowBounds: {
      width: 800,
      height: 600
    },
    preferences: {}
  }
})

export { store }
