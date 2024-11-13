require('dotenv').config();
const express = require('express');
const { BigQuery } = require('@google-cloud/bigquery');
const router = express.Router();

const bigquery = new BigQuery({
  keyFilename: process.env.BIGQUERY_KEYFILE_PATH, // Asegúrate de que la ruta del archivo de configuración esté correcta
});

router.get('/generate-report', async (req, res) => {
  const { startDate, endDate } = req.query;

  // Validación de las fechas
  let start = startDate ? new Date(startDate) : new Date();
  let end = endDate ? new Date(endDate) : new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: "Fecha inválida proporcionada." });
  }

  // Convertir las fechas a formato adecuado para BigQuery
  start = start.toISOString().split('T')[0]; // Solo la fecha (YYYY-MM-DD)
  end = end.toISOString().split('T')[0];     // Solo la fecha (YYYY-MM-DD)

  const query = `
    SELECT
      entityID,
      entranceID,  -- Reemplazar 'entrance' con 'entranceID'
      entry,
      exit,
      identification,
      name,
      tipo,
      registroID,
      dato
    FROM \`${process.env.BIGQUERY_TABLE_ID_RUTE}\`
    WHERE dato BETWEEN '${start}' AND '${end}'
    ORDER BY dato DESC
  `;

  try {
    const [rows] = await bigquery.query({ query });

    if (rows.length > 0) {
      // Convertir los resultados a formato CSV o JSON según se necesite
      // Si quieres enviar el reporte en CSV:
      const json2csv = require('json2csv').parse;
      const csv = json2csv(rows);
      res.header('Content-Type', 'text/csv');
      res.attachment('reporte.csv');
      res.send(csv);
    } else {
      res.status(404).json({ message: "No se encontraron registros en el rango de fechas especificado." });
    }
  } catch (error) {
    console.error("Error querying BigQuery:", error);
    res.status(500).json({ error: "Error querying BigQuery" });
  }
});

module.exports = router;
