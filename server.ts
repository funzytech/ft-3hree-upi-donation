import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type VerificationStatus = 'initiated' | 'pending_verification' | 'verified';

interface DonationRecord {
  id: string;
  amount: number | null;
  currency: 'INR';
  upiId: string;
  verificationStatus: VerificationStatus;
  reportedAt: string;
  verifiedAt: string | null;
  donorName: string | null;
  donorAvatar: string | null;
  publicConsent: boolean;
}

const DATA_DIR = path.resolve(__dirname, 'data');
const DONATIONS_FILE = path.join(DATA_DIR, 'donations.json');

function ensureStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DONATIONS_FILE)) {
    fs.writeFileSync(DONATIONS_FILE, '[]', 'utf8');
  }
}

function readDonations(): DonationRecord[] {
  try {
    ensureStorage();
    const raw = fs.readFileSync(DONATIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDonations(records: DonationRecord[]): void {
  ensureStorage();
  fs.writeFileSync(DONATIONS_FILE, JSON.stringify(records, null, 2), 'utf8');
}

async function startServer() {
  const app = express();
  const port = 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'FT.3hree Donation Server',
      timestamp: new Date().toISOString(),
    });
  });

  // Public homepage feed: strictly returns ONLY independently verified donations
  // where the donor voluntarily provided name, avatar, and explicit public display consent.
  app.get('/api/donations/verified', (_req, res) => {
    const records = readDonations();
    const verifiedPublic = records
      .filter(
        (rec) =>
          rec.verificationStatus === 'verified' &&
          rec.publicConsent === true &&
          typeof rec.donorName === 'string' &&
          rec.donorName.trim().length > 0 &&
          typeof rec.donorAvatar === 'string' &&
          rec.donorAvatar.trim().length > 0 &&
          typeof rec.amount === 'number' &&
          rec.amount > 0
      )
      .sort((a, b) => {
        const tA = new Date(a.verifiedAt || a.reportedAt).getTime();
        const tB = new Date(b.verifiedAt || b.reportedAt).getTime();
        return tB - tA;
      })
      .map((rec) => ({
        id: rec.id,
        donorName: rec.donorName,
        donorAvatar: rec.donorAvatar,
        amount: rec.amount,
        verifiedAt: rec.verifiedAt || rec.reportedAt,
      }));

    res.json({ donations: verifiedPublic });
  });

  // Donor reports completing a UPI donation -> stored strictly as 'pending_verification'
  app.post('/api/donations/report', (req, res) => {
    const rawAmount = req.body?.amount;
    const parsedAmount =
      typeof rawAmount === 'number' && Number.isFinite(rawAmount) && rawAmount > 0
        ? Math.round(rawAmount)
        : null;

    const record: DonationRecord = {
      id: `don_${crypto.randomBytes(8).toString('hex')}`,
      amount: parsedAmount,
      currency: 'INR',
      upiId: 'FT.3hree',
      verificationStatus: 'pending_verification',
      reportedAt: new Date().toISOString(),
      verifiedAt: null,
      donorName: null,
      donorAvatar: null,
      publicConsent: false,
    };

    const records = readDonations();
    records.push(record);
    writeDonations(records);

    res.status(201).json({
      id: record.id,
      amount: record.amount,
      verificationStatus: record.verificationStatus,
    });
  });

  // Optional donor profile submission tied to a reported donation record
  app.patch('/api/donations/:id/donor', (req, res) => {
    const { id } = req.params;
    const rawName = typeof req.body?.donorName === 'string' ? req.body.donorName.trim() : '';
    const rawAvatar = typeof req.body?.donorAvatar === 'string' ? req.body.donorAvatar.trim() : '';
    const publicConsent = req.body?.publicConsent === true;

    if (!rawName || rawName.length > 60) {
      res.status(400).json({ error: 'Please enter a valid name (1-60 characters).' });
      return;
    }

    if (!rawAvatar || !/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(rawAvatar) || rawAvatar.length > 450_000) {
      res.status(400).json({ error: 'Please upload a valid profile image.' });
      return;
    }

    if (!publicConsent) {
      res.status(400).json({ error: 'Public display consent is required to submit.' });
      return;
    }

    const records = readDonations();
    const index = records.findIndex((r) => r.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Donation record not found.' });
      return;
    }

    records[index] = {
      ...records[index],
      donorName: rawName,
      donorAvatar: rawAvatar,
      publicConsent: true,
      // Explicitly never elevate verificationStatus from client submission
    };

    writeDonations(records);

    res.json({
      id: records[index].id,
      verificationStatus: records[index].verificationStatus,
      saved: true,
    });
  });

  if (!isProduction) {
    app.get('/1-1', (_req, res) => res.redirect('/'));
    app.get('/1-1/*', (req, res) => res.redirect(req.url.replace(/^\/1-1/, '')));
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use('/1-1', express.static(distPath));
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`FT.3hree Donation Dashboard running at http://0.0.0.0:${port}`);
  });

  const secondaryPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 0;
  if (secondaryPort && secondaryPort !== port) {
    try {
      app.listen(secondaryPort, '0.0.0.0', () => {
        console.log(`FT.3hree server also running on port ${secondaryPort}`);
      });
    } catch {}
  }

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use, retrying connection...`);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
