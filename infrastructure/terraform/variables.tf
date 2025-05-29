# Variables for FlexTime Terraform configuration

variable "aws_region" {
  description = "AWS region for FlexTime infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development."
  }
}

variable "cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "aws_auth_users" {
  description = "List of IAM users to add to aws-auth configmap"
  type = list(object({
    userarn  = string
    username = string
    groups   = list(string)
  }))
  default = []
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway for all private subnets"
  type        = bool
  default     = false
}

# Database configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "db_allocated_storage" {
  description = "Initial allocated storage for RDS"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS autoscaling"
  type        = number
  default     = 1000
}

variable "db_backup_retention_period" {
  description = "Days to retain automated backups"
  type        = number
  default     = 7
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = true
}

# ElastiCache configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "redis_num_cache_nodes" {
  description = "Number of Redis cache nodes"
  type        = number
  default     = 2
}

variable "redis_parameter_group_name" {
  description = "Redis parameter group name"
  type        = string
  default     = "default.redis7"
}

# S3 configuration
variable "s3_bucket_versioning" {
  description = "Enable versioning for S3 buckets"
  type        = bool
  default     = true
}

variable "s3_bucket_encryption" {
  description = "Enable server-side encryption for S3 buckets"
  type        = bool
  default     = true
}

# Monitoring configuration
variable "enable_cloudwatch_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

# Security configuration
variable "enable_secrets_manager" {
  description = "Enable AWS Secrets Manager for secret management"
  type        = bool
  default     = true
}

variable "enable_parameter_store" {
  description = "Enable AWS Systems Manager Parameter Store"
  type        = bool
  default     = true
}

# Auto-scaling configuration
variable "enable_cluster_autoscaler" {
  description = "Enable Kubernetes cluster autoscaler"
  type        = bool
  default     = true
}

variable "enable_keda" {
  description = "Enable KEDA for event-driven autoscaling"
  type        = bool
  default     = true
}

# Backup configuration
variable "enable_velero" {
  description = "Enable Velero for backup and disaster recovery"
  type        = bool
  default     = true
}

# Domain and SSL configuration
variable "domain_name" {
  description = "Domain name for FlexTime application"
  type        = string
  default     = "flextime.big12.org"
}

variable "enable_cert_manager" {
  description = "Enable cert-manager for automatic SSL certificates"
  type        = bool
  default     = true
}

# Cost optimization
variable "enable_spot_instances" {
  description = "Enable spot instances for non-production environments"
  type        = bool
  default     = false
}

variable "enable_fargate" {
  description = "Enable AWS Fargate for serverless containers"
  type        = bool
  default     = false
}

# Compliance and security
variable "enable_guardduty" {
  description = "Enable AWS GuardDuty for threat detection"
  type        = bool
  default     = true
}

variable "enable_config" {
  description = "Enable AWS Config for compliance monitoring"
  type        = bool
  default     = true
}

variable "enable_security_hub" {
  description = "Enable AWS Security Hub for security posture management"
  type        = bool
  default     = true
}

# Tagging
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Node group configuration
variable "node_groups" {
  description = "EKS managed node group configurations"
  type = map(object({
    instance_types = list(string)
    min_size      = number
    max_size      = number
    desired_size  = number
    capacity_type = string
    labels        = map(string)
    taints = list(object({
      key    = string
      value  = string
      effect = string
    }))
  }))
  
  default = {
    general = {
      instance_types = ["m5.large"]
      min_size      = 1
      max_size      = 5
      desired_size  = 2
      capacity_type = "ON_DEMAND"
      labels = {
        node-type = "general"
      }
      taints = []
    }
  }
}

# Networking configuration
variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

variable "enable_network_policy" {
  description = "Enable Kubernetes Network Policies"
  type        = bool
  default     = true
}

# Disaster recovery
variable "enable_cross_region_backup" {
  description = "Enable cross-region backup for disaster recovery"
  type        = bool
  default     = false
}

variable "backup_region" {
  description = "Region for cross-region backups"
  type        = string
  default     = "us-west-2"
}