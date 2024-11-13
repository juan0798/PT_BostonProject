<template>
    <div class="dashboard">
      <h2>Estadísticas de Acceso</h2>
  
      <!-- Filtros de fecha para generar informes -->
      <div class="filters">
        <label for="startDate">Fecha de inicio:</label>
        <input type="date" v-model="startDate" />
  
        <label for="endDate">Fecha de fin:</label>
        <input type="date" v-model="endDate" />
  
        <button @click="generateReport">Generar Informe</button>
        <button @click="fetchStatistics">Refrescar Estadísticas</button>
      </div>
  
      <!-- Estadísticas -->
      <div class="stats">
        <div class="stat-card">
          <h3>Registros Totales</h3>
          <p v-if="totalRecords !== null">{{ totalRecords }} registros</p>
          <p v-else>Cargando...</p>
        </div>
  
        <div class="stat-card">
          <h3>Fecha Pico</h3>
          <p v-if="peakDate">{{ new Date(peakDate.value).toLocaleString() }}</p>
        <p v-else>Cargando...</p>
        </div>
  
        <!-- Mostrar el EntityID más frecuente -->
        <div class="stat-card">
          <h3>Entidad Más Frecuentada</h3>
          <p v-if="mostFrequentEntityID">{{ mostFrequentEntityID }}</p>
          <p v-else>Cargando...</p>
        </div>
      </div>
  
      <table v-if="records.length > 0">
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
    name: 'dashBoard',
    data() {
      return {
        startDate: '',  
        endDate: '',    
        totalRecords: null,  
        peakDate: null,      
        mostFrequentEntityID: null, 
        records: []
      };
    },
    methods: {
      async fetchStatistics() {
        try {
          // Verificar que las fechas sean válidas
          if (!this.startDate || !this.endDate) {
            alert("Por favor selecciona un rango de fechas.");
            return;
          }
  
          const response = await axios.get('/api/statistics', {
            params: {
              startDate: this.startDate,
              endDate: this.endDate
            }
          });
  
          // Asignar los datos de la respuesta a las variables
          this.totalRecords = response.data.totalRecords;
          this.peakDate = response.data.peakDate;
          this.mostFrequentEntityID = response.data.mostFrequentEntityID;  
        } catch (error) {
          console.error("Error fetching statistics:", error);
        }
      },
      async generateReport() {
        try {
          const response = await axios.get('/api/generate-report', {
            params: {
              startDate: this.startDate,
              endDate: this.endDate
            },
            responseType: 'blob' // Para descargar el archivo como blob
          });
  
          // Crear un enlace para descargar el archivo generado
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(response.data);
          link.download = `informe_${this.startDate}_${this.endDate}.csv`;
          link.click();
        } catch (error) {
          console.error("Error generating report:", error);
        }
      },
      formatDate(timestamp) {
        if (!timestamp || !timestamp.value) return "-";
        return new Date(timestamp.value).toLocaleString(); // Formato personalizado
      }
    },
    watch: {
      startDate: 'fetchStatistics',
      endDate: 'fetchStatistics'
    },
    mounted() {
      // Obtener la fecha actual y la fecha de un día antes
      const today = new Date();
      const oneDayBefore = new Date(today);
      oneDayBefore.setDate(today.getDate() - 1);  // Restar un día
  
      // Formatear las fechas en formato ISO (YYYY-MM-DD)
      this.startDate = oneDayBefore.toISOString().split('T')[0];  // Fecha de un día antes
      this.endDate = today.toISOString().split('T')[0];  // Fecha actual
  
      this.fetchStatistics();  // Llamar a la función para obtener estadísticas
    }
  };
  </script>
  
  <style scoped>
  /* Estilos generales */
  .dashboard {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    border-radius: 8px;
    background-color: #f9f9f9;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .filters {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  
  .filters label {
    font-weight: bold;
    font-size: 14px;
  }
  
  .filters input {
    padding: 8px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 150px;
  }
  
  .filters button {
    padding: 10px 15px;
    font-size: 14px;
    background-color: #007BFF;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .filters button:hover {
    background-color: #0056b3;
  }
  
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }
  
  .stat-card {
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .stat-card h3 {
    font-size: 18px;
    margin-bottom: 10px;
  }
  
  .stat-card p {
    font-size: 16px;
    color: #555;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  
  table th, table td {
    padding: 12px;
    border: 1px solid #ddd;
    text-align: left;
  }
  
  table th {
    background-color: #f4f4f4;
    font-weight: bold;
  }
  </style>
  