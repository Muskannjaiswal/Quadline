import express from 'express';
import path from 'path';
import {
  cancelRegistration,
  createEvent,
  deleteNotification,
  getPortalState,
  markAllNotificationsRead,
  markNotificationRead,
  registerForEvent,
  toggleSavedEvent,
  updateProfile,
  updateRegistration,
} from './server/store';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/bootstrap', (_req, res) => {
    res.json(getPortalState());
  });

  app.post('/api/registrations', (req, res) => {
    try {
      const result = registerForEvent(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
    }
  });

  app.patch('/api/registrations/:eventId', (req, res) => {
    try {
      const registration = updateRegistration(req.params.eventId, req.body);
      res.json({ registration });
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : 'Update failed' });
    }
  });

  app.delete('/api/registrations/:eventId', (req, res) => {
    try {
      const result = cancelRegistration(req.params.eventId);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : 'Cancellation failed' });
    }
  });

  app.post('/api/saved/:eventId', (req, res) => {
    const result = toggleSavedEvent(req.params.eventId);
    res.json(result);
  });

  app.patch('/api/notifications/:id/read', (req, res) => {
    try {
      const read = typeof req.body?.read === 'boolean' ? req.body.read : true;
      const notification = markNotificationRead(req.params.id, read);
      res.json({ notification });
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : 'Notification not found' });
    }
  });

  app.post('/api/notifications/read-all', (_req, res) => {
    const notifications = markAllNotificationsRead();
    res.json({ notifications });
  });

  app.delete('/api/notifications/:id', (req, res) => {
    deleteNotification(req.params.id);
    res.json({ ok: true });
  });

  app.post('/api/events', (req, res) => {
    try {
      const result = createEvent(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Could not publish event' });
    }
  });

  app.patch('/api/profile', (req, res) => {
    const profile = updateProfile(req.body);
    res.json({ profile });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quadline server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
