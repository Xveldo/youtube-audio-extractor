const express = require('express');
// 💡 CAMBIAMOS: Importamos la nueva librería
const ytdl = require('ytdl-core-muxer'); 
const cors = require('cors');

const app = express();

// ... (Todas tus definiciones de CORS y app.get('/', '/test') se quedan igual) ...

// 🔑 ENDPOINT PRINCIPAL: /extract
app.get('/extract', async (req, res) => {
    let videoId = req.query.videoId; 
    
    // Sanitización del ID (¡sigue siendo importante!)
    if (videoId) {
        videoId = videoId.split(']')[0].split(')')[0].trim();
    }
    
    console.log(`[LOG 1] Petición recibida para videoId: ${videoId}`);

    if (!videoId) {
        return res.status(400).json({ error: 'Falta el parámetro videoId.' });
    }

    try {
        // 1. Obtener información de YouTube
        // NOTA: Con la nueva librería, la API es casi idéntica
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
        
        // 🚨 Devolver la URL
        console.log('[LOG 4] URL de audio encontrada. Enviando al cliente.');
        res.status(200).json({
            audioUrl: audioFormat.url, 
            title: info.videoDetails.title,
        });

    } catch (error) {
        // ... (Manejo de errores se queda igual)
        console.error('[LOG 5] Error Crítico de YTDL:', error.message);
        res.status(500).json({ error: 'Fallo en el servidor: ' + error.message });
    }
});

// 3. Puerto de Escucha (CRÍTICO para OnRender)
const PORT = process.env.PORT || 3000;

// 4. Iniciar la aplicación y escuchar el puerto
app.listen(PORT, () => {
    console.log(`Servidor de extracción de audio corriendo en puerto ${PORT}`);
});



