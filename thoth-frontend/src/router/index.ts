import {createRouter, createWebHistory} from "vue-router";
import PasteViewContainer from "../pages/_container/PasteViewContainer.vue";
import ViewPaste from "../pages/paste/ViewPaste.vue";
import ViewPasteFile from "../pages/paste/ViewPasteFile.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/",
            component: () => import("../pages/Index.vue")
        },
        {
            path: "/view/:id",
            component: PasteViewContainer,
            children: [
                {
                    path: "",
                    component: ViewPaste
                },
                {
                    path: ":file",
                    component: ViewPasteFile
                }
            ]
        }
    ]
})

export default router