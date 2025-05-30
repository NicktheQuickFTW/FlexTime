# Main Terraform configuration for Flextime deployment
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
  }

  backend "s3" {
    bucket         = var.terraform_state_bucket
    key            = "flextime/terraform.tfstate"
    region         = var.aws_region
    encrypt        = true
    dynamodb_table = var.terraform_lock_table
  }
}

# Configure providers
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Flextime"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Team        = "XII-Ops"
    }
  }
}

provider "azurerm" {
  features {}
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local values
locals {
  common_tags = {
    Project     = "Flextime"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Team        = "XII-Ops"
  }
  
  name_prefix = "${var.project_name}-${var.environment}"
}

# Include modules
module "networking" {
  source = "./modules/networking"
  
  project_name   = var.project_name
  environment    = var.environment
  aws_region     = var.aws_region
  vpc_cidr       = var.vpc_cidr
  
  availability_zones = data.aws_availability_zones.available.names
  
  tags = local.common_tags
}

module "security" {
  source = "./modules/security"
  
  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.networking.vpc_id
  
  tags = local.common_tags
}

module "compute" {
  source = "./modules/compute"
  
  project_name    = var.project_name
  environment     = var.environment
  vpc_id          = module.networking.vpc_id
  subnet_ids      = module.networking.private_subnet_ids
  security_groups = module.security.security_group_ids
  
  instance_type = var.instance_type
  min_capacity  = var.min_capacity
  max_capacity  = var.max_capacity
  
  tags = local.common_tags
}

module "database" {
  source = "./modules/database"
  
  project_name    = var.project_name
  environment     = var.environment
  vpc_id          = module.networking.vpc_id
  subnet_ids      = module.networking.database_subnet_ids
  security_groups = [module.security.database_security_group_id]
  
  db_instance_class = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  
  tags = local.common_tags
}

module "monitoring" {
  source = "./modules/monitoring"
  
  project_name = var.project_name
  environment  = var.environment
  
  cluster_name = module.compute.eks_cluster_name
  
  tags = local.common_tags
}

module "cdn" {
  source = "./modules/cdn"
  
  project_name = var.project_name
  environment  = var.environment
  domain_name  = var.domain_name
  
  tags = local.common_tags
}