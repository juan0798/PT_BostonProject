<template>
  <div class="entity-manager">
    <h1>Gestión de Entidades</h1>

    <!-- Seleccionar Entidad -->
    <div class="entity-selector">
      <label>Selecciona una Entidad:</label>
      <select v-model="selectedEntityId" @change="loadEntityDetails">
        <option value="" disabled>Selecciona...</option>
        <option v-for="entity in entities" :key="entity.id" :value="entity.id">
          {{ entity.name }}
        </option>
        <option value="create-new">Crear Nueva Entidad</option>
      </select>
    </div>

    <!-- Detalle de Entidad Seleccionada -->
    <div v-if="entityData && selectedEntityId && selectedEntityId !== 'create-new'" class="entity-details">
      <h2>Detalle de la Entidad</h2>
      <form @submit.prevent="updateEntity" class="form">
        <label>Nombre:</label>
        <input type="text" v-model="entityData.name" />
        <label>Dirección:</label>
        <input type="text" v-model="entityData.address" />
        <label>Tipo:</label>
        <input type="text" v-model="entityData.type" />

        <h3>Porterías</h3>
        <div v-for="(entrance, index) in entrances" :key="index" class="entrance-group">
          <div class="entrance-header">
            <h4>{{ entrance.name }}</h4>
            <button type="button" class="button edit-records" @click="toggleRecords(entrance.id)">
            {{ entrance.showRecords ? "Ocultar Registros" : "Mostrar Registros" }}
            </button>
          </div>
        
          <!-- Mostrar Registros de la Portería en una Tabla -->
          <div v-if="entrance.showRecords" class="record-list">
            <h4>Registros</h4>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Identificación</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(record, recordIndex) in entrance.records" :key="recordIndex">
                  <td>{{ record.name }}</td>
                  <td>{{ record.identification }}</td>
                  <td>{{ formatDate(record.entry) }}</td>
                  <td>{{ formatDate(record.exit) }}</td>
                  <td>
                    <button @click="openEditModal(entrance.id, record)">Editar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <button type="button" class="button add" @click="openAddEntranceModal">Agregar Nueva Portería</button>
        <button type="submit" class="button save" @click="updateEntity">Guardar Cambios</button>
        <button type="button" class="button delete" @click="deleteEntity">Eliminar Entidad</button>
      </form>
    </div>

    <!-- Modal para Editar Registro -->
    <div v-if="isEditModalOpen" class="modal">
      <div class="modal-content">
        <h3>Editar Registro</h3>
        <label>Nombre:</label>
        <input type="text" v-model="editRecord.name" />
        <label>Identificación:</label>
        <input type="text" v-model="editRecord.identification" />
        <label>Entrada:</label>
        <input type="datetime-local" v-model="editRecord.entry" :disabled="editRecord.entry === null" />
        <label>Salida:</label>
        <input type="datetime-local" v-model="editRecord.exitt" :disabled="editRecord.exit === null" />
        <button @click="saveEdit">Guardar</button>
        <button @click="closeEditModal">Cancelar</button>
      </div>
    </div>

    <!-- Modal para agregar nueva portería -->
    <div v-if="isAddEntranceModalOpen" class="modal">
      <div class="modal-content">
        <h3>Agregar Nueva Portería</h3>
        <label>Nombre de la Portería:</label>
        <input type="text" v-model="newEntrance.name" />
        <button @click="saveNewEntrance">Guardar</button>
        <button @click="closeAddEntranceModal">Cancelar</button>
      </div>
    </div>

    <!-- Crear Nueva Entidad -->
    <div v-if="selectedEntityId === 'create-new'" class="new-entity">
      <h2>Crear Nueva Entidad</h2>
      <form @submit.prevent="createEntity" class="form">
        <label>Nombre:</label>
        <input type="text" v-model="newEntity.name" />
        <label>Dirección:</label>
        <input type="text" v-model="newEntity.address" />
        <label>Tipo:</label>
        <input type="text" v-model="newEntity.type" />
        <label>Cantidad de Entradas:</label>
        <input type="number" v-model="newEntity.entranceCount" @change="generateEntrances" />  
        <div v-for="(entrance, index) in newEntity.entrances" :key="index" class="entrance-group">
          <h4>Entrada {{ index + 1 }}</h4>
          <label>Nombre de la Entrada:</label>
          <input type="text" v-model="entrance.name" />
        </div>
        <button type="submit" class="button create">Crear Entidad</button>
      </form>
    </div>
  </div>
