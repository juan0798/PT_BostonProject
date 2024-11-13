import { createApp } from 'vue';
import App from './App.vue';
import BootstrapVue3 from 'bootstrap-vue-3';
import router from './router';
import axios from 'axios';
import VueAxios from 'vue-axios';


const app = createApp(App)

// Usar el plugin BootstrapVue3
app.use(BootstrapVue3);

// Usar VueAxios con Axios
app.use(VueAxios, axios);

// Agregar la URL base de la API con Axios
axios.defaults.baseURL = 'http://localhost:3000';

// Usar el router
app.use(router);

// Montar la aplicación
app.mount('#app');

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'