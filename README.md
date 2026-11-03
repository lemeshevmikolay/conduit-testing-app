# ![Conduit](logo.svg)

> Full stack [RealWorld](https://realworld.io/) example app built with React, Vite, Express, Sequelize, and MySQL. It includes authentication, articles, comments, profiles, favorites, and tags.

**[Demo app](https://conduit-realworld-example-app.fly.dev/)&nbsp;&nbsp;|&nbsp;&nbsp;[With Create React App](https://github.com/TonyMckes/conduit-realworld-example-app/tree/create-react-app)&nbsp;&nbsp;|&nbsp;&nbsp;[Other RealWorld Example Apps](https://codebase.show/projects/realworld?category=fullstack)**

> For more information on how to this works with other frontends/backends, head over to the [RealWorld](https://github.com/gothinkster/realworld) repo.

---

## Getting Started

These instructions describe how to install, configure, and run Conduit locally.

### Prerequisites

Before you run the project, make sure that you have the following tools and software installed on your computer:

- Text editor/IDE (e.g., VS Code, Sublime Text, Atom)
- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en/download/) `v20.19+` (or `v22.12+`)
- [NPM](https://www.npmjs.com/) (usually included with Node.js)
- Docker Desktop with Docker Compose

### Installation

To install the project on your computer, follow these steps:

1. Clone the repository to your local machine.

   ```bash
   git clone https://github.com/TonyMckes/conduit-realworld-example-app.git
   ```

2. Navigate to the project directory.

   ```bash
   cd conduit-realworld-example-app
   ```

3. Install the frontend and backend dependencies from the repository root:

   ```bash
   npm install
   ```

### Configuration

Copy `.env.example` to `.env` in the repository root. The defaults are for local development; the MySQL container and database are created automatically. Change `MYSQL_ROOT_PASSWORD`, `DEV_DB_PASSWORD`, and `JWT_KEY` before sharing this setup.

### Usage

#### Development Server

To run the project, follow these steps:

From the repository root, run:

```bash
npm run dev
```

This starts MySQL with Docker Compose, creates the database tables, seeds demo content on first launch, and runs the API and web app together. Open [`http://localhost:3000/`](http://localhost:3000). The API is at [`http://localhost:3001`](http://localhost:3001). Stop the app with `Ctrl+C`; stop MySQL with `npm run db:down`. Its data is kept in a Docker volume.

The demo database contains 50 Ukrainian-language technology notes, demo profiles inspired by ten Ukrainian products, custom avatars, tags, comments and favorites. These profiles are fictional and are not official company accounts. Demo sign-in uses password `ConduitDemo2026!`; change or delete these accounts before exposing the app beyond your machine. Run `npm run db:seed` to add any missing demo content again.

Open [`http://localhost:3000/`](http://localhost:3000). Vite proxies `/api` requests to the backend at [`http://localhost:3001`](http://localhost:3001). The backend health response is available at [`http://localhost:3001/`](http://localhost:3001/).

#### Running Tests

To run tests, simply run the following command:

```bash
npm run test
```

#### Requirements and API documentation

- [System requirements, acceptance criteria, implementation traceability, and diagrams](docs/requirements/system-requirements.md)
- [OpenAPI specification](docs/api/openapi.yaml)
- Interactive Swagger UI: [`http://localhost:3001/api-docs`](http://localhost:3001/api-docs) while the backend is running.

#### Production

Build the frontend and start the production backend with:

```bash
npm run start
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [RealWorld](https://realworld.io/)
- [RealWorld (GitHub)](https://github.com/gothinkster/realworld)
- [CodebaseShow](https://codebase.show/)
- [How to write a Good readme](https://bulldogjob.com/news/449-how-to-write-a-good-readme-for-your-github-project)
