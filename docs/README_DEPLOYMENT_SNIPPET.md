## Deployment Status

DeployBoard has been successfully deployed on AWS using a single-node k3s Kubernetes cluster.

Current deployment stack:

- AWS EC2
- Ubuntu Server 24.04 LTS
- k3s
- Traefik Ingress
- FastAPI backend
- React + Vite frontend
- GitHub Container Registry

Ingress routing sends `/` traffic to the frontend and `/api` plus `/health` traffic to the backend.

For more details, see:

```text
docs/k3s-setup.md
```
