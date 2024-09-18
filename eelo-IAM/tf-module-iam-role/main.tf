resource "aws_iam_role" "this" {
  name               = "${var.name_prefix}-role"
  path               = var.role_path
  description        = var.role_description
  assume_role_policy = var.assume_role_policy

  tags = var.tags
}

resource "aws_iam_policy" "this" {
  name   = "${var.name_prefix}-policy"
  policy = var.iam_policy_document
}

resource "aws_iam_role_policy_attachment" "this" {
  role       = aws_iam_role.this.name
  policy_arn = aws_iam_policy.this.arn
}
