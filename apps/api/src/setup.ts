import Fastify, { type FastifyInstance } from 'fastify';

import type { ConfigProblem } from './config.js';

/**
 * The server that runs when the real one cannot.
 *
 * Its whole purpose is to convert an invisible failure into a visible one. A
 * process that exits on bad configuration gives a platform nothing to show
 * except "deploy failed", and the operator then has to go and read build logs
 * to learn something the application already knew precisely.
 *
 * This starts, answers the health check so the deploy completes, and serves one
 * page listing exactly which variables are missing and what to set them to.
 * Every other route returns 503. Nothing real is exposed by coming up, because
 * without configuration there is nothing to expose — no database connection and
 * no key with which to read a credential.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const HELP: Readonly<Record<string, string>> = {
  DATABASE_URL:
    'Add a Postgres database to this Railway project, then set this variable on the service to ' +
    '${{Postgres.DATABASE_URL}}. Use the reference rather than pasting the value, so it follows ' +
    'the database if it is ever recreated.',
  CREDENTIAL_KEYS:
    'The root key that encrypts every connected social account. Generate one with:\n' +
    'node -e "console.log(\'k1:\' + require(\'crypto\').randomBytes(32).toString(\'base64\'))"\n' +
    'Back it up somewhere other than this platform — losing it means every customer must ' +
    'reconnect every account, and there is no recovery path.',
  PUBLIC_URL: 'The public origin of this service, e.g. https://your-app.up.railway.app.',
};

function page(problems: readonly ConfigProblem[]): string {
  const rows = problems
    .map(
      (problem) => `
        <li>
          <code>${escapeHtml(problem.variable)}</code>
          <p>${escapeHtml(problem.message)}</p>
          ${
            HELP[problem.variable] === undefined
              ? ''
              : `<pre>${escapeHtml(HELP[problem.variable] ?? '')}</pre>`
          }
        </li>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Setup needed</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        margin: 0; padding: 40px 24px; line-height: 1.55;
        font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      }
      main { max-width: 640px; margin: 0 auto; }
      h1 { font-size: 20px; margin: 0 0 8px; }
      .lede { opacity: 0.75; margin: 0 0 28px; }
      ul { list-style: none; padding: 0; }
      li { padding: 16px 0; border-top: 1px solid rgba(128,128,128,0.3); }
      code { font-size: 14px; font-weight: 700; }
      li p { margin: 6px 0 0; opacity: 0.8; }
      pre {
        white-space: pre-wrap; word-break: break-word;
        background: rgba(128,128,128,0.12); padding: 12px; border-radius: 8px;
        font-size: 13px; margin: 10px 0 0;
      }
      footer { margin-top: 32px; font-size: 13px; opacity: 0.7; }
    </style>
  </head>
  <body>
    <main>
      <h1>This deployment needs configuration</h1>
      <p class="lede">
        The service started but cannot run until the following are set. It is serving this
        page rather than exiting, so you can see what is missing instead of reading build logs.
      </p>
      <ul>${rows}</ul>
      <footer>
        Set these as service variables, then redeploy. Full documentation is in
        <code>DEPLOYMENT.md</code>.
      </footer>
    </main>
  </body>
</html>`;
}

export function buildSetupServer(
  problems: readonly ConfigProblem[],
  logLevel = 'info',
): FastifyInstance {
  const app = Fastify({ logger: { level: logLevel }, trustProxy: true });

  // Answers so the platform's deploy gate opens and the page becomes reachable.
  // A gate that never opens is exactly how this failure stayed invisible.
  app.get('/health', async () => ({ status: 'setup_required' }));

  app.get('/ready', async (_request, reply) =>
    reply.code(503).send({
      status: 'setup_required',
      missing: problems.map((p) => p.variable),
    }),
  );

  // Machine-readable, for anyone diagnosing from a terminal.
  app.get('/api/setup', async (_request, reply) =>
    reply.code(503).send({ status: 'setup_required', problems }),
  );

  app.setNotFoundHandler(async (request, reply) => {
    if (request.headers.accept?.includes('text/html') === true) {
      return reply.code(503).type('text/html').send(page(problems));
    }
    return reply.code(503).send({
      status: 'setup_required',
      missing: problems.map((p) => p.variable),
    });
  });

  return app;
}
