import {createRouter, RouteRecordRaw, createWebHistory} from "vue-router";
import PitchComponent from './pages/pitch/index.vue' 

const routes: RouteRecordRaw[] = [
  {
    path: '',
    component: PitchComponent
  },
  {
    path: '/game',
    component: ()=>import('./pages/game/index.vue')
  },
  {
    path: '/watch',
    props: {isWatch: true},
    component: ()=>import('./pages/game/index.vue')
  }
]

export default createRouter({
  history: createWebHistory(),
  routes, 
})
