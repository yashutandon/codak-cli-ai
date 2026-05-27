/**
 * slot-registry.ts
 *
 * Singleton slot registry for the app.
 * Call `initRegistry(renderer)` once at app entry before rendering.
 */

import type { CliRenderer } from "@opentui/core"
import { createReactSlotRegistry, createSlot, type ReactPlugin } from "@opentui/react"

export type AppSlots = {
  statusbar_left: { model: string; interactionMode: string }
  statusbar_right: { model: string; interactionMode: string }
}

export interface AppContext {
  appName: string
  version: string
}

export const appContext: AppContext = {
  appName: "codak-cli",
  version: "1.0.0",
}

type AppRegistry = ReturnType<typeof createReactSlotRegistry<AppSlots, AppContext>>

let _registry: AppRegistry | null = null

export function initRegistry(renderer: CliRenderer): AppRegistry {
  if (_registry) return _registry

  _registry = createReactSlotRegistry<AppSlots, AppContext>(renderer, appContext, {
    onPluginError(event) {
      console.error(
        `[plugin-error] id=${event.pluginId} slot=${event.slot ?? "—"} phase=${event.phase}: ${event.error.message}`,
      )
    },
  })

  return _registry
}

export function getRegistry(): AppRegistry {
  if (!_registry) {
    throw new Error("initRegistry(renderer) must be called before getRegistry()")
  }
  return _registry
}

export function getAppSlot() {
  return createSlot<AppSlots, AppContext>(getRegistry(), {
    pluginFailurePlaceholder(failure) {
      return `⚠ ${failure.pluginId}`
    },
  })
}

export type AppPlugin = ReactPlugin<AppSlots, AppContext>