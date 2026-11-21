# M.A.R.A. API

> **Project Status: Discontinued / Portfolio Archive**

M.A.R.A. (Moto Auto Road Assistant) was my first major software project, created to bring together automotive and motorcycle enthusiasts, workshops, events, and related services.

## What This Repository Contains

The former backend of M.A.R.A. It also served endpoints for other personal projects. Those endpoints have since moved to a separate service and are not part of M.A.R.A.

## Tech Stack

- Node.js 22 and TypeScript
- Express 5
- MongoDB with Mongoose
- Firebase Admin
- AWS S3 client for image storage
- JWT and bcrypt for authentication
- Google and Apple sign-in token verification
- node-cron for scheduled tasks
- OneSignal and OpenAI integrations
- i18n for localized messages
- Swagger UI for API documentation
- Docker for packaging

## Main Features

- User registration and login, including SMS verification
- Events and workshops
- Map, places, and user locations
- Telegram channels
- Subscriptions for events, workshops, and adverts
- Localized API messages

## Notes

The deployment workflows and the infrastructure synchronization workflow were removed when the project was archived. The remaining CI workflow only type-checks and builds the code.

## Project Status

- The project is **discontinued** and no longer maintained.
- The production services of M.A.R.A. have been shut down.
- This repository is preserved for reading and reference only.
- Some external integrations (Firebase, push notifications, SMS, maps, and similar third-party services) may no longer work.
- The code is not intended to run in production without additional setup, new credentials, and new infrastructure.

## Why This Repository Is Public

The project was eventually discontinued because it was no longer relevant to my current priorities. I decided to preserve the source code as part of my development portfolio, documenting my early experience in building and maintaining a multi-component software product.

M.A.R.A. consisted of four repositories: `MARA-app` (mobile app), `MARA-api` (backend), `MARA-web` (web part), and `MARA-websocket` (real-time service).

No license has been chosen for this repository, so all rights are reserved by the author.
