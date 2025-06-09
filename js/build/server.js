"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const child_process_1 = require("child_process");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const ws_1 = __importDefault(require("ws"));
const app = (0, express_1.default)();
exports.server = http_1.default.createServer(app);
let clients = [];
exports.server.listen(3000, () => {
    console.log(' WebSocket MJPEG stream running at http://localhost:3000');
});
const wss = new ws_1.default.Server({ server: exports.server });
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
										//console.log('Received message', msg.data);
										img.src = URL.createObjectURL( new Blob([msg.data], { type: 'image/jpeg' }));
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
const libCameraVid = (0, child_process_1.spawn)('libcamera-vid', [
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
