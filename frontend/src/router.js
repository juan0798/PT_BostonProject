import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import AuthView from './views/AuthView.vue';
import Surveillance from './views/Surveillance.vue';
import EntityDetail from './views/EntityDetail.vue';
import UserManagement from './views/UserManagement.vue';
import EntityLogs from './views/EntityLogs.vue';
import dashboard from './views/dashboard.vue';


const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView
    },
    {
        path: '/auth',
        name: 'authentication',
        component: AuthView
    },
    {
        path: '/surveillance',
        name: 'Registro de eventos',
        component: Surveillance
    },
    {
        path: '/admin/entities',
        name: 'Control de entidades',
        component: EntityDetail
    },
    {
        path: '/admin/users',
        name: 'Control de usuarios',
        component: UserManagement
    },
    {
        path: '/admin/Entitylogs',
        name: 'Registro de movimientos',
        component: EntityLogs
    },
    {
        path: '/admin/dashboard',
        name: 'Estadísticas',
        component: dashboard
    }
];

const router = createRouter({
    history: createWebHistory('/'),
    routes
});

export default router;
