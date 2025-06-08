"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const express_1 = __importDefault(require("express"));
const child_process_1 = require("child_process");
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
exports.server = http_1.default.createServer(app);
let clients = [];
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
exports.server.on('connection', (ws) => {
    clients.push(ws);
    console.log('Client connected');
    ws.on('close', () => {
        console.log(clients.length, 'clients connected');
        //clients = clients.filter(c => c !== ws); // yeah this is crap
        console.log('Client disconnected');
    });
});
// Start FFmpeg to grab frames
const ffmpeg = (0, child_process_1.spawn)('ffmpeg', [
    '-f', 'video4linux2', // Change for your OS
    '-input_format', 'yuyv422',
    '-i', '/dev/video0',
    '-f', 'image2pipe',
    '-vf', 'scale=640:480',
    '-q:v', '5',
    '-update', '1',
    '-vcodec', 'yuyv422',
    'pipe:1'
]);
ffmpeg.stdout.on('data', (chunk) => {
    console.log(`Received ${chunk.length} bytes of data`);
    for (const client of clients) {
        client.write(chunk);
    }
});
ffmpeg.stderr.on('data', (data) => {
    // Uncomment to debug FFmpeg logs
    console.error(`FFmpeg stderr: ${data}`);
});
ffmpeg.on('exit', (code) => {
    //clients.forEach(c => c.end());
    console.log(`FFmpeg exited with code ${code}`);
});
exports.server.listen(3000, () => {
    console.log(' WebSocket MJPEG stream running at http://localhost:3000');
});
