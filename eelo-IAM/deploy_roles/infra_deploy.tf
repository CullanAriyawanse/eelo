data "aws_iam_policy_document" "telem_infra_role_policy" {
  statement {
    resources = ["arn:aws:s3:::tf-telem-infrastructre"]
    actions = [
      "s3:ListBucket",
    ]
  }

  statement {
    resources = ["arn:aws:s3:::tf-telem-infrastructre/*"]
    actions = [
      "s3:Get*",
      "s3:Put*",
      "s3:Delete*",
    ]
  }

  statement {
    resources = ["arn:aws:dynamodb:${var.aws_region}:${var.account_id}:table/tf-telem-infrastructre"]
    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem"
    ]
  }

  statement {
    resources = var.roles_to_pass
    actions   = ["iam:PassRole"]
  }

  // enable VPCs, subnets, route tables and internet gateways creation
  statement {
    resources = ["*"]
    actions = [
      "ec2:Describe*",
      "ec2:Create*",
      "ec2:Delete*",
      "ec2:AttachInternetGateway",
      "ec2:AssociateRouteTable",
      "ec2:ModifyVpcAttribute",
      "ec2:DisableVpcClassicLink",
      "ec2:DisableVpcClassicLinkDnsSupport",
      "ec2:EnableVpcClassicLink",
      "ec2:EnableVpcClassicLinkDnsSupport",
      "ec2:Detach*",
      "ec2:ModifySubnetAttribute",
      "ec2:AllocateAddress",
      "ec2:RevokeSecurityGroupEgress",
      "ec2:RevokeSecurityGroupIngress",
      "ec2:AuthorizeSecurityGroupIngress",
      "ec2:AuthorizeSecurityGroupEgress",
      "ec2:Disassociate*",
      "ec2:Release*",
      "ec2:ReplaceRoute"
    ]
  }

  // policies for CloudWatch log groups
  statement {
    resources = ["*"]
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogDelivery",
      "logs:DeleteLogGroup",
      "logs:DescribeLogGroups",
      "logs:ListTagsLogGroup",
      "logs:PutRetentionPolicy",
      "logs:TagResource",
      "logs:TagLogGroup",
      "logs:UntagResource",
      "logs:UntagLogGroup",
      "logs:*"
    ]
  }

  statement {
    resources = ["*"]
    actions = [
      "ecs:Create*",
      "ecs:Describe*",
      "ecs:List*",
      "ecs:Update*",
      "ecs:Delete*",
      "ecs:RegisterTaskDefinition",
      "ecs:DeregisterTaskDefinition",
      "ecs:TagResource",
      "ecs:UntagResource"
    ]
  }

  // FIXME temporary wildcard
  statement {
    resources = ["*"]
    actions = [
      "elasticloadbalancing:*",
      "dynamodb:*",
    ]
  }

  // FIXME temporary wildcard
  statement {
    resources = ["*"]
    actions = [
      "servicediscovery:Create*",
      "servicediscovery:Delete*",
      "servicediscovery:List*",
      "servicediscovery:Get*",
      "servicediscovery:Update*",
      "servicediscovery:TagResource",
      "route53:Create*",
      "route53:Delete*",
      "route53:List*",
      "route53:Get*",
      "route53:Update*",
    ]
  }

  statement {
    resources = ["*"]
    actions = [
      "acm:Get*",
      "acm:RequestCertificate",
      "acm:DescribeCertificate",
      "acm:AddTagsToCertificate",
      "acm:ListTagsForCertificate",
      "acm:RemoveTagsFromCertificate",
      "acm:DeleteCertificate",
      "acm:UpdateCertificateOptions",
    ]
  }

  // policies to create service roles
  statement {
    resources = ["*"]
    actions = [
      "iam:Create*",
      "iam:Delete*",
      "iam:List*",
      "iam:Update*",
      "iam:Get*",
      "iam:Tag*",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:PutRolePolicy"
    ]
  }

  statement {
    resources = ["*"]
    actions = [
      "lambda:ListVersionsByFunction",
      "lambda:GetFunction",
      "lambda:GetFunctionCodeSigningConfig"
    ]
  }

  statement {
    resources = ["*"]
    actions = [
      "apigateway:*",
    ]
  }

  statement {
    resources = ["*"]
    actions = [
      "elasticfilesystem:*",
    ]
  }

  statement {
    resources = ["*"]
    actions = [
      "datasync:*",
    ]
  }

  statement {
    resources = ["*"]
    actions = [
      "s3:CreateBucket",
      "s3:List*",
      "s3:Get*",
      "s3:Put*",
      "s3:Delete*",
    ]
  }

  # Enable Cognito Pool Creation
  statement {
    resources = ["*"]
    actions = [
      "cognito-identity:*",
      "cognito-idp:*",
    ]
  }
}

module "telem_infra_deploy" {
  source = "/../tf-module-iam-role"  

  name_prefix         = "tfEeloInfraDeploy"
  role_path           = "/eelo/"
  role_description    = "Role for deploying eelo infrastructure"
  iam_policy_document = data.aws_iam_policy_document.telem_infra_role_policy.json
  arns_assume_role    = var.arns_assume_role
}

