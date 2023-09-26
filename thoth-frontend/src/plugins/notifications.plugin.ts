import {Plugin, App, inject} from '@vue/runtime-core'
import {InjectionKey} from "vue";
import mitt, {Emitter} from "mitt";

const NOTIFICATIONS_INJECTION_KEY: InjectionKey<NotificationsPlugin> = Symbol('thoth_notifications')

export type NotificationType = 'success' | 'warn' | 'error' | 'info'
export const emitter: Emitter<{
    add: {
        type: NotificationType,
        text: string
    },
    remove: {
        id: number
    }
}> = mitt()

interface NotificationsPlugin {
    show(type: NotificationType, text: string): void
}

export const createNotificationsPlugin = (): Plugin => ({
    install: (app: App) => {
        app.provide(NOTIFICATIONS_INJECTION_KEY, {
            show(type: NotificationType, text: string) {
                emitter.emit('add', {
                    type, text
                })
            }
        } as NotificationsPlugin)
    }
})

export const useNotifications = () => inject(NOTIFICATIONS_INJECTION_KEY)!