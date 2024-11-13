require('dotenv').config();
const express = require('express');
const { BigQuery } = require('@google-cloud/bigquery');
const router = express.Router();

const bigquery = new BigQuery({
  keyFilename: process.env.BIGQUERY_KEYFILE_PATH, // Asegúrate de proporcionar el archivo de configuración
});

router.get('/statistics', async (req, res) => {
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
      COUNT(*) AS totalRecords,
      MAX(dato) AS peakDate,
      entityID,
      COUNT(entityID) AS entityIDCount
    FROM \`${process.env.BIGQUERY_TABLE_ID_RUTE}\`
    WHERE dato BETWEEN '${start}' AND '${end}'
    GROUP BY entityID
    ORDER BY entityIDCount DESC
    LIMIT 1
  `;

  try {
    const [rows] = await bigquery.query({ query });

    if (rows.length > 0) {
      const data = rows[0];
      res.json({
        totalRecords: data.totalRecords,
        peakDate: data.peakDate,
        mostFrequentEntityID: data.entityID,
      });
    } else {
      res.status(404).json({ message: "No se encontraron registros en el rango de fechas especificado." });
    }
  } catch (error) {
    console.error("Error querying BigQuery:", error);
    res.status(500).json({ error: "Error querying BigQuery" });
  }
});

module.exports = router;
