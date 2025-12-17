// server.js - Código del Servidor de Extracción de Audio

const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');

const app = express();
// Puerto de escucha. Node.js escuchará en el puerto 3000
const PORT = 3000; 

// 1. Configurar Middleware
// Habilitar CORS para que Flutter pueda conectarse
app.use(cors());
app.use(express.json());

// 2. Definir el Endpoint (La ruta que llamará Flutter)
app.get('/api/get-audio-url', async (req, res) => {
    // Obtener el ID del video del parámetro de consulta (ej: ?videoId=...)
    const videoId = req.query.videoId;

    if (!videoId) {
        return res.status(400).send({ error: "El parámetro videoId es requerido." });
    }

    try {
        // Usar ytdl-core para obtener la URL de streaming
        const info = await ytdl.getInfo(videoId);

        // Filtrar para obtener la URL del stream de audio de menor calidad (solo audio)
        const audioFormat = ytdl.chooseFormat(info.formats, { 
            filter: 'audioonly',
            quality: 'lowestaudio' 
        });

        if (!audioFormat) {
            return res.status(404).send({ error: "No se encontró un stream de audio disponible." });
        }
        
        // 3. Responder a la aplicación Flutter con la URL directa
        return res.json({ 
            url: audioFormat.url, 
            title: info.videoDetails.title
        });

    } catch (error) {
        console.error(`Error al extraer URL para video ${videoId}:`, error.message);
        // Devolver un error específico si falla la extracción
        return res.status(500).send({ error: `Fallo en la extracción: ${error.message}` });
    }
});

// 4. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor de extracción corriendo en http://localhost:${PORT}`);
    console.log(`URL para Flutter: http://10.0.2.2:${PORT}/api`);
});