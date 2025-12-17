const express = require('express');
// Usamos ytdl-core-muxer, que es más robusto contra los errores 410/403 de YouTube.
const ytdl = require('ytdl-core-muxer'); 
const cors = require('cors');

const app = express();

// 🚨 CRÍTICO 1: Configuración de CORS
// Permite acceso desde cualquier origen (tu app Flutter).
app.use(cors({
    origin: '*',
}));

// Ruta base
app.get('/', (req, res) => {
    res.send('Servidor de Extracción de Audio ACTIVO y esperando peticiones en /extract.');
});

// Ruta de prueba
app.get('/test', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Servidor Express está vivo y la ruta /test funciona.' });
});


// 🔑 ENDPOINT PRINCIPAL: /extract
app.get('/extract', async (req, res) => {
    let videoId = req.query.videoId; 
    
    // 💡 Sanitizamos el videoId para eliminar cualquier carácter extra que pueda causar fallos.
    if (videoId) {
        videoId = videoId.split(']')[0].split(')')[0].trim();
    }
    
    console.log(`[LOG 1] Petición recibida para videoId: ${videoId}`);

    if (!videoId) {
        return res.status(400).json({ error: 'Falta el parámetro videoId.' });
    }

    try {
        // 1. Obtener información de YouTube
        // 💡 SOLUCIÓN ANTI-410: Usamos un User-Agent de navegador común para evitar ser detectados como bot.
        const info = await ytdl.getInfo(videoId, {
            requestOptions: {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
                }
            }
        });
        console.log('[LOG 2] Información de YouTube obtenida.');
        
        // 2. Filtrar el mejor stream de audio
        const audioFormat = ytdl.chooseFormat(info.formats, { 
            filter: 'audioonly', 
            quality: 'highestaudio' // Busca la mejor calidad de audio disponible
        });

        if (!audioFormat || !audioFormat.url) {
            console.error('[LOG 3] Error: Formato de audio no encontrado en ytdl.');
            return res.status(404).json({ error: 'No se encontró un stream de audio válido.' });
        }
        
        // 🚨 Devolver la URL del stream para la reproducción ONLINE.
        console.log('[LOG 4] URL de audio encontrada. Enviando al cliente.');
        res.status(200).json({
            audioUrl: audioFormat.url, 
            title: info.videoDetails.title,
        });

    } catch (error) {
        // Captura errores de ytdl-core-muxer (video no disponible, ID inválido, bloqueo 410)
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



