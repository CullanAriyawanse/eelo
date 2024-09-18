variable "name_prefix" {
  type        = string
  description = "Prefix for the role name"
}

variable "role_path" {
  type        = string
  description = "Path for the IAM role"
  default     = "/"
}

variable "role_description" {
  type        = string
  description = "Description of the IAM role"
}

variable "iam_policy_document" {
  type        = string
  description = "The JSON policy document for the IAM role"
}

variable "assume_role_policy" {
  type        = string
  description = "The JSON document that defines which AWS entities can assume this role"
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to the role"
  default     = {}
}

variable "arns_assume_role" {
  type        = list(string)
  description = "The ARNs of the entities that can assume this role"
}
