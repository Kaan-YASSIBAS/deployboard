# DeployBoard

DeployBoard is a cloud-native uptime monitoring dashboard for tracking web services, APIs, response times, and incident history.

The project is built to practice real-world DevOps and cloud engineering concepts using AWS, Kubernetes, CI/CD, monitoring, and infrastructure documentation.

## Planned Tech Stack

- Backend: FastAPI
- Frontend: React + Vite + Tailwind CSS
- Database: Amazon DynamoDB
- Object Storage: Amazon S3
- Runtime: Kubernetes with k3s on AWS EC2
- CI/CD: GitHub Actions
- Monitoring: CloudWatch
- Infrastructure: Terraform planned

## Core Features

- Add and manage monitored services
- Periodic uptime checks
- HTTP status and response time tracking
- Incident history
- Dashboard with service status cards
- Public status page planned
- Alerting planned

## Project Status

Current milestone:

- AWS account safety configured
- EC2 instance created
- k3s Kubernetes cluster installed
- Ingress test completed successfully

## Architecture

Initial deployment model:

```text
User Browser
  ↓
AWS EC2 Public IP
  ↓
k3s Traefik Ingress
  ↓
Kubernetes Service
  ↓
DeployBoard Frontend / Backend Pods
  ↓
DynamoDB + S3
```

## Goals

This project is designed as a practical DevOps and cloud computing portfolio project, focusing on:

- AWS fundamentals
- Kubernetes deployment
- Containerized applications
- CI/CD automation
- Cloud-native monitoring
- Cost-aware infrastructure usage
