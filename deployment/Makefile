# Flextime Deployment Makefile
# Provides convenient targets for common deployment tasks

.PHONY: help init plan apply deploy rollback clean test lint security-scan

# Default environment and version
ENVIRONMENT ?= staging
VERSION ?= latest
AWS_REGION ?= us-east-1

# Terraform variables
TF_DIR = terraform
TF_VAR_FILE = environments/$(ENVIRONMENT)/terraform.tfvars

# Kubernetes variables
K8S_NAMESPACE = flextime-$(ENVIRONMENT)
HELM_CHART = kubernetes/helm-charts/flextime
HELM_VALUES = environments/$(ENVIRONMENT)/values.yaml

# Colors for output
BLUE = \033[0;34m
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Flextime Deployment Makefile$(NC)"
	@echo ""
	@echo "$(YELLOW)Usage:$(NC)"
	@echo "  make <target> [ENVIRONMENT=<env>] [VERSION=<version>]"
	@echo ""
	@echo "$(YELLOW)Targets:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  make deploy ENVIRONMENT=staging VERSION=v1.2.3"
	@echo "  make rollback ENVIRONMENT=production"
	@echo "  make plan ENVIRONMENT=production"

init: ## Initialize Terraform and download dependencies
	@echo "$(BLUE)Initializing Terraform...$(NC)"
	cd $(TF_DIR) && terraform init
	@echo "$(BLUE)Adding Helm repositories...$(NC)"
	helm repo add bitnami https://charts.bitnami.com/bitnami
	helm repo add jetstack https://charts.jetstack.io
	helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
	helm repo update
	@echo "$(GREEN)Initialization complete!$(NC)"

validate: ## Validate Terraform configuration and Helm charts
	@echo "$(BLUE)Validating Terraform configuration...$(NC)"
	cd $(TF_DIR) && terraform validate
	@echo "$(BLUE)Validating Helm chart...$(NC)"
	helm lint $(HELM_CHART)
	@echo "$(GREEN)Validation complete!$(NC)"

plan: ## Create Terraform execution plan
	@echo "$(BLUE)Creating Terraform plan for $(ENVIRONMENT)...$(NC)"
	cd $(TF_DIR) && terraform plan \
		-var="environment=$(ENVIRONMENT)" \
		-var="aws_region=$(AWS_REGION)" \
		-out=terraform-$(ENVIRONMENT).plan
	@echo "$(GREEN)Plan created: terraform-$(ENVIRONMENT).plan$(NC)"

apply: ## Apply Terraform configuration
	@echo "$(BLUE)Applying Terraform configuration for $(ENVIRONMENT)...$(NC)"
	cd $(TF_DIR) && terraform apply terraform-$(ENVIRONMENT).plan
	@echo "$(GREEN)Infrastructure deployment complete!$(NC)"

infrastructure: plan apply ## Deploy infrastructure (plan + apply)

deploy: ## Deploy application to Kubernetes
	@echo "$(BLUE)Deploying Flextime $(VERSION) to $(ENVIRONMENT)...$(NC)"
	@if [ ! -f "$(HELM_VALUES)" ]; then \
		echo "$(RED)Error: Values file not found: $(HELM_VALUES)$(NC)"; \
		exit 1; \
	fi
	helm upgrade --install flextime-$(ENVIRONMENT) $(HELM_CHART) \
		--namespace $(K8S_NAMESPACE) \
		--create-namespace \
		--values $(HELM_VALUES) \
		--set image.backend.tag=$(VERSION)-backend \
		--set image.frontend.tag=$(VERSION)-frontend \
		--set image.worker.tag=$(VERSION)-worker \
		--wait \
		--timeout=15m
	@echo "$(GREEN)Application deployment complete!$(NC)"

deploy-dry-run: ## Dry run deployment (show what would be deployed)
	@echo "$(BLUE)Dry run deployment for $(ENVIRONMENT)...$(NC)"
	helm upgrade --install flextime-$(ENVIRONMENT) $(HELM_CHART) \
		--namespace $(K8S_NAMESPACE) \
		--create-namespace \
		--values $(HELM_VALUES) \
		--set image.backend.tag=$(VERSION)-backend \
		--set image.frontend.tag=$(VERSION)-frontend \
		--set image.worker.tag=$(VERSION)-worker \
		--dry-run

status: ## Show deployment status
	@echo "$(BLUE)Deployment status for $(ENVIRONMENT):$(NC)"
	@echo ""
	@echo "$(YELLOW)Helm releases:$(NC)"
	helm list -n $(K8S_NAMESPACE)
	@echo ""
	@echo "$(YELLOW)Pods:$(NC)"
	kubectl get pods -n $(K8S_NAMESPACE)
	@echo ""
	@echo "$(YELLOW)Services:$(NC)"
	kubectl get services -n $(K8S_NAMESPACE)
	@echo ""
	@echo "$(YELLOW)Ingresses:$(NC)"
	kubectl get ingress -n $(K8S_NAMESPACE)

logs: ## Show application logs
	@echo "$(BLUE)Showing logs for $(ENVIRONMENT)...$(NC)"
	kubectl logs -f deployment/flextime-app -n $(K8S_NAMESPACE) --tail=100

rollback: ## Rollback deployment to previous version
	@echo "$(YELLOW)Rolling back deployment for $(ENVIRONMENT)...$(NC)"
	helm rollback flextime-$(ENVIRONMENT) -n $(K8S_NAMESPACE)
	@echo "$(GREEN)Rollback complete!$(NC)"

rollback-to: ## Rollback to specific revision (usage: make rollback-to REVISION=2)
	@if [ -z "$(REVISION)" ]; then \
		echo "$(RED)Error: REVISION not specified. Usage: make rollback-to REVISION=2$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Rolling back to revision $(REVISION) for $(ENVIRONMENT)...$(NC)"
	helm rollback flextime-$(ENVIRONMENT) $(REVISION) -n $(K8S_NAMESPACE)
	@echo "$(GREEN)Rollback to revision $(REVISION) complete!$(NC)"

history: ## Show deployment history
	@echo "$(BLUE)Deployment history for $(ENVIRONMENT):$(NC)"
	helm history flextime-$(ENVIRONMENT) -n $(K8S_NAMESPACE) --max 10

test: ## Run application tests
	@echo "$(BLUE)Running tests...$(NC)"
	npm run test:unit
	npm run test:integration
	@echo "$(GREEN)Tests complete!$(NC)"

lint: ## Run linting checks
	@echo "$(BLUE)Running linting checks...$(NC)"
	npm run lint
	terraform fmt -check -recursive $(TF_DIR)
	helm lint $(HELM_CHART)
	@echo "$(GREEN)Linting complete!$(NC)"

security-scan: ## Run security scans
	@echo "$(BLUE)Running security scans...$(NC)"
	npm audit --audit-level moderate
	@if command -v trivy >/dev/null 2>&1; then \
		trivy fs --security-checks vuln .; \
	else \
		echo "$(YELLOW)Trivy not installed, skipping container scan$(NC)"; \
	fi
	@echo "$(GREEN)Security scan complete!$(NC)"

health-check: ## Check application health
	@echo "$(BLUE)Checking application health for $(ENVIRONMENT)...$(NC)"
	@case $(ENVIRONMENT) in \
		production) URL="https://flextime.big12sports.com" ;; \
		staging) URL="https://staging.flextime.big12sports.com" ;; \
		dev) URL="https://dev.flextime.big12sports.com" ;; \
		*) echo "$(RED)Unknown environment: $(ENVIRONMENT)$(NC)"; exit 1 ;; \
	esac; \
	echo "Checking $$URL/health..."; \
	if curl -sf $$URL/health >/dev/null; then \
		echo "$(GREEN)✓ Application health check passed$(NC)"; \
	else \
		echo "$(RED)✗ Application health check failed$(NC)"; \
		exit 1; \
	fi; \
	echo "Checking $$URL/api/health..."; \
	if curl -sf $$URL/api/health >/dev/null; then \
		echo "$(GREEN)✓ API health check passed$(NC)"; \
	else \
		echo "$(RED)✗ API health check failed$(NC)"; \
		exit 1; \
	fi

