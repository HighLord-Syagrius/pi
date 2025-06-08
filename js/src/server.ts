import express from "express";
import { spawn }  from 'child_process';
import WebSocket from 'ws';
import http from "http";
import { Socket } from "net";

const app = express();
export const server = http.createServer(app);

let clients: Socket[] = [];

// Serve the viewer page
app.get('/', (req, res) => {
    res.send(`
        <html>
        <body>
            <h1>WebSocket Video Stream</h1>
            <canvas id="canvas" width="640" height="480"></canvas>
            <script>
                const canvas = document.getElementById('canvas');
                const ctx = canvas.getContext('2d');
                const ws = new WebSocket('ws://' + location.host);

                let img = new Image();
                img.onload = () => ctx.drawImage(img, 0, 0);
                
                ws.onmessage = (msg) => {
                    const blob = new Blob([msg.data], { type: 'image/jpeg' });
                    img.src = URL.createObjectURL(blob);
                };
            </script>
        </body>
        </html>
    `);
});

// WebSocket clients
server.on('connection', (ws) => {
    clients.push(ws);
    console.log('🎥 Client connected');

    ws.on('close', () => {
        clients = clients.filter(c => c !== ws); // yeah this is crap
        console.log('👋 Client disconnected');
    });
});

// Start FFmpeg to grab frames
const ffmpeg = spawn('ffmpeg', [
    '-f', 'video4linux2', // Change for your OS
    '-i', '/dev/video0',
    '-f', 'image2pipe',
    '-vf', 'scale=640:480',
    '-q:v', '5',
    '-update', '1',
    '-vcodec', 'mjpeg',
    'pipe:1'
]);

ffmpeg.stdout.on('data', (chunk) => {
    for (const client of clients) {
			client.write(chunk);
    }
});

// ffmpeg.stderr.on('data', (data) => {
//     // Uncomment to debug FFmpeg logs
//     // console.error(`FFmpeg stderr: ${data}`);
// });

ffmpeg.on('exit', (code) => {
		clients.forEach(c => c.end());
    console.log(`FFmpeg exited with code ${code}`);
});

server.listen(3000, () => {
    console.log('🚀 WebSocket MJPEG stream running at http://localhost:3000');
});
