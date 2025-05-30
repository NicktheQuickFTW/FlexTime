environment = "production"
aws_region = "us-east-1"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
public_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

# EKS Configuration
kubernetes_version = "1.28"
min_nodes = 3
max_nodes = 20
desired_nodes = 5
node_instance_types = ["t3.large", "t3.xlarge"]

# Database Configuration
db_engine_version = "15.4"
db_instance_class = "db.r6g.large"
db_allocated_storage = 100

# Redis Configuration
redis_node_type = "cache.r6g.large"