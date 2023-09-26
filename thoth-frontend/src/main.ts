import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import {createNotificationsPlugin} from "./plugins/notifications.plugin.ts";
import router from "./router";


createApp(App)
    .use(router)
    .use(createNotificationsPlugin())
    .mount('#app')
