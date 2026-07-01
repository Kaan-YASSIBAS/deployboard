# k3s Setup and Deployment

This document describes the current k3s setup and DeployBoard deployment milestone.

## Cluster Overview

DeployBoard is deployed on a single-node k3s Kubernetes cluster running on AWS EC2.

Current verified node status:

```text
NAME              STATUS   ROLES           VERSION
ip-172-31-46-17   Ready    control-plane   v1.36.2+k3s1
```

## Instance Notes

The first attempt used `t3.micro`, but k3s had memory pressure issues, including:

```text
context deadline exceeded
TLS handshake timeout
Slow SQL
Handler timeout
```

The instance was upgraded to `t3.small`, after which k3s successfully ran.

## kubeconfig Setup

The kubeconfig was configured with:

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown ubuntu:ubuntu ~/.kube/config
chmod 600 ~/.kube/config
echo 'export KUBECONFIG=$HOME/.kube/config' >> ~/.bashrc
```

## Verified Ingress Chain

A test nginx deployment was used earlier to confirm the ingress path:

```text
AWS EC2
  -> k3s
  -> Traefik Ingress
  -> Kubernetes Service
  -> nginx Pod
  -> HTTP 200 OK
```

## DeployBoard Kubernetes Resources

DeployBoard uses the `deployboard` namespace.

Resources:

```text
Namespace:
- deployboard

Deployments:
- deployboard-backend
- deployboard-frontend

Services:
- deployboard-backend
- deployboard-frontend

Ingress:
- deployboard-ingress
```

## Container Images

```text
ghcr.io/kaan-yassibas/deployboard-backend:latest
ghcr.io/kaan-yassibas/deployboard-frontend:latest
```

## Ingress Routing

| Path | Target |
|---|---|
| `/` | Frontend service |
| `/api` | Backend service |
| `/health` | Backend service |

## Apply Manifests

From the repository on the EC2 instance:

```bash
kubectl apply -f k8s/
```

## Verification Commands

```bash
kubectl get pods -n deployboard
kubectl get svc -n deployboard
kubectl get ingress -n deployboard
curl -I http://localhost
curl http://localhost/health
curl http://localhost/api/v1/monitors
```

## Verified Successful Results

The following results were verified:

```text
deployboard-backend    1/1 Running
deployboard-frontend   1/1 Running
```

Frontend check:

```text
HTTP/1.1 200 OK
```

Backend health check:

```json
{
  "status": "ok",
  "service": "deployboard-api",
  "version": "0.1.0",
  "environment": "production"
}
```

Monitor API check:

```json
[]
```

## Public Browser Verification

The dashboard was opened successfully from a browser using the EC2 public IPv4 address.

This confirms the full chain:

```text
Browser
  -> EC2 Public IP
  -> AWS Security Group :80
  -> k3s Traefik Ingress
  -> Frontend Service
  -> Frontend Pod
  -> Backend API routes
  -> Backend Pod
```

## Current Deployment Milestone

DeployBoard is no longer only a local FastAPI/React project.

It is now running as a cloud-native application on AWS with:

- Docker images
- GitHub Container Registry
- Kubernetes Deployments
- Kubernetes Services
- Traefik Ingress
- Public HTTP access
- Production environment configuration

## Manual Release Flow

Backend:

```bash
docker build -t ghcr.io/kaan-yassibas/deployboard-backend:latest ./backend
docker push ghcr.io/kaan-yassibas/deployboard-backend:latest
kubectl rollout restart deployment/deployboard-backend -n deployboard
kubectl rollout status deployment/deployboard-backend -n deployboard
```

Frontend:

```bash
docker build --build-arg VITE_API_BASE_URL=http://<EC2_PUBLIC_IP> -t ghcr.io/kaan-yassibas/deployboard-frontend:latest ./frontend
docker push ghcr.io/kaan-yassibas/deployboard-frontend:latest
kubectl rollout restart deployment/deployboard-frontend -n deployboard
kubectl rollout status deployment/deployboard-frontend -n deployboard
```

## Next Improvements

Planned next steps:

- Persistent backend storage
- Scheduled monitor checks
- Incident model and lifecycle
- Uptime percentage calculation
- CI/CD with GitHub Actions
- HTTPS support
- Observability improvements
