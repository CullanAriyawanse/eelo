output "role_arn" {
  value       = aws_iam_role.this.arn
  description = "The ARN of the IAM role"
}

output "policy_arn" {
  value       = aws_iam_policy.this.arn
  description = "The ARN of the IAM policy"
}
