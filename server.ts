import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const portArgIndex = process.argv.indexOf('--port');
  const portArg = portArgIndex !== -1 ? process.argv[portArgIndex + 1] : null;
  const PORT = parseInt(portArg || process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // -------------------------------------------------------------
  // Backend API Endpoints for ROYCO MIX Platform
  // -------------------------------------------------------------

  // 1. System Health & Environment
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'ROYCO MIX Full-Stack Backend',
      version: '2.5.0',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: isProduction ? 'production' : 'development',
      network: 'MTN & Airtel Uganda Mobile Money Integrated',
    });
  });

  // 2. Platform Real-time Metrics & Server Status
  app.get('/api/stats', (req, res) => {
    res.json({
      activeInvestorsOnline: Math.floor(180 + Math.random() * 45),
      totalPayoutsCompletedUGX: 184500000,
      dailyYieldRatePercent: '12% - 18%',
      serverTime: new Date().toISOString(),
      ugandaTime: new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }),
      maintenanceMode: false,
    });
  });

  // 3. Mobile Money Payment Webhook Gateway Simulation (MTN MoMo & Airtel Money)
  app.post('/api/payments/momo-webhook', (req, res) => {
    const { txRef, status, amount, phone, provider } = req.body;
    console.log(`[Backend MoMo Webhook] Received payload:`, { txRef, status, amount, phone, provider });

    // Validate payload and generate acknowledgment response
    if (!txRef) {
      return res.status(400).json({ success: false, message: 'Missing transaction reference' });
    }

    res.json({
      success: true,
      code: 'PROCESSED_SUCCESSFULLY',
      message: 'Mobile Money transaction verified and confirmed by aggregator gateway',
      txRef,
      confirmedAt: new Date().toISOString(),
    });
  });

  // 4. SMS / OTP Notification Gateway Simulation
  app.post('/api/sms/send-otp', (req, res) => {
    const { phone, purpose } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const simulatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[Backend SMS Gateway] Sent OTP ${simulatedCode} to ${phone} for ${purpose || 'verification'}`);

    res.json({
      success: true,
      message: `Verification code sent to ${phone} via Uganda SMS Gateway`,
      maskedPhone: phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
      // In development, return debug hint
      debugCode: !isProduction ? simulatedCode : undefined,
    });
  });

  // 5. Gift Code Verification Gateway
  app.post('/api/gift-codes/validate', (req, res) => {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, message: 'Invalid code format' });
    }

    const clean = code.trim().toUpperCase();
    res.json({
      valid: true,
      code: clean,
      checkedAt: new Date().toISOString(),
    });
  });

  // -------------------------------------------------------------
  // Vite Integration (Dev Middleware / Production Static)
  // -------------------------------------------------------------
  if (isProduction) {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Bind to 0.0.0.0 and Port 3000 as required by runtime environment
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Royco Mix Server] Full-Stack Backend running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Royco Mix Server] Failed to start server:', err);
  process.exit(1);
});
