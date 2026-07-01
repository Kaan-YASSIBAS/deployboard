# DeployBoard Architecture

DeployBoard is a cloud-native uptime monitoring dashboard built for DevOps, AWS, and Kubernetes practice.

The goal is to let users register websites or API endpoints and monitor their availability, response time, HTTP status codes, check history, and incidents from a modern dashboard.

## Current MVP Architecture

```text
Browser
  |
  | HTTP
  v
AWS EC2 Public IPv4
  |
  v
k3s Traefik Ingress
  |
  +-- /       -> deployboard-frontend Service -> React Frontend Pod
  |
  +-- /api    -> deployboard-backend Service  -> FastAPI Backend Pod
  |
  +-- /health -> deployboard-backend Service  -> FastAPI Backend Pod
```

## Components

### Frontend

- React
- Vite
- Tailwind CSS
- Recharts
- lucide-react
- Served by Nginx in a container

The frontend provides the monitoring dashboard, monitor creation form, status cards, response time chart, monitor list, and recent incidents section.

### Backend

- FastAPI
- Pydantic
- httpx
- In-memory storage for the current MVP

The backend provides monitor CRUD endpoints, real URL checks, response time measurement, UP/DOWN status calculation, and check history.

### Kubernetes

DeployBoard currently runs on a single-node k3s Kubernetes cluster on AWS EC2.

Kubernetes resources:

- Namespace
- Backend Deployment
- Backend Service
- Frontend Deployment
- Frontend Service
- Traefik Ingress

### Container Registry

Docker images are hosted on GitHub Container Registry:

```text
ghcr.io/kaan-yassibas/deployboard-backend:latest
ghcr.io/kaan-yassibas/deployboard-frontend:latest
```

## Current Limitations

The current MVP uses in-memory backend storage. Data is lost when the backend pod restarts.

Planned improvements:

- Persistent database
- Scheduled checks
- Real incident lifecycle
- Uptime percentage calculation
- Authentication
- CI/CD with GitHub Actions
- AWS-native persistence with DynamoDB
- Monitoring and logs with CloudWatch
