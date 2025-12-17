const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');

const app = express();

// 🚨 CRÍTICO 1: Configuración de CORS
// Permite que tu aplicación Flutter (cualquier origen) acceda a esta API.
app.use(cors({
    origin: '*',
}));

// Ruta de bienvenida o base (si alguien accede a la URL principal)
app.get('/', (req, res) => {
    res.send('Servidor de Extracción de Audio ACTIVO y esperando peticiones en /extract.');
});

// Ruta de prueba para confirmar que Express está ejecutándose
app.get('/test', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Servidor Express está vivo y la ruta /test funciona.' });
});


// 🔑 ENDPOINT PRINCIPAL: /extract
app.get('/extract', async (req, res) => {
    // El videoId se obtiene de la URL, ejemplo: /extract?videoId=dQw4w9WgXcQ
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
        console.log('[LOG 4] URL de audio encontrada. Enviando al cliente.');
        res.status(200).json({
            audioUrl: audioFormat.url, 
            title: info.videoDetails.title,
        });

    } catch (error) {
        // Captura errores de ytdl-core (video no disponible, ID inválido, etc.)
        console.error('[LOG 5] Error Crítico de YTDL:', error.message);
        // Devolvemos el mensaje de error de YTDL al cliente para depuración
        res.status(500).json({ error: 'Fallo en el servidor: ' + error.message });
    }
});

// 3. Puerto de Escucha (CRÍTICO para OnRender)
const PORT = process.env.PORT || 3000;

// 4. Iniciar la aplicación y escuchar el puerto
app.listen(PORT, () => {
    console.log(`Servidor de extracción de audio corriendo en puerto ${PORT}`);
});

