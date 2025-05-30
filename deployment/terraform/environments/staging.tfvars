environment = "staging"
aws_region = "us-east-1"

# VPC Configuration
vpc_cidr = "10.1.0.0/16"
private_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
public_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]

# EKS Configuration
kubernetes_version = "1.28"
min_nodes = 2
max_nodes = 10
desired_nodes = 3
node_instance_types = ["t3.medium", "t3.large"]

# Database Configuration
db_engine_version = "15.4"
db_instance_class = "db.t3.medium"
db_allocated_storage = 50

# Redis Configuration
redis_node_type = "cache.t3.medium"