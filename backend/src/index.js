const express = require('express');
const path = require('path');
const cron = require('node-cron');
const fs = require('fs');
const scrapingService = require('./services/scrapingService');

const app = express();
const PORT = 3001;

// Middleware para JSON y CORS
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Servir archivos estáticos de la carpeta de videos
app.use('/videos', express.static(path.join(__dirname, '../public/videos')));

// Endpoint principal para el scraping
app.post('/scrape-videos', async (req, res) => {
    try {
        const { links } = req.body;

        if (!Array.isArray(links)) {
            return res.status(400).json({ code: 400, message: 'Invalid links format. Must be an array.' });
        }

        const results = await scrapingService.scrapeVideos(links);

        // Validar si todos los videos tienen un downloadLink
        const hasErrors = results.some(result => !result.downloadLink);
        if (hasErrors) {
            return res.status(400).json({
                code: 400,
                message: 'Some videos could not be scraped successfully.',
                data: results, // Devuelve los detalles para depuración
            });
        }

        // Si todo está completo, devuelve éxito
        res.status(200).json({
            code: 200,
            message: 'Videos scraped successfully',
            data: results,
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'An error occurred',
            error: error.message,
        });
    }
});

// Cron para eliminar la carpeta de videos diariamente a las 00:00
cron.schedule('0 0 * * *', () => {
    console.log('Running daily cleanup task...');
    deleteVideosFolder();
});

// Función para eliminar la carpeta de videos
function deleteVideosFolder() {
    const folderPath = path.join(__dirname, '../public/videos');

    fs.rm(folderPath, { recursive: true, force: true }, (err) => {
        if (err) {
            console.error('Error deleting videos folder:', err.message);
        } else {
            console.log('Videos folder deleted successfully');
            // Recrear la carpeta si es necesaria para que la aplicación siga funcionando
            fs.mkdirSync(folderPath, { recursive: true });
        }
    });
}

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
