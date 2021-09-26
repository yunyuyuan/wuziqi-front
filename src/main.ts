import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/style/main.scss'
import createStore from './store'
import router from './route'

const app = createApp(App);

app.use(ElementPlus, {size: 'small'});
app.use(router);
createStore(app);
app.mount('#app')
