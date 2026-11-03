# Dev image for the Frontend Challenges web app.
# The repo is bind-mounted at /app (challenge content lives outside web/),
# node_modules stay inside the container volume. Debian (glibc) so native
# dependencies are shared with the Playwright image used for e2e tests.
FROM node:22-bookworm-slim

# npm 10 (bundled with node 22) fails to resolve vitest 4's optional peer deps
RUN npm install -g npm@11.21.1

WORKDIR /app/web

COPY web/package.json web/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
