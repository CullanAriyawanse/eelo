variable "arns_assume_role" {
  type        = list(string)
  description = "List of ARNs of IAM entities that can assume the role	"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "account_id" {
  type        = string
  description = "AWS account ID"
}

variable "roles_to_pass" {
  type        = list(string)
  description = "list of roles to pass"
}
