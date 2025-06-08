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
    console.log('Client connected');

    ws.on('close', () => {
				console.log(clients.length, 'clients connected');
        //clients = clients.filter(c => c !== ws); // yeah this is crap
        console.log('Client disconnected');
    });
});

const FPS = 10; // Frames per second
// Start FFmpeg to grab frames
const ffmpeg = spawn('libcamera-vid', [
    '-t', '0',
		'--codec', 'yuv420',
    '--width', '640',
		'--height', '480',
		'--nopreview',
		'--framerate', `${FPS}`,
		'-o', '-'
]);

const counter = { value: 0 };
ffmpeg.stdout.on('data', (chunk) => {
	counter.value == 0 && console.log(`Received ${chunk.length} bytes of data`);
	counter.value = (counter.value + 1) % FPS; // Log every 10th frame
    for (const client of clients) {
			client.write(chunk);
    }
});

ffmpeg.stderr.on('data', (data) => {
    // Uncomment to debug FFmpeg logs
     console.error(`stderr:\n${data}`);
});

ffmpeg.on('exit', (code) => {
		//clients.forEach(c => c.end());
    console.log(`exited with code ${code}`);
});

server.listen(3000, () => {
    console.log(' WebSocket MJPEG stream running at http://localhost:3000');
});
