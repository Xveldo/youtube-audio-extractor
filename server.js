const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');

const app = express();

// 🚨 CRÍTICO 1: Configuración de CORS
// Permite que tu aplicación Flutter (cualquier origen) acceda a esta API.
app.use(cors({
    origin: '*',
}));

// Ruta simple para verificar que el servidor está activo (Prueba de vida)
app.get('/', (req, res) => {
    res.send('Servidor de Extracción de Audio ACTIVO.');
});

// Ruta de prueba para confirmar que Express está ejecutándose
app.get('/test', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Servidor Express está vivo y la ruta funciona.' });
});


// 🔑 ENDPOINT PRINCIPAL: /extract
app.get('/extract', async (req, res) => {
    const videoId = req.query.videoId;
    console.log(`[LOG 1] Petición recibida para videoId: ${videoId}`);

    if (!videoId) {
        return res.status(400).json({ error: 'Falta el parámetro videoId.' });
    }

    try {
        // 1. Obtener información de YouTube
        const info = await ytdl.getInfo(videoId);
        console.log('[LOG 2] Información de YouTube obtenida.');
        
        // 2. Filtrar el mejor stream de audio
        const audioFormat = ytdl.chooseFormat(info.formats, { 
            filter: 'audioonly', 
            quality: 'highestaudio' 
        });

        if (!audioFormat || !audioFormat.url) {
            console.error('[LOG 3] Error: Formato de audio no encontrado en ytdl.');
            return res.status(404).json({ error: 'No se encontró un stream de audio válido.' });
        }
        
        // 🚨 CRÍTICO 2: Devolver la URL con la clave 'audioUrl' que Flutter espera
        res.status(200).json({
            audioUrl: audioFormat.url, 
            title: info.videoDetails.title,
        });

    } catch (error) {
        // Captura errores de ytdl-core (video no disponible, ID inválido, etc.)
        console.error('[LOG 4] Error Crítico de YTDL:', error.message);
        res.status(500).json({ error: 'Fallo en el servidor: ' + error.message });
    }
});

// 3. Puerto de Escucha (CRÍTICO para OnRender)
const PORT = process.env.PORT || 3000; 

app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});
