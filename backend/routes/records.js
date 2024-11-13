require('dotenv').config();
const express = require('express');
const { BigQuery } = require('@google-cloud/bigquery');
const router = express.Router();

const bigquery = new BigQuery({
  keyFilename: process.env.BIGQUERY_KEYFILE_PATH,
});

router.get('/api/records', async (req, res) => {
  const { timePeriod, entryType, startTime, endTime } = req.query;
  let dateCondition;
  let ioCondition = '';
  let hourCondition = '';

  // Configuración de las condiciones de tiempo
  switch (timePeriod) {
    case 'week':
      dateCondition = `DATE_DIFF(CURRENT_DATE(), DATE(dato), DAY) <= 7`;
      break;
    case 'month':
      dateCondition = `DATE_DIFF(CURRENT_DATE(), DATE(dato), DAY) <= 30`;
      break;
    case 'sixMonths':
      dateCondition = `DATE_DIFF(CURRENT_DATE(), DATE(dato), DAY) <= 180`;
      break;
    default:
      dateCondition = `DATE_DIFF(CURRENT_DATE(), DATE(dato), DAY) <= 1`;
  }

  // Configuración de las condiciones de entrada o salida
  if (entryType === 'entry') ioCondition = "AND tipo = 'entrada'";
  else if (entryType === 'exit') ioCondition = "AND tipo = 'salida'";

  // Filtro por rango de horas
  if (startTime && endTime) {
    // Asegurarse de que las horas estén en formato HH:MM:SS
    const formattedStartTime = startTime.padStart(5, '0') + ':00';  // Asegurarse de que sea HH:MM:SS
    const formattedEndTime = endTime.padStart(5, '0') + ':00';  // Asegurarse de que sea HH:MM:SS

    // Calcular la fecha de inicio según el rango de tiempo seleccionado
    let startDate;
    const currentDate = new Date();

    // Dependiendo del 'timePeriod', calculamos la fecha de inicio
    switch (timePeriod) {
        case 'week':
            // Hace 7 días
            startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - 7);
            break;
        case 'month':
            // Hace 30 días
            startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - 30);
            break;
        case 'sixMonths':
            // Hace 180 días
            startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - 180);
            break;
        default:
            // Últimas 24 horas (hace 1 día)
            startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - 1);
    }

    // Formatear la fecha de inicio con la hora proporcionada por el usuario
    const startTimeFull = `TIMESTAMP('${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()} ${formattedStartTime}')`;

    // 'endTimeFull' será la fecha y hora actuales, con la hora proporcionada
    const endTimeFull = `TIMESTAMP(CURRENT_DATE() || ' ' || '${formattedEndTime}')`;

    // Condición para comparar el campo 'dato' con el rango de horas
    hourCondition = `AND dato BETWEEN ${startTimeFull} AND ${endTimeFull}`;
}

  // Consulta SQL con los filtros
  const query = `
    SELECT entityID, entranceID, entry, exit, identification, name, tipo, registroID, dato
    FROM \`${process.env.BIGQUERY_TABLE_ID_RUTE}\`
    WHERE ${dateCondition} ${ioCondition} ${hourCondition}
    ORDER BY dato DESC
  `;

  try {
    const [rows] = await bigquery.query({ query });
    res.json(rows);
  } catch (error) {
    console.error("Error querying BigQuery:", error);
    res.status(500).json({ error: "Error querying BigQuery" });
  }
});

module.exports = router;
