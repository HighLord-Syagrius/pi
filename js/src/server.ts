import { spawn } from 'child_process';
import express from "express";
import http from "http";
import WebSocket from 'ws';

const app = express();
export const server = http.createServer(app);

let clients: WebSocket[] = [];
server.listen(3000, () => {
	console.log(' WebSocket MJPEG stream running at http://localhost:3000');
});

const wss = new WebSocket.Server({ server });
app.get('/', (req, res) => {
	res.send(`
        <html>
        <body>
            <h1>WebSocket Video Stream</h1>
            <canvas id="canvas" width="640" height="480"></canvas>
						 <img id="stream" width="640" height="480">
            <script>
                const img = document.getElementById('stream');
                const ws = new WebSocket('ws://' + location.host);
                ws.onmessage = (msg) => {
										img.src = 'data:image/png;base64,' + msg.data;;
                };
            </script>
        </body>
        </html>
    `);
});

// WebSocket clients
wss.on('connection', (ws) => {
	clients.push(ws);
	console.log('Client connected');

	ws.on('close', () => {
		console.log(clients.length, 'clients connected');
		//clients = clients.filter(c => c !== ws); // yeah this is crap
		console.log('Client disconnected');
	});
});

const FPS = 2; // Frames per second
const libCameraVid = spawn('libcamera-vid', [
	'-t', '0',
	'--codec', 'yuv420',
	'--width', '640',
	'--height', '480',
	'--nopreview',
	'--framerate', `${FPS}`,
	'-o', '-'
]);

const counter = { value: 0 };
libCameraVid.stdout.on('data', (chunk) => {
	counter.value == 0 && console.log(`Received ${chunk.length} bytes of data`);
	counter.value = (counter.value + 1) % FPS; // Log every 10th frame
	for (const client of clients) {
		client.send(chunk);
	}
});

libCameraVid.stderr.on('data', (data) => {
	// Uncomment to debug FFmpeg logs
	console.error(`stderr:\n${data}`);
});

libCameraVid.on('exit', (code) => {
	//clients.forEach(c => c.end());
	console.log(`exited with code ${code}`);
});
libCameraVid.on('error', (err) => {
	console.error('Failed to start libcamera-vid:', err);
});