</template>

<script>
import { db } from "@/firebase";
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";

export default {
  data() {
    return {
      entities: [],
      selectedEntityId: "",
      entityData: null,
      entrances: [],
      isEditModalOpen: false,
      isAddEntranceModalOpen: false, 
      currentEntranceId: null,
      newEntrance: { name: "" },
      editRecord: {},
      originalRecord: {},
      newEntity: {
        name: "",
        address: "",
        type: "",
        entranceCount: 1,
        entrances: [{ name: "" }]
      }
    };
  },
  async created() {
    await this.loadEntities();
  },

  methods: {

    //Carga de todas las entidades
    async loadEntities() {
      const entitiesRef = collection(db, "entity");
      const entitySnapshots = await getDocs(entitiesRef);
      this.entities = entitySnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    //Carga de los detalles de la entidad seleccionada
    async loadEntityDetails() {
      if (!this.selectedEntityId || this.selectedEntityId === "create-new") {
        this.entityData = null;
        this.entrances = [];
        return;
      }
      const entityRef = doc(db, "entity", this.selectedEntityId);
      const entitySnap = await getDoc(entityRef);
      if (entitySnap.exists()) {
        this.entityData = entitySnap.data();
        const entrancesRef = collection(db, "entity", this.selectedEntityId, "entrance");
        const entranceSnapshots = await getDocs(entrancesRef);
        this.entrances = entranceSnapshots.docs.map(doc => ({
          id: doc.id,
          name: doc.id,
          ...doc.data(),
          showRecords: false,
          records: []
        }));
      }
    },

    //logica de las tablas de registro
    async loadEntranceRecords(entranceId) {
      const recordsRef = collection(db, "entity", this.selectedEntityId, "entrance", entranceId, "registro");
      const recordSnapshots = await getDocs(recordsRef);

      const entranceIndex = this.entrances.findIndex(e => e.id === entranceId);
      if (entranceIndex !== -1) {
        this.entrances[entranceIndex].records = recordSnapshots.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    },

    //logica de las tablas de registro
    toggleRecords(entranceId) {
      const entrance = this.entrances.find(e => e.id === entranceId);
      if (entrance) {
        entrance.showRecords = !entrance.showRecords;
        if (entrance.showRecords) {
          this.loadEntranceRecords(entranceId);
        }
      }
    },

    //Actualiza los datos de la entidad
    async updateEntity() {
      const entityRef = doc(db, "entity", this.selectedEntityId);
      await updateDoc(entityRef, {
        name: this.entityData.name,
        address: this.entityData.address,
        type: this.entityData.type
      });

      for (const entrance of this.entrances) {
        const entranceRef = doc(collection(db, "entity", this.selectedEntityId, "entrance"), entrance.id);
        await setDoc(entranceRef, {
          name: entrance.name
        });
      }
      //alert("Datos actualizados correctamente");
    },

    //elimina la entidad de la base de datos
    async deleteEntity() {
      const entityRef = doc(db, "entity", this.selectedEntityId);
      await deleteDoc(entityRef);
      alert("Entidad eliminada");
      this.selectedEntityId = "";
      this.entityData = null;
      this.entrances = [];
      await this.loadEntities();
    },

    //crea un array con las porterías que se desean crear en la nueva entidad
    generateEntrances() {
        this.newEntity.entrances = Array.from({ length: this.newEntity.entranceCount }, () => ({
          name: ""
        }));
      },

    //Crea la entidad nueva en la base de datos
    async createEntity() {
      const entyRef = collection(db, "entity");
      const entityRef = doc(entyRef);
      await setDoc(entityRef, {
        name: this.newEntity.name,
        address: this.newEntity.address,
        type: this.newEntity.type
      });
      for (const entrance of this.newEntity.entrances) {
        const entranceRef = doc(collection(db, "entity", entityRef.id, "entrance"));
        await setDoc(entranceRef, {
          name: entrance.name
        });
      }
      alert("Nueva entidad creada");
      this.newEntity = {
        name: "",
        address: "",
        type: "",
        entranceCount: 1,
        entrances: [{ name: "" }]
      };
      await this.loadEntities();
    },

    // Dar formato a las horas y fechas
    formatDate(value) {
      if (!value || !value.toDate) return "N/A"; // Verifica si el valor es nulo o si no es un Timestamp de Firestore
      const date = value.toDate();
      return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    },
    //Abrir el modal e inicializar editRecord
    openEditModal(entranceId, record) {
      this.isEditModalOpen = true;
      this.currentEntranceId = entranceId;
      this.editRecord = { ...record };
      this.originalRecord = { ...record};
    },

    editRecordHasChanges() {
      return (
        this.editRecord.name !== this.originalRecord.name ||
        this.editRecord.identification !== this.originalRecord.identification ||
        this.editRecord.entry !== this.originalRecord.entry ||
        this.editRecord.exit !== this.originalRecord.exit
      );

    },

    closeEditModal() {
      this.isEditModalOpen = false;
      this.editRecord = {};
      this.originalRecord = {};
    },

    async saveEdit() {
      if (this.editRecordHasChanges()) {
        const updatedRecord = {
          ...this.editRecord,
          entry: this.editRecord.entry ? Timestamp.fromDate(new Date(this.editRecord.entry)) : null,
          exit: this.editRecord.exit ? Timestamp.fromDate(new Date(this.editRecord.exit)) : null
        };  
        const recordsRef = collection( db, "entity", this.selectedEntityId, "entrance", this.currentEntranceId, "registro");
        const recordDoc = doc(recordsRef, this.editRecord.id); // Asumiendo que cada registro tiene un ID único
        await updateDoc(recordDoc, updatedRecord);

        // Actualiza localmente
        const entrance = this.entrances.find((e) => e.id === this.currentEntranceId);
        const recordIndex = entrance.records.findIndex((r) => r.id === this.editRecord.id);
        entrance.records[recordIndex] = { ...this.editRecord };
        alert("Registro actualizado con éxito");
      } else {
        alert("No se realizaron cambios en el registro.");
      }
      this.closeEditModal();
      
    },

    // nuevas funciones
    openAddEntranceModal() {
      this.isAddEntranceModalOpen = true;
      this.newEntrance = { name: "" }; // Reiniciar los datos
    },
    closeAddEntranceModal() {
      this.isAddEntranceModalOpen = false;
    },

    async saveNewEntrance() {
      if (!this.selectedEntityId || !this.newEntrance.name) {
        alert("Por favor, selecciona una entidad y proporciona un nombre para la portería.");
        return;
      }

      // Crear referencia a la colección de entradas para la entidad seleccionada
      const entrancesRef = collection(db, "entity", this.selectedEntityId, "entrance");
      
      // Agregar nueva portería a Firestore
      const entranceDocRef = doc(entrancesRef); // Firebase genera automáticamente un ID
      await setDoc(entranceDocRef, {
        name: this.newEntrance.name,
      });

      // Añadir portería localmente para reflejar el cambio sin recargar
      this.entrances.push({
        id: entranceDocRef.id,
        name: this.newEntrance.name,
        showRecords: false,
        records: []
      });

      this.closeAddEntranceModal(); // Cerrar modal
    }


  }

};
</script>

<style scoped>
.entity-manager {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1, h2, h3, h4 {
  color: #333;
}

.entity-selector, .entity-details, .new-entity {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.form label {
  display: block;
  margin-top: 10px;
}

.form input {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.button {
  padding: 8px 12px;
  margin-top: 10px;
  margin-right: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button.delete {
  background-color: #dc3545;
}

.button.create {
  background-color: #28a745;
}

.button.edit-records {
  background-color: #6c757d;
}

.button.add {
  background-color: #17a2b8;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

th, td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: left;
}

th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
  width: 300px;
}

.entrance-header {
  display: flex;
  align-items: center; /* Centra el botón verticalmente con el texto */
  gap: 10px; /* Espacio entre el título y el botón */
}

.entrance-header h4 {
  margin: 0; /* Elimina márgenes para evitar desplazamiento */
}

.button.edit-records {
  margin-left: auto; /* Empuja el botón hacia el lado derecho, opcional */
}

.modal-content h3 {
  margin-top: 0;
}

.modal-content button {
  margin-right: 5px;
  padding: 8px 12px;
  cursor: pointer;
}
</style>