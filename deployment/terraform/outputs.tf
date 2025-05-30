# Outputs for Flextime Terraform deployment

# Networking outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.networking.vpc_cidr
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.networking.private_subnet_ids
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = module.networking.database_subnet_ids
}

# Security outputs
output "security_group_ids" {
  description = "Security group IDs"
  value       = module.security.security_group_ids
}

output "web_security_group_id" {
  description = "Web security group ID"
  value       = module.security.web_security_group_id
}

output "app_security_group_id" {
  description = "Application security group ID"
  value       = module.security.app_security_group_id
}

output "database_security_group_id" {
  description = "Database security group ID"
  value       = module.security.database_security_group_id
}

# Compute outputs
output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.compute.eks_cluster_name
}

output "eks_cluster_endpoint" {
  description = "Endpoint of the EKS cluster"
  value       = module.compute.eks_cluster_endpoint
  sensitive   = true
}

output "eks_cluster_arn" {
  description = "ARN of the EKS cluster"
  value       = module.compute.eks_cluster_arn
}

output "eks_cluster_version" {
  description = "Version of the EKS cluster"
  value       = module.compute.eks_cluster_version
}

output "eks_node_group_arn" {
  description = "ARN of the EKS node group"
  value       = module.compute.eks_node_group_arn
}

output "worker_iam_role_arn" {
  description = "ARN of the worker IAM role"
  value       = module.compute.worker_iam_role_arn
}

# Database outputs
output "database_endpoint" {
  description = "Database endpoint"
  value       = module.database.database_endpoint
  sensitive   = true
}

output "database_port" {
  description = "Database port"
  value       = module.database.database_port
}

output "database_name" {
  description = "Database name"
  value       = module.database.database_name
}

output "database_username" {
  description = "Database username"
  value       = module.database.database_username
  sensitive   = true
}

output "database_password_secret_arn" {
  description = "ARN of the database password secret"
  value       = module.database.database_password_secret_arn
  sensitive   = true
}

# Monitoring outputs
output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = module.monitoring.cloudwatch_log_group_name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = module.monitoring.cloudwatch_log_group_arn
}

# CDN outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cdn.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cdn.cloudfront_domain_name
}

output "s3_bucket_name" {
  description = "S3 bucket name for static assets"
  value       = module.cdn.s3_bucket_name
}

# Load Balancer outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.compute.alb_dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = module.compute.alb_zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = module.compute.alb_arn
}

# IAM outputs
output "cluster_service_account_role_arn" {
  description = "ARN of the cluster service account IAM role"
  value       = module.compute.cluster_service_account_role_arn
}

# Environment-specific outputs
output "environment" {
  description = "Current environment"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

# Kubernetes configuration
output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.compute.eks_cluster_name}"
}

# Application URLs
output "application_url" {
  description = "Application URL"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "http://${module.compute.alb_dns_name}"
}

# Secrets and configuration
output "kubeconfig_secret_name" {
  description = "Name of the kubeconfig secret in AWS Secrets Manager"
  value       = module.compute.kubeconfig_secret_name
  sensitive   = true
}

# Backup information
output "database_backup_window" {
  description = "Database backup window"
  value       = var.backup_window
}

output "database_backup_retention_period" {
  description = "Database backup retention period"
  value       = var.backup_retention_period
}