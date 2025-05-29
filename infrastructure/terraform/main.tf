# Main Terraform configuration for FlexTime Platform infrastructure
terraform {
  required_version = ">= 1.5"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "s3" {
    bucket  = "flextime-terraform-state"
    key     = "infrastructure/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
    
    dynamodb_table = "flextime-terraform-locks"
  }
}

# Provider configurations
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "FlexTime"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "Big12-Infrastructure"
    }
  }
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

data "aws_caller_identity" "current" {}

# Local values
locals {
  name = "flextime-${var.environment}"
  
  vpc_cidr = "10.0.0.0/16"
  azs      = slice(data.aws_availability_zones.available.names, 0, 3)
  
  tags = {
    Project     = "FlexTime"
    Environment = var.environment
    GithubRepo  = "big12/flextime"
  }
}

# VPC Module
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = local.name
  cidr = local.vpc_cidr

  azs             = local.azs
  private_subnets = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k)]
  public_subnets  = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 4)]
  intra_subnets   = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 8)]

  enable_nat_gateway = true
  single_nat_gateway = var.environment != "production"
  enable_vpn_gateway = false

  enable_dns_hostnames = true
  enable_dns_support   = true

  # Kubernetes-specific tags
  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }

  tags = local.tags
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = local.name
  cluster_version = "1.28"

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  # EKS Managed Node Group(s)
  eks_managed_node_group_defaults = {
    ami_type       = "AL2_x86_64"
    instance_types = ["m5.large", "m5a.large", "m5ad.large", "m5d.large", "t3.medium"]
    
    attach_cluster_primary_security_group = true
    
    # Disabling and using externally provided key pairs due to legacy key availability
    create_iam_role          = true
    iam_role_name            = "EKSNodeGroupRole"
    iam_role_use_name_prefix = false
    iam_role_description     = "EKS managed node group role"
    iam_role_tags = {
      Purpose = "Protector of the kubelet"
    }
    iam_role_additional_policies = {
      AmazonEC2ContainerRegistryReadOnly = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
      additional                         = aws_iam_policy.node_additional.arn
    }
  }

  eks_managed_node_groups = {
    # Production node groups
    production_general = {
      name = "general"
      
      instance_types = var.environment == "production" ? ["m5.xlarge"] : ["t3.medium"]
      
      min_size     = var.environment == "production" ? 3 : 1
      max_size     = var.environment == "production" ? 10 : 5
      desired_size = var.environment == "production" ? 3 : 2
      
      capacity_type = "ON_DEMAND"
      
      labels = {
        Environment = var.environment
        NodeGroup   = "general"
      }
      
      taints = []
      
      update_config = {
        max_unavailable_percentage = 33
      }
      
      tags = {
        ExtraTag = "general-nodes"
      }
    }
    
    # Compute-optimized nodes for scheduling workloads
    compute_optimized = {
      name = "compute"
      
      instance_types = var.environment == "production" ? ["c5.2xlarge"] : ["c5.large"]
      
      min_size     = var.environment == "production" ? 2 : 1
      max_size     = var.environment == "production" ? 8 : 3
      desired_size = var.environment == "production" ? 2 : 1
      
      capacity_type = var.environment == "production" ? "ON_DEMAND" : "SPOT"
      
      labels = {
        Environment = var.environment
        NodeGroup   = "compute"
        node-type   = "compute-optimized"
      }
      
      taints = [{
        key    = "node-type"
        value  = "compute-optimized"
        effect = "NO_SCHEDULE"
      }]
      
      tags = {
        ExtraTag = "compute-nodes"
      }
    }
  }

  # aws-auth configmap
  manage_aws_auth_configmap = true

  aws_auth_roles = [
    {
      rolearn  = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/AWSReservedSSO_AdministratorAccess_*"
      username = "admin"
      groups   = ["system:masters"]
    },
  ]

  aws_auth_users = var.aws_auth_users

  tags = local.tags
}

# Additional IAM policy for node groups
resource "aws_iam_policy" "node_additional" {
  name        = "${local.name}-additional"
  description = "Additional permissions for EKS node group"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ec2:Describe*",
          "s3:GetObject",
          "s3:PutObject",
          "secretsmanager:GetSecretValue",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
        ]
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })

  tags = local.tags
}

# RDS PostgreSQL for application data
module "rds" {
  source = "./modules/rds"
  
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.intra_subnets
  
  allowed_security_groups = [module.eks.node_security_group_id]
  
  tags = local.tags
}

# ElastiCache Redis for caching and job queues
module "elasticache" {
  source = "./modules/elasticache"
  
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.intra_subnets
  
  allowed_security_groups = [module.eks.node_security_group_id]
  
  tags = local.tags
}

# S3 buckets for storage
module "s3" {
  source = "./modules/s3"
  
  environment = var.environment
  
  tags = local.tags
}

# EFS for shared storage
resource "aws_efs_file_system" "flextime" {
  creation_token = "${local.name}-efs"
  
  performance_mode = "generalPurpose"
  throughput_mode  = "provisioned"
  provisioned_throughput_in_mibps = var.environment == "production" ? 100 : 50
  
  encrypted = true
  
  tags = merge(local.tags, {
    Name = "${local.name}-efs"
  })
}

resource "aws_efs_mount_target" "flextime" {
  count = length(module.vpc.private_subnets)
  
  file_system_id  = aws_efs_file_system.flextime.id
  subnet_id       = module.vpc.private_subnets[count.index]
  security_groups = [aws_security_group.efs.id]
}

resource "aws_security_group" "efs" {
  name_prefix = "${local.name}-efs"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "NFS"
    from_port   = 2049
    to_port     = 2049
    protocol    = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "flextime" {
  for_each = toset([
    "/aws/eks/${local.name}/cluster",
    "/flextime/api-svc",
    "/flextime/scheduler-svc",
    "/flextime/notification-svc",
    "/flextime/import-svc",
    "/flextime/reporting-svc",
    "/flextime/comment-svc"
  ])
  
  name              = each.value
  retention_in_days = var.environment == "production" ? 30 : 7
  
  tags = local.tags
}