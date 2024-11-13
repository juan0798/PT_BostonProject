<template>
  <div id="app">
    <!-- Barra de navegación visible para todos los usuarios autenticados -->
    <nav v-if="isAuthenticated">
      <ul>
        <!-- Opciones solo visibles para los administradores -->
        <li v-if="userRole === 'admin'">
          <router-link to="/admin/entities">Gestión de Entidades</router-link>
        </li>
        <li v-if="userRole === 'admin'">
          <router-link to="/admin/users">Gestión de Usuarios</router-link>
        </li>
        <li v-if="userRole === 'admin'">
          <router-link to="/admin/EntityLogs">Movimientos</router-link>
        </li>
        <li v-if="userRole === 'admin'">
          <router-link to="/admin/dashboard">Estadísticas</router-link>
        </li>
        
        <!-- Opción para cerrar sesión -->
        <li>
          <router-link to="/auth" @click="logout">Cerrar Sesión</router-link>
        </li>
      </ul>
    </nav>

    <!-- Renderiza las vistas de las rutas -->
    <router-view v-if="isAuthChecked"></router-view>
  </div>
</template>

<script>
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export default {
  name: 'App',
  data() {
    return {
      isAuthenticated: false,
      isAuthChecked: false, 
      userRole: '' 
    };
  },
  created() {
    // Verifica el estado de autenticación al iniciar la aplicación
    onAuthStateChanged(auth, async (user) => {
      this.isAuthenticated = !!user; 
      this.isAuthChecked = true; 
      if (user) {
        // Obtén el documento del usuario en la colección 'usuarios' de Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          this.userRole = userData.type; // Guarda el rol del usuario
          
          // Redirige al dashboard si es un usuario admin
          if (this.userRole === 'admin') {
            if (this.$route.path === '/auth') {
              this.$router.push('/admin/entities'); // Redirige al control de entidades si está autenticado
            }
          } else if (this.$route.path !== '/auth') {
            this.$router.push('/surveillance'); // Redirige al área de vigilancia si es un vigilante
          }
        } else {
          this.userRole = ''; // No encontrado
          this.$router.push('/auth');
        }
      } else {
        this.$router.push('/auth'); // Redirige a /auth si no está autenticado
      }
    });

    // Incrementa el contador de pestañas abiertas
    if (!sessionStorage.getItem('tabsOpen')) {
      sessionStorage.setItem('tabsOpen', '1');
    } else {
      sessionStorage.setItem('tabsOpen', parseInt(sessionStorage.getItem('tabsOpen')) + 1);
    }

    // Cierra sesión solo cuando la última pestaña se cierra
    window.addEventListener('beforeunload', this.handleTabClose);
  },
  unmounted() {
    // Decrementa el contador de pestañas abiertas cuando se cierra esta pestaña
    if (sessionStorage.getItem('tabsOpen') > 1) {
      sessionStorage.setItem('tabsOpen', parseInt(sessionStorage.getItem('tabsOpen')) - 1);
    } else {
      this.logout();
    }
    window.removeEventListener('beforeunload', this.handleTabClose);
  },
  methods: {
    async logout() {
      // Cierra la sesión y redirige a la página de autenticación
      await signOut(auth);
      this.$router.push('/auth');
    },
    handleTabClose() {
      // Solo cierra sesión si esta es la última pestaña abierta
      if (sessionStorage.getItem('tabsOpen') === '1') {
        this.logout();
      }
    }
  }
};
</script>

<style scoped>
/* Estilos globales para el app */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
}

nav {
  margin-bottom: 20px;
}

nav ul {
  list-style-type: none;
  padding: 0;
  display: flex;
}

nav li {
  margin-right: 15px;
}

nav a {
  text-decoration: none;
  color: #42b983;
  font-weight: bold;
}

nav a:hover {
  text-decoration: underline;
}
</style>
