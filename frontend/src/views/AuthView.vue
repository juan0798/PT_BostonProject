<template>
  <div class="auth-container">
    <h1>Iniciar Sesión</h1>
    <form @submit.prevent="login">
      <div class="input-group">
        <label for="email">Correo Electrónico</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div class="input-group">
        <label for="password">Contraseña</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit">Ingresar</button>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script>
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default {
  name: 'AuthView',
  data() {
    return {
      email: '',
      password: '',
      errorMessage: ''
    };
  },
  methods: {
    async login() {
      try {
        // Configura la persistencia de la sesión antes de iniciar sesión
        await setPersistence(auth, browserSessionPersistence); // Configura la persistencia para esta sesión

        // Autentica al usuario con email y contraseña
        const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
        const userId = userCredential.user.uid;

        // Obtén el documento del usuario en la colección 'usuarios' de Firestore
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Verifica el rol y redirige según corresponda
          if (userData.type === 'admin') {
            this.$router.push('/admin/users');
          } else if (userData.type === 'porter') {
            this.$router.push('/surveillance');
          } else {
            this.errorMessage = 'Rol de usuario no válido.';
            await signOut(auth); // Cierra sesión si el rol no es válido
          }
        } else {
          this.errorMessage = 'Usuario no encontrado en la base de datos.';
          await signOut(auth); // Cierra sesión si el usuario no está en la colección
        }
      } catch (error) {
        this.errorMessage = error.message;
      }
    }
  }
};
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.input-group {
  margin-bottom: 16px;
}
.input-group label {
  display: block;
  margin-bottom: 4px;
}
.input-group input {
  width: 100%;
  padding: 8px;
}
button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
.error-message {
  color: red;
  margin-top: 12px;
}
</style>
