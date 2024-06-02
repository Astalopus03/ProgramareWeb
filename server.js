const express = require('express');
const app = express();
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./User'); // Importă modelul User
const mongoose = require ('mongoose');
const uri = "mongodb+srv://rares:rares@rares.7cyzal1.mongodb.net/?retryWrites=true&w=majority&appName=Rares";
const bcrypt = require('bcryptjs');
const socketIo = require('socket.io');
const http = require('http');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const JWT_SECRET = 'spersatreclaboratoruldelaprogramareweb';
const WebSocket = require('ws');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
   app.get('/Async', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Async.html'));
  });
  app.get('/LogIn_SignIn', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'LogIn_SignIn.html'));
  });
  app.get('/Ajax', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Ajax.html'));
  });
  app.get('/WebSockets', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'WebSockets.html'));
  });
  app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  });
  app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
  });

  app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
      // Verificare dacă utilizatorul există deja
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return res.status(400).json({ message: 'Adresa de email este deja folosită.' });
      }
      // // Criptare parolă
      // const salt = await bcrypt.genSalt(10);
      // const hashedPassword = await bcrypt.hash(password, salt);
      // Creare utilizator nou
      // const newUser = new User({ username, email, password: hashedPassword });
      // await newUser.save();
      const user = await User.create({username, email, password})
      console.log(user);
      res.status(201).json({ message: 'Utilizator înregistrat cu succes.' });
    } catch (error) {
      console.error('Eroare la înregistrare:', error.message);
      res.status(500).json({ message: 'Eroare la înregistrare. Vă rugăm să încercați din nou.' });
    }
  });
  
  mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conectat la baza de date MongoDB!'))
    .catch(err => console.error('Eroare la conectarea la MongoDB:', err));

// Configurare strategie locală de autentificare
passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    User.findOne({ email: email }, (err, user) => {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Adresa de email incorectă.' });
      }
      user.comparePassword(password, (err, isMatch) => {
        if (err) { return done(err); }
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Parola incorectă.' });
        }
      });
    });
  }));

  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      // Caută utilizatorul în baza de date după username
      const user = await User.findOne({ username: username });
      if (!user) {
        return res.status(400).json({ message: 'Credențiale invalide.' });
      }
      // Verificare parolă
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Credențiale invalide.' });
      }

        // Generare JWT
      const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

      // Setare JWT ca și cookie
      res.cookie('token', token, { httpOnly: true });

      // Autentificare reușită
      res.status(200).json({ message: 'Autentificare reușită.' });
    } catch (error) {
      console.error('Eroare la autentificare:', error.message);
      res.status(500).json({ message: 'Eroare la autentificare. Vă rugăm să încercați din nou.' });
    }
  });


  // Middleware pentru a verifica autentificarea utilizatorilor
  function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Nu sunteți autentificat.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalid.' });
    }
    req.user = user;
    next();
  });
}
// Rută protejată
app.get('/protected', authenticateToken, (req, res) => {
  res.status(200).json({ message: `Salut, ${req.user.email}. Acesta este un conținut protejat.` });
});
  
  // Serializare utilizatorului
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserializare utilizatorului
  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });

  app.get('/users', async (req, res) => {
    try {
      const { username } = req.query;
      let query = {};
      if (username) {
        query = { username: new RegExp(username, 'i') }; // Căutare case-insensitive
      }
      let users = await User.find(query, 'username email');
      res.status(200).json(users);
    } catch (error) {
      res.status(400).json({ err: "nu mere" });
    }
  });

  let uName;
  const setName = (name) => {
      uName = name;
  }
  const getName = () => {
      return uName;
  }

  // Rută pentru a verifica autentificarea și a obține informațiile utilizatorului
  app.get('/me', authenticateToken, (req, res) => {
    setName(req.user.username);
    console.log(getName());
    res.status(200).json({ username: req.user.username, email: req.user.email });
  });
 

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('WebSocket server is running');
});
//Integrate WebSocket with the HTTP server
const wss = new WebSocket.Server({port: 8181});
const clients = [];

wss.on('connection', function connection(ws) {
    console.log("WS connection arrived");
    // Add the new connection to our list of clients
    clients.push(ws);

    ws.on('message', function incoming(message) {
      
        // Broadcast the message to all clients
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(`• ${getName()}:`  + message.toString());
            }
        });
    });
    ws.on('close', () => {
        // Remove the client from the array when it disconnects
        const index = clients.indexOf(ws);
        if (index > -1) {
            clients.splice(index, 1);
        }
    });
});
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
  });
})


  const PORT = process.env.PORT || 3002; // Portul serverului
  app.listen(PORT, () => console.log(`Serverul rulează pe portul ${PORT}`));
