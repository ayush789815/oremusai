// Production startup file for cPanel "Setup Node.js App" (Phusion Passenger).
// Passenger loads THIS file (not `npm start`) and provides the port/socket via
// process.env.PORT. We hand every request to Next.js's own request handler so
// rewrites(), routing and rendering behave exactly like `next start`.
//
// Prereqs on the server: run `npm install` then `npm run build` (creates .next)
// BEFORE starting the app, then set this file as the "Application startup file".
const { createServer } = require('http');
const next = require('next');

const port = process.env.PORT || 5174;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`Oremus Next.js ready on port ${port}`);
  });
});
