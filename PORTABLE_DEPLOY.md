# Portable test deployment

The GitHub Actions workflow publishes two Docker Hub images on each push to `main`: the app and a MySQL image that imports `db-snapshot/snapshot.sql` into a new database volume. Elasticsearch and Kibana use their official images and are started by the same Compose file.

## One-time publisher setup

Create Docker Hub repositories named `conduit-app` and `conduit-db-snapshot` under your Docker Hub account and make them public. In GitHub repository **Settings → Secrets and variables → Actions**, add:

- `DOCKERHUB_USERNAME` — Docker Hub account name.
- `DOCKERHUB_TOKEN` — Docker Hub access token with read/write access to those repositories.

After the secrets are present, every push to `main` builds and pushes `latest` and commit-specific tags for both images. A push made before adding the secrets will fail; rerun the workflow after setup.

## Start on another PC

Requires Docker Desktop. In PowerShell, replace `YOUR_DOCKERHUB_USERNAME` and run:

```powershell
$user = "YOUR_DOCKERHUB_USERNAME"; git clone https://github.com/lemeshevmikolay/conduit-testing-app.git conduit; Set-Location conduit; @("DOCKERHUB_USERNAME=$user", "JWT_KEY=$([guid]::NewGuid().ToString('N'))") | Set-Content .env; docker compose -f docker-compose.remote.yml pull; docker compose -f docker-compose.remote.yml up -d
```

The app is at `http://localhost:8080`; Kibana is at `http://localhost:5601`. The image updater checks the app image every 60 seconds and recreates the app container when Docker Hub has a newer `latest` image. It watches only the app; it does not replace the database volume. An update may cause a short reconnect while the app container restarts, so uninterrupted zero downtime is not guaranteed.

The first MySQL start imports the bundled snapshot. Later restarts and image pulls preserve the named database volume. To reset to the bundled snapshot, run `docker compose -f docker-compose.remote.yml down -v` before starting again; this deletes the current database volume.

The updater needs access to Docker Engine through its socket, which grants broad control over containers on that PC. This setup is intended for a small test deployment. The original `containrrr/watchtower` project is archived; this stack uses the active `nickfedor/watchtower` fork, whose maintainer describes it for homelabs and local development rather than production deployments: https://github.com/containrrr/watchtower/discussions/2135 and https://github.com/nicholas-fedor/watchtower.

## Run locally from source

```powershell
./start-portable.ps1
```