clean: ## Clean up Terraform plans and temporary files
	@echo "$(BLUE)Cleaning up...$(NC)"
	find $(TF_DIR) -name "*.plan" -delete
	find . -name ".terraform" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name "terraform.tfstate.backup" -delete 2>/dev/null || true
	@echo "$(GREEN)Cleanup complete!$(NC)"

destroy: ## Destroy infrastructure (use with caution)
	@echo "$(RED)WARNING: This will destroy all infrastructure for $(ENVIRONMENT)!$(NC)"
	@read -p "Are you sure? Type 'yes' to continue: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "$(BLUE)Destroying infrastructure...$(NC)"; \
		helm uninstall flextime-$(ENVIRONMENT) -n $(K8S_NAMESPACE) --ignore-not-found; \
		kubectl delete namespace $(K8S_NAMESPACE) --ignore-not-found; \
		cd $(TF_DIR) && terraform destroy -var="environment=$(ENVIRONMENT)" -auto-approve; \
		echo "$(GREEN)Infrastructure destroyed!$(NC)"; \
	else \
		echo "$(YELLOW)Destruction cancelled.$(NC)"; \
	fi

install-tools: ## Install required tools (kubectl, helm, terraform)
	@echo "$(BLUE)Installing required tools...$(NC)"
	@echo "Please install the following tools manually:"
	@echo "- Terraform: https://www.terraform.io/downloads.html"
	@echo "- kubectl: https://kubernetes.io/docs/tasks/tools/"
	@echo "- Helm: https://helm.sh/docs/intro/install/"
	@echo "- AWS CLI: https://aws.amazon.com/cli/"

debug: ## Debug deployment issues
	@echo "$(BLUE)Debug information for $(ENVIRONMENT):$(NC)"
	@echo ""
	@echo "$(YELLOW)Namespace events:$(NC)"
	kubectl get events -n $(K8S_NAMESPACE) --sort-by='.lastTimestamp' | tail -20
	@echo ""
	@echo "$(YELLOW)Pod descriptions:$(NC)"
	kubectl describe pods -n $(K8S_NAMESPACE) -l app=flextime
	@echo ""
	@echo "$(YELLOW)Service endpoints:$(NC)"
	kubectl get endpoints -n $(K8S_NAMESPACE)

docs: ## Generate and serve documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	@if command -v mkdocs >/dev/null 2>&1; then \
		mkdocs serve; \
	else \
		echo "$(YELLOW)MkDocs not installed. Install with: pip install mkdocs$(NC)"; \
	fi

# Environment-specific shortcuts
dev: ## Quick deploy to development
	@$(MAKE) deploy ENVIRONMENT=dev

staging: ## Quick deploy to staging
	@$(MAKE) deploy ENVIRONMENT=staging

production: ## Quick deploy to production
	@$(MAKE) deploy ENVIRONMENT=production

# Full deployment pipeline
full-deploy: validate infrastructure deploy health-check ## Full deployment pipeline
	@echo "$(GREEN)Full deployment pipeline complete for $(ENVIRONMENT)!$(NC)"