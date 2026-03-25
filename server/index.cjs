const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const admin = require('firebase-admin');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DB_NAME = process.env.MONGODB_DB_NAME || 'mayacombi';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'leobeni46@gmail.com')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

let firebaseInitialized = false;
const initFirebase = () => {
  if (firebaseInitialized) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  try {
    let serviceAccount = null;
    if (raw) {
      serviceAccount = JSON.parse(raw);
    } else if (base64) {
      serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    } else if (path) {
      serviceAccount = require(path);
    }

    if (serviceAccount) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      firebaseInitialized = true;
    }
  } catch (error) {
    console.error('Error al inicializar Firebase Admin:', error.message);
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    initFirebase();
    if (!firebaseInitialized) {
      return res.status(500).json({ message: 'Firebase Admin no configurado.' });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return res.status(401).json({ message: 'Token de autenticacion requerido.' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const email = String(decoded.email || '').toLowerCase();
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ message: 'Acceso restringido a administradores.' });
    }

    req.adminEmail = email;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalido o expirado.' });
  }
};

app.use(cors());
app.use(express.json());

const tripSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    route: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    seats: { type: Number, required: true, min: 1 }
  },
  { versionKey: false }
);

const passengerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true }
  },
  { timestamps: true, versionKey: false }
);

const reservationSchema = new mongoose.Schema(
  {
    passengerName: { type: String, required: true, trim: true },
    passengerEmail: { type: String, required: true, lowercase: true, trim: true },
    tripId: { type: String, required: true, trim: true },
    seatNumber: { type: Number, required: true, min: 1 },
    paid: { type: Boolean, required: true, default: false }
  },
  { timestamps: true, versionKey: false }
);

reservationSchema.index({ tripId: 1, seatNumber: 1 }, { unique: true });

const Trip = mongoose.model('Trip', tripSchema);
const Passenger = mongoose.model('Passenger', passengerSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);

const seedTrips = [
  { id: 'PB-0700', route: 'Palenque - Balancan', time: '07:00', price: 140, seats: 14 },
  { id: 'PB-1500', route: 'Palenque - Balancan', time: '15:00', price: 140, seats: 14 },
  { id: 'PZ-0800', route: 'Palenque - Zapata', time: '08:00', price: 120, seats: 14 },
  { id: 'PZ-1600', route: 'Palenque - Zapata', time: '16:00', price: 120, seats: 14 },
  { id: 'BP-1000', route: 'Balancan - Palenque', time: '10:00', price: 140, seats: 14 },
  { id: 'ZP-1130', route: 'Zapata - Palenque', time: '11:30', price: 120, seats: 14 }
];

const mapReservation = (reservation) => ({
  id: reservation._id.toString(),
  passengerName: reservation.passengerName,
  passengerEmail: reservation.passengerEmail,
  tripId: reservation.tripId,
  seatNumber: reservation.seatNumber,
  paid: reservation.paid,
  createdAt: reservation.createdAt
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, email } = req.body ?? {};

    if (!name || !email) {
      return res.status(400).json({ message: 'Nombre y correo son obligatorios.' });
    }

    const normalized = {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase()
    };

    await Passenger.findOneAndUpdate({ email: normalized.email }, normalized, {
      upsert: true,
      new: true,
      runValidators: true
    });

    return res.json({ passenger: normalized });
  } catch (error) {
    return res.status(500).json({ message: 'No se pudo iniciar sesion.' });
  }
});

app.get('/api/trips', async (_req, res) => {
  try {
    const trips = await Trip.find().sort({ route: 1, time: 1 }).lean();
    return res.json({ trips });
  } catch (error) {
    return res.status(500).json({ message: 'No se pudieron obtener los viajes.' });
  }
});

app.get('/api/reservations', async (_req, res) => {
  try {
    const email = (_req.query.email || '').toString().trim().toLowerCase();
    if (!email) {
      return res.status(403).json({ message: 'Se requiere correo para consultar reservas.' });
    }

    const reservations = await Reservation.find({ passengerEmail: email }).sort({ createdAt: -1 }).lean();
    return res.json({ reservations: reservations.map(mapReservation) });
  } catch (error) {
    return res.status(500).json({ message: 'No se pudieron obtener las reservas.' });
  }
});

app.get('/api/admin/reservations', requireAdmin, async (_req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 }).lean();
    return res.json({ reservations: reservations.map(mapReservation) });
  } catch (error) {
    return res.status(500).json({ message: 'No se pudieron obtener las reservas.' });
  }
});

app.get('/api/trips/:tripId/seats', async (req, res) => {
  try {
    const trip = await Trip.findOne({ id: req.params.tripId }).lean();

    if (!trip) {
      return res.status(404).json({ message: 'Viaje no encontrado.' });
    }

    const reservations = await Reservation.find({ tripId: req.params.tripId }).select('seatNumber -_id').lean();
    const takenSeats = reservations.map((item) => item.seatNumber);

    return res.json({
      tripId: trip.id,
      totalSeats: trip.seats,
      takenSeats,
      availableSeats: trip.seats - takenSeats.length
    });
  } catch (error) {
    return res.status(500).json({ message: 'No se pudo consultar disponibilidad.' });
  }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const { passengerName, passengerEmail, tripId, seatNumber, paid } = req.body ?? {};

    if (!passengerName || !passengerEmail || !tripId || !seatNumber) {
      return res.status(400).json({ message: 'Faltan datos para la reserva.' });
    }

    if (!paid) {
      return res.status(400).json({ message: 'El pago debe estar confirmado para reservar.' });
    }

    const trip = await Trip.findOne({ id: tripId }).lean();

    if (!trip) {
      return res.status(404).json({ message: 'Viaje no encontrado.' });
    }

    const seat = Number(seatNumber);
    if (Number.isNaN(seat) || seat < 1 || seat > trip.seats) {
      return res.status(400).json({ message: 'Numero de asiento invalido para este viaje.' });
    }

    const reservation = await Reservation.create({
      passengerName: String(passengerName).trim(),
      passengerEmail: String(passengerEmail).trim().toLowerCase(),
      tripId,
      seatNumber: seat,
      paid: Boolean(paid)
    });

    return res.status(201).json({ reservation: mapReservation(reservation) });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Ese asiento ya fue reservado en este viaje.' });
    }
    return res.status(500).json({ message: 'No se pudo completar la reserva.' });
  }
});

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    const result = await Reservation.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Reserva no encontrada.' });
    }
    return res.json({ message: 'Reserva cancelada correctamente.' });
  } catch (error) {
    return res.status(500).json({ message: 'No se pudo cancelar la reserva.' });
  }
});

const startServer = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('MONGODB_URI no esta definido. Agrega la variable en tu .env.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { dbName: DB_NAME });

    const totalTrips = await Trip.countDocuments();
    if (totalTrips === 0) {
      await Trip.insertMany(seedTrips);
      console.log('Viajes iniciales cargados en MongoDB.');
    }

    app.listen(PORT, () => {
      console.log(`MayaCombi API running on http://localhost:${PORT}`);
      console.log(`MongoDB conectado (${DB_NAME}).`);
    });
  } catch (error) {
    console.error('Error al conectar con MongoDB Atlas:', error.message);
    process.exit(1);
  }
};

startServer();
