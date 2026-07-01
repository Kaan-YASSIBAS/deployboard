# AWS Setup

This document describes the AWS setup used for the DeployBoard MVP deployment.

## AWS Account Safety

The project is running on the AWS Free Plan.

Cost-control steps already completed:

- AWS Budgets configured
- Root account MFA enabled
- IAM admin user created
- IAM user MFA enabled
- Daily work is done with the IAM user instead of the root account

## Budgets

Configured budgets:

```text
DeployBoard-Monthly-Limit: $5
DeployBoard-Zero-Spend-Budget: $1
```

These budgets help reduce the risk of unexpected AWS costs during development.

## IAM User

IAM user:

```text
deployboard-admin
```

Permissions:

```text
AdministratorAccess
```

This user has console access and MFA enabled.

## EC2 Instance

Current EC2 instance:

| Field | Value |
|---|---|
| Name | deployboard-k3s-node |
| Region | Europe Stockholm / eu-north-1 |
| AMI | Ubuntu Server 24.04 LTS amd64 |
| Instance Type | t3.small |
| Disk | 12 GiB gp3 |
| Security Group | deployboard-sg |
| Key Pair | deployboard-key.pem |

The project initially used `t3.micro`, but k3s had memory-related issues. The instance was upgraded to `t3.small`.

## Security Group Rules

Current inbound rules:

| Port | Source | Purpose |
|---|---|---|
| 22 | My IP | SSH access |
| 80 | 0.0.0.0/0 | Public HTTP access |
| 443 | 0.0.0.0/0 | Future HTTPS access |

## SSH Access

Example SSH command from Windows PowerShell:

```powershell
ssh -i "C:\Users\kyass\.ssh\deployboard-key.pem" ubuntu@<EC2_PUBLIC_IP>
```

Replace `<EC2_PUBLIC_IP>` with the current EC2 public IPv4 address.

## Notes

The EC2 public IPv4 address may change after stopping and starting the instance unless an Elastic IP is attached.
