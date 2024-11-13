<template>
  <div class="container">
    <h2>Registro de Movimientos</h2>
    
    <div class="filters">
      <div class="filter-item">
        <label for="timePeriod">Período:</label>
        <select v-model="timePeriod" @change="fetchRecords">
          <option value="24h">Últimas 24 horas</option>
          <option value="week">Última semana</option>
          <option value="month">Último mes</option>
          <option value="sixMonths">Últimos seis meses</option>
        </select>
      </div>

      <div class="filter-item">
        <label for="entryType">Tipo de registro:</label>
        <select v-model="entryType" @change="fetchRecords">
          <option value="all">Todos</option>
          <option value="entry">Entrada</option>
          <option value="exit">Salida</option>
        </select>
      </div>

      <div class="filter-item">
        <label for="startTime">Hora de inicio:</label>
        <input type="time" v-model="startTime" @change="fetchRecords" />
      </div>

      <div class="filter-item">
        <label for="endTime">Hora de fin:</label>
        <input type="time" v-model="endTime" @change="fetchRecords" />
      </div>

      <!-- Botón Limpiar Filtros -->
      <div class="filter-item">
        <button @click="clearFilters">Limpiar Filtros</button>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Identificación</th>
          <th>Entrada</th>
          <th>Salida</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="record in records" :key="record.registroID">
          <td>{{ record.name }}</td>
          <td>{{ record.identification }}</td>
          <td>{{ formatDate(record.entry) }}</td>
          <td>{{ formatDate(record.exit) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      records: [],
      timePeriod: '24h',
      entryType: 'all',
      startTime: '',
      endTime: ''
    };
  },
  methods: {
    async fetchRecords() {
      try {
        const response = await axios.get('/api/records', {
          params: {
            timePeriod: this.timePeriod,
            entryType: this.entryType,
            startTime: this.startTime,
            endTime: this.endTime
          }
        });
        this.records = response.data;
      } catch (error) {
        console.error("Error fetching records:", error);
      }
    },
    formatDate(timestamp) {
      if (!timestamp || !timestamp.value) return "-";
      return new Date(timestamp.value).toLocaleString(); // Formato personalizado
    },
    // Método para limpiar los filtros
    clearFilters() {
      this.timePeriod = '24h';  // Restablecer a las últimas 24 horas
      this.entryType = 'all';   // Mostrar todos los registros
      this.startTime = '';      // Hora de inicio vacía
      this.endTime = '';        // Hora de fin vacía

      // Llamar nuevamente a la función para cargar los registros con los filtros limpiados
      this.fetchRecords();
    }
  },
  mounted() {
    this.fetchRecords();
  }
};
</script>

<style scoped>
/* Contenedor principal */
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Filtros: Organizados en una columna con etiquetas a la izquierda */
.filters {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Cada ítem de filtro se organiza horizontalmente */
.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Estilo para las etiquetas (labels) */
.filters label {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 5px;
}

/* Estilo para los inputs y selects */
.filters select,
.filters input[type="time"] {
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 250px;  /* Ancho fijo */
}

/* Estilo para el botón Limpiar Filtros */
.filters button {
  background-color: #007BFF;
  color: #fff;
  border: none;
  padding: 10px 15px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  width: 250px;  /* Ancho fijo */
}

.filters button:hover {
  background-color: #0056b3;
}

/* Estilo para la tabla */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f4f4f4;
  font-weight: bold;
}

td {
  font-size: 14px;
}

tbody tr:hover {
  background-color: #f1f1f1;
}
</style>
