---
sidebar_position: 4
---

# Use Docker for Neo4j

The generated project includes a `docker-compose.yml` that runs Neo4j locally in a Docker container. This is the default setup when you don't specify `--neo4j-aura-env` or `--neo4j-local`.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

## Step 1: Scaffold Your Project

```bash
uvx create-context-graph my-app \
  --domain healthcare \
  --framework pydanticai \
  --demo-data
```

By default, the generated project uses Docker for Neo4j with these settings:

```env
NEO4J_URI=neo4j://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
```

## Step 2: Start Neo4j

```bash
cd my-app
make docker-up
```

This runs `docker-compose up -d` which starts Neo4j on:
- **Bolt**: `localhost:7687` (driver connections)
- **Browser**: `localhost:7474` (Neo4j Browser UI)

## Step 3: Verify and Seed

```bash
make test-connection  # Verify Neo4j is reachable
make seed             # Load demo data
```

## Step 4: Start the Application

```bash
make install
make start
```

## Managing the Neo4j Container

```bash
# Stop Neo4j
make docker-down

# View logs
docker-compose logs neo4j

# Reset all data
make docker-down
docker volume rm $(docker volume ls -q | grep neo4j)
make docker-up
```

## Data Persistence

Neo4j data is stored in a Docker volume. Your data persists across container restarts. To start fresh, remove the volume as shown above.

## Using Neo4j Browser

While the container is running, open [http://localhost:7474](http://localhost:7474) to access the Neo4j Browser. Connect with:

- **Connect URL**: `neo4j://localhost:7687`
- **Username**: `neo4j`
- **Password**: `password`

You can run Cypher queries directly to inspect your knowledge graph.

## Troubleshooting

### Port already in use

If port 7687 or 7474 is already in use, either stop the conflicting service or update the ports in `docker-compose.yml`.

### Container won't start

Check Docker logs:

```bash
docker-compose logs neo4j
```

Common issues:
- Insufficient memory — Neo4j needs at least 512MB RAM
- File permission issues on the data volume

## Further Reading

- [Use Neo4j Aura](/docs/how-to/use-neo4j-aura) -- alternative: free managed cloud database
- [Use Neo4j Local](/docs/how-to/use-neo4j-local) -- alternative: run Neo4j without Docker
- [Quick Start](/docs/quick-start) -- get a full app running in under 5 minutes
