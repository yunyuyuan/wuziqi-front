import {createRouter, RouteRecordRaw, createWebHashHistory} from "vue-router";
import PitchComponent from './pages/pitch/index.vue' 

const routes: RouteRecordRaw[] = [
  {
    path: '',
    component: PitchComponent
  },
  {
    path: '/game',
    props: true,
    component: import('./pages/game/index.vue')
  }
]

export default createRouter({
  history: createWebHashHistory(),
  routes, 
})
