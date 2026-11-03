# Portable test deployment

## Build and run from this checkout

Requires Docker Desktop. From PowerShell in the project directory:

```powershell
./start-portable.ps1
```

The app opens at `http://localhost:8080`. The first start imports `db-snapshot/snapshot.sql` into a named Docker volume. Later starts keep the volume as-is; rebuilding the database image does not overwrite existing database data.

## Pull published images on another PC

First push this project to a repository you control. The GitHub Actions workflow publishes the app and database images to that repository owner's GitHub Container Registry on every push to `main`. Set the package visibility to Public in GitHub if the other PC should pull without `docker login`.

Clone that repository, then from the cloned folder run this in PowerShell (replace owner and repository):

```powershell
$owner = "YOUR_GITHUB_OWNER"; git clone "https://github.com/$owner/YOUR_REPOSITORY.git" conduit; Set-Location conduit; @("CONDUIT_OWNER=$owner", "JWT_KEY=replace-with-a-long-random-secret") | Set-Content .env; docker compose -f docker-compose.remote.yml pull; docker compose -f docker-compose.remote.yml up -d
```

The first published database image contains this snapshot. The MySQL volume persists later changes and is not overwritten by subsequent pulls. To intentionally restore the bundled snapshot, stop the stack and remove its volume with `docker compose -f docker-compose.remote.yml down -v` before starting it again; this deletes the current database data.

The current Git remote points to the original upstream project. Do not push these changes there; configure your own repository as `origin` before publishing.
