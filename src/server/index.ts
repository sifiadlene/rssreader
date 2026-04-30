import app from './app.js';

const port = Number.parseInt(process.env.PORT ?? '3001', 10);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`RSS backend listening on port ${port}`);
  });
}

export default app;
