# Cost Control

This project is designed to stay small and cost-conscious while practicing AWS, Docker, and Kubernetes.

## Current Cost-Control Measures

Completed:

- AWS Free Plan is used
- Root MFA enabled
- IAM admin user created
- IAM user MFA enabled
- AWS Budgets created
- Small EC2 instance selected
- Single-node k3s cluster used instead of managed Kubernetes
- No paid managed database is currently used
- No load balancer is currently used
- No NAT Gateway is currently used

## AWS Budgets

Configured budgets:

```text
DeployBoard-Monthly-Limit: $5
DeployBoard-Zero-Spend-Budget: $1
```

## EC2 Instance Cost Awareness

The current instance type is:

```text
t3.small
```

This was chosen because `t3.micro` did not provide enough memory for k3s during testing.

Important:

- Stop the EC2 instance when not actively using the project.
- Check AWS Billing regularly.
- Avoid creating AWS Load Balancers until needed.
- Avoid NAT Gateway unless the architecture requires it.
- Avoid managed databases until the project is ready for persistence.

## Resources to Watch

Pay attention to:

- EC2 running hours
- EBS volume usage
- Public IPv4 address charges if applicable
- Data transfer
- Future managed services such as DynamoDB, S3, CloudWatch, and Load Balancers

## Future Cost Improvements

Possible improvements:

- Use an Elastic IP only if the project needs a stable IP.
- Add GitHub Actions carefully to avoid unnecessary builds.
- Use DynamoDB with a very small free-tier-friendly design.
- Add CloudWatch logs with limited retention.
