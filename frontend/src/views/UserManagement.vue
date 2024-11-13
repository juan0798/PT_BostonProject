<template>
  <div class="user-management-container">
    <h1>Gestión de Usuarios</h1>

    <!-- Formulario para crear/editar un usuario -->
    <form @submit.prevent="handleSubmit">
      <div class="input-group">
        <label for="email">Correo Electrónico</label>
        <input type="email" id="email" v-model="email" :disabled="isEditing" required />
      </div>
      <div class="input-group">
        <label for="identification">Documento de Identidad</label>
        <input type="number" id="identification" v-model="identification" required />
      </div>
      <div class="input-group">
        <label for="name">Nombre</label>
        <input type="text" id="name" v-model="name" required />
      </div>
      <!-- Campo de contraseña solo visible cuando no estamos editando -->
      <div v-if="!isEditing" class="input-group">
        <label for="password">Contraseña</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <div class="input-group">
        <label for="type">Rol</label>
        <select id="type" v-model="type" required>
          <option value="admin">Administrador</option>
          <option value="porter">Vigilante</option>
        </select>
      </div>

      <!-- Botón de creación o actualización -->
      <button type="submit">{{ isEditing ? 'Actualizar Usuario' : 'Crear Usuario' }}</button>
      
      <!-- Botón "Crear Nuevo Usuario" solo visible cuando estamos en edición o después de eliminar -->
      <button 
        v-if="isEditing || isUserDeleted" 
        type="button" 
        @click="resetForm"
        class="create-new-user-btn">
        Crear Nuevo Usuario
      </button>
    </form>

    <p v-if="message" class="message">{{ message }}</p>

    <!-- Lista de usuarios -->
    <h2>Usuarios Existentes</h2>
    <table>
      <thead>
        <tr>
          <th>Email</th>
          <th>Nombre</th>
          <th>Tipo</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.email }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.type === 'admin' ? 'Administrador' : 'Vigilante' }}</td>
          <td>
            <button @click="editUser(user)">Editar</button>
            <button @click="deleteUser(user)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import axios from 'axios';

export default {
  name: 'UserManagement',
  data() {
    return {
      email: '',
      identification: '', 
      name: '',
      password: '',
      type: 'admin',
      users: [],
      message: '',
      isEditing: false,
      isUserDeleted: false,
      currentUserId: null,
    };
  },
  created() {
    this.fetchUsers();
  },
  methods: {
    // Obtener todos los usuarios de Firestore
    async fetchUsers() {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        this.users = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        this.message = 'Error al cargar los usuarios.';
      }
    },

    // Crear o actualizar un usuario
    async handleSubmit() {
      try {
        if (this.isEditing) {
          await this.updateUser();
        } else {
          const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
          const userId = userCredential.user.uid;

          await setDoc(doc(db, 'users', userId), {
            email: this.email,
            identification: this.identification,  
            name: this.name,
            type: this.type,
          });

          this.message = 'Usuario creado exitosamente';
        }

        this.resetForm();
        this.fetchUsers();
      } catch (error) {
        this.message = error.message;
      }
    },

    // Función para editar un usuario
    editUser(user) {
      this.email = user.email; // El correo electrónico no se puede editar
      this.identification = user.identification; // Usar el campo identification
      this.name = user.name;
      this.password = ''; // No se muestra la contraseña al editar
      this.type = user.type;
      this.isEditing = true;
      this.currentUserId = user.id;
    },

    // Actualizar un usuario en Firestore
    async updateUser() {
      try {
        await setDoc(doc(db, 'users', this.currentUserId), {
          email: this.email, // El correo electrónico no se actualiza
          identification: this.identification, 
          name: this.name,
          type: this.type,
        });

        const userIndex = this.users.findIndex((user) => user.id === this.currentUserId);
        if (userIndex !== -1) {
          this.users[userIndex] = {
            id: this.currentUserId,
            email: this.email, // El correo electrónico no se actualiza
            name: this.name,
            type: this.type,
          };
        }

        this.message = 'Usuario actualizado exitosamente';
        this.isEditing = false;
        this.currentUserId = null;
      } catch (error) {
        this.message = error.message;
      }
    },

    // Eliminar un usuario de Firebase Auth y Firestore
    async deleteUser(user) {
      try {
        // Eliminar usuario de Firestore
        await deleteDoc(doc(db, 'users', user.id));
        await axios.delete(`http://localhost:3000/api/deleteUser/${user.id}`);
        this.message = 'Usuario eliminado exitosamente';
        this.isUserDeleted = true; // Se marca que un usuario fue eliminado
        this.fetchUsers(); // Recargar la lista de usuarios
      } catch (error) {
        this.message = error.message;
      }
    },

    // Limpiar el formulario
    resetForm() {
      this.email = '';
      this.identification = ''; // Reseteo el campo identification
      this.name = '';
      this.password = '';
      this.type = 'admin';
      this.isEditing = false;
      this.isUserDeleted = false; // Reseteamos la bandera
      this.currentUserId = null;
    },
  },
};
</script>

<style scoped>
.user-management-container {
  max-width: 600px;
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
.input-group input,
.input-group select {
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
.message {
  color: green;
  margin-top: 12px;
}
table {
  width: 100%;
  margin-top: 20px;
  border-collapse: collapse;
}
table th,
table td {
  padding: 8px;
  text-align: left;
  border: 1px solid #ddd;
}
table th {
  background-color: #f4f4f4;
}
button {
  margin-top: 5px;
}
.create-new-user-btn {
  background-color: #28a745; /* Verde para crear nuevo usuario */
}
.create-new-user-btn:hover {
  background-color: #218838;
}
</style>