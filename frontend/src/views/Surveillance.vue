<template>
    <div class="registro-control">
      <h1>Registro de Entrada y Salida</h1>
      
      <!-- Selección de la entidad -->
      <div class="input-group">
        <label for="entidad">Selecciona la Entidad</label>
        <select id="entidad" v-model="selectedEntidad" @change="obtenerPorterias" required>
          <option value="" disabled>Selecciona una entidad</option>
          <option v-for="entidad in entidades" :key="entidad.id" :value="entidad.id">
            {{ entidad.name }}
          </option>
        </select>
      </div>
      
      <!-- Selección de la portería -->
      <div class="input-group" v-if="porterias.length > 0">
        <label for="porteria">Selecciona la Portería</label>
        <select id="porteria" v-model="selectedPorteria" required>
          <option value="" disabled>Selecciona una portería</option>
          <option v-for="porteria in porterias" :key="porteria.id" :value="porteria.id">
            {{ porteria.name }}
          </option>
        </select>
      </div>
  
      <!-- Formulario de registro de entrada/salida -->
      <form @submit.prevent="registrar">
        <div class="input-group">
          <label for="nombre">Nombre de la Persona</label>
          <input type="text" id="nombre" v-model="nombre" required />
        </div>
        <div class="input-group">
          <label for="cedula">Cédula</label>
          <input type="number" id="cedula" v-model="cedula" required />
        </div>
        <div class="input-group">
          <label for="tipo">Tipo de Acción</label>
          <select id="tipo" v-model="tipo" required>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </select>
        </div>
        <button type="submit" :disabled="!selectedPorteria">Registrar</button>
      </form>
      <p v-if="mensaje" class="mensaje">{{ mensaje }}</p>
    </div>
  </template>
  
  <script>
  import { db } from '../firebase';
  import { collection, getDocs, addDoc } from 'firebase/firestore';
  import { auth } from '../firebase';
  
  export default {
    name: 'RegistroControl',
    data() {
      return {
        nombre: '',
        cedula: '',
        tipo: 'entrada',
        selectedEntidad: '',
        selectedPorteria: '',
        entidades: [], // Lista de entidades
        porterias: [], // Lista de porterías de la entidad seleccionada
        mensaje: ''
      };
    },
    created() {
      this.obtenerEntidades(); // Cargar las entidades al crear el componente
    },
    methods: {
      // Obtener las entidades desde Firestore
      async obtenerEntidades() {
        try {
          const entidadRef = collection(db, 'entity');
          const querySnapshot = await getDocs(entidadRef);
          this.entidades = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
          this.mensaje = 'Error al cargar las entidades.';
        }
      },
      
      // Obtener las porterías de la entidad seleccionada
      async obtenerPorterias() {
        if (!this.selectedEntidad) {
          return;
        }
  
        try {
          const porteriaRef = collection(db, 'entity', this.selectedEntidad, 'entrance');
          const querySnapshot = await getDocs(porteriaRef);
          this.porterias = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
          this.mensaje = 'Error al cargar las porterías.';
        }
      },
      
      // Registrar la entrada o salida
      async registrar() {
        if (!this.nombre || !this.cedula || !this.selectedPorteria) {
          this.mensaje = 'Por favor, complete todos los campos.';
          return;
        }
  
        try {
          const registroRef = collection(db, 'entity', this.selectedEntidad, 'entrance', this.selectedPorteria, 'registro'); // Colección de registros
  
          // Datos del registro
          const registro = {
            name: this.nombre,
            identification: this.cedula,
            entry: this.tipo === 'entrada' ? new Date() : null, // Solo guarda la hora de entrada si es una entrada
            exit: this.tipo === 'salida' ? new Date() : null, // Solo guarda la hora de salida si es una salida
            tipo: this.tipo, // Tipo de acción (entrada o salida)
            usuarioId: auth.currentUser.uid, // ID del vigilante que realiza el registro
          };
  
          // Guardar el registro en Firestore
          await addDoc(registroRef, registro);
          this.mensaje = 'Registro exitoso';
          this.nombre = '';
          this.cedula = '';
          this.tipo = 'entrada';
          this.selectedPorteria = '';
        } catch (error) {
          this.mensaje = 'Error al registrar la entrada o salida.';
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .registro-control {
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
  .mensaje {
    color: green;
    margin-top: 12px;
  }
  </style>
  