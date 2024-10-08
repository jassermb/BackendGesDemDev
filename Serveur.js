const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const server = http.createServer(app);
app.use(cors({
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true 
}));
app.use(bodyParser.json());

const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000', 
        methods: ['GET', 'POST', 'PUT', 'DELETE'], 
        credentials: true 
    }
});
 
const users = {}; 
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('register', (data) => {
        const { userId, role } = data;
        users[userId] = { socket, role };
        console.log(`User ${userId} with role ${role} registered.`);
    });
    socket.on('send_notification', (notification) => {
        for (let userId in users) {
            if (users[userId].role === notification.role) {
                users[userId].socket.emit('notification', notification);
            }
        }
    });
    socket.on('disconnect', () => {
        for (let userId in users) {
            if (users[userId].socket === socket) {
                delete users[userId];
                console.log(`User ${userId} disconnected.`);
                break;
            }
        }
    });
});

const userRoutes = require('./routes/authRoutes');
const developmentRoutes = require('./routes/developmentRoutes');
const developmentpart3Routes = require('./routes/demdevpart3');
app.use('/api/demdevp3', developmentpart3Routes);


app.use('/api/users', userRoutes);
app.use('/api/demdev', developmentRoutes);

const staticFilesPath = 'C:/Users/jasse/OneDrive/Bureau/form/backgesdemdev/upload';
app.use('/upload', express.static(staticFilesPath));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
