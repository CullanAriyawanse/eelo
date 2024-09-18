variable "aws_region" {
  type        = string
  description = "AWS region"
}

# variable "account_id" {
#   type        = string
#   description = "AWS account ID"
# }

variable "telem_infra_deploy_role" {
  type        = string
  description = "The ARN of the role to assume to deploy infrastructure"
}

variable "cognito_user_pool_id" {
  type        = string
  description = "The ID of the cognito user pool for streaming service"
}

variable "cognito_client_id" {
  type        = string
  description = "The ID of the cognito client for streaming service"
}

variable "az_count" {
  type        = number
  description = "The number of AZs in a region"
  default     = 2
}

variable "ui_port" {
  type        = number
  description = "Port exposed by the docker image to redirect traffic to"
  default     = 80
}

variable "service_port" {
  type        = number
  description = "Port exposed by the docker image to redirect traffic to"
  default     = 8000
}

variable "domain_certificate_arn" {
  type        = string
  description = "The ARN of the imported cloudflare certificate"
}

variable "dev_domain_name" {
  type        = string
  description = "development domain name of telemetry system"
  default     = "dev.redbackracing.com"
}

variable "prd_domain_name" {
  type        = string
  description = "production domain name of telemetry system"
  default     = "telemetry.redbackracing.com"
}

variable "repo_name" {
  type        = string
  description = "value of the repo name"
  default     = "redbackracing/repository"
}