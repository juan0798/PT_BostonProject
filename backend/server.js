require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const admin = require("firebase-admin");
const { BigQuery } = require('@google-cloud/bigquery');
const credentials = require(process.env.FIREBASE_CREDENTIALS_PATH);
const recordsRoute = require("./routes/records");
const statisticsRouter = require("./routes/statistics")
const generateReportRouter = require("./routes/generateReport");


admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

// Referencia a Firestore
const db = admin.firestore();

// Configuración BigQuery
const bigQuery = new BigQuery({
  keyFilename: process.env.BIGQUERY_KEYFILE_PATH,
});
const datasetId = process.env.BIGQUERY_DATASET_ID; 
const tableId = process.env.BIGQUERY_TABLE_ID;

// Configuración de middlewares
app.use(morgan('tiny'));
app.use(cors());
app.use(recordsRoute);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', statisticsRouter);
app.use('/api', generateReportRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// API para eliminar usuario
const eliminarUsuario = async (userId) => {
  await admin.auth().deleteUser(userId);
};

app.delete('/api/deleteUser/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    await eliminarUsuario(userId);
    res.status(200).send({ mensaje: 'Usuario eliminado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ mensaje: 'Error al eliminar el usuario', error: error.message });
  }
});

// Función para verificar y agregar el registro a BigQuery
async function addToBigQuery(entityId, entranceId, registroId, data) {
  try {
    // Verificar si el registroID ya existe en BigQuery
    const query = `
      SELECT registroID 
      FROM \`${datasetId}.${tableId}\`
      WHERE registroID = @registroId
    `;
    const options = {
      query: query,
      location: 'US',
      params: { registroId: registroId }
    };
    const [rows] = await bigQuery.query(options);

    // Si el registro ya existe, no lo agregamos
    if (rows.length > 0) {
      console.log(`Registro con ID ${registroId} ya existe en BigQuery.`);
      return;
    }

    // Asignar el valor de 'data' dependiendo del tipo de evento
    let eventData = null;
    if (data.tipo === 'entrada' && data.entry) {
      eventData = data.entry.toDate();  // Asignar entry si es de tipo entrada
    } else if (data.tipo === 'salida' && data.exit) {
      eventData = data.exit.toDate();   // Asignar exit si es de tipo salida
    }

    // Preparar los datos para BigQuery
    const row = {
      entityID: entityId,
      entranceID: entranceId,
      entry: data.entry ? data.entry.toDate() : null,
      exit: data.exit ? data.exit.toDate() : null,
      identification: String(data.identification),
      name: data.name,
      tipo: data.tipo,
      registroID: registroId,
      dato: eventData
    };

    // Insertar en BigQuery
    await bigQuery
      .dataset(datasetId)
      .table(tableId)
      .insert([row]);

    console.log(`Registro con ID ${registroId} añadido a BigQuery.`);
  } catch (error) {
    console.error('Error al agregar el registro a BigQuery:', error);
  }
}

// Función para obtener el nombre de la entidad desde Firestore
async function getEntityName(entityId) {
  const entityRef = db.collection('entity').doc(entityId);
  const entityDoc = await entityRef.get();
  if (entityDoc.exists) {
    return entityDoc.data().name; // Asumimos que 'name' es el campo que contiene el nombre de la entidad
  } else {
    console.log(`Entity not found for ID: ${entityId}`);
    return null;
  }
}

// Función para obtener el nombre de la entrada desde Firestore
async function getEntranceName(entranceId, entityId) {
  const entranceRef = db.collection('entity').doc(entityId).collection('entrance').doc(entranceId);
  const entranceDoc = await entranceRef.get();
  if (entranceDoc.exists) {
    return entranceDoc.data().name; // Asumimos que 'name' es el campo que contiene el nombre de la entrada
  } else {
    console.log(`Entrance not found for ID: ${entranceId}`);
    return null;
  }
}

// Función para escuchar los cambios en Firestore
async function listenForNewRecords() {
  const snapshot = await db.collectionGroup('registro').get();

  snapshot.forEach(async (doc) => {
    const data = doc.data();
    const entityId = doc.ref.parent.parent.parent.parent.id;
    const entranceId = doc.ref.parent.parent.id;
    const registroId = doc.id;

    // Obtener el nombre de la entidad y la entrada
    const entityName = await getEntityName(entityId);
    const entranceName = await getEntranceName(entranceId, entityId);

    // Llamar a la función para agregar el registro a BigQuery
    if (entityName && entranceName) {
      await addToBigQuery(entityName, entranceName, registroId, data);
    } else {
      console.log(`Could not retrieve names for entity ID: ${entityId} or entrance ID: ${entranceId}`);
    }
  });
}

// Ejecutar la función para escuchar los cambios en la base de datos
listenForNewRecords().catch(console.error);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Servir archivos estáticos para Vue.js
app.use(express.static(path.join(__dirname, 'public')));

// Iniciar el servidor
app.listen(3000, function () {
  console.log('Server listening on port 3000!');
});

// Middleware para Vue.js router en modo history (descomentado si es necesario)
// const history = require('connect-history-api-fallback');
// app.use(history());
