terraform {
  backend "s3" {
    bucket  = "tf-redback-iam"
    key     = "terraform.tfstate"
    region  = "ap-southeast-2"
    encrypt = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.58.0"
    }
  }

  required_version = "1.4.6"
}

provider "aws" {
  region = var.aws_region
}

module "deploy_roles" {
  source = "./deploy_roles"

  arns_assume_role = [
    "arn:aws:iam::${var.account_id}:user/eelo/tf-infra-deployer"
  ]

  roles_to_pass = [
    "arn:aws:iam::${var.account_id}:role/service_roles/*"
  ]

  aws_region = var.aws_region
  account_id = var.account_id

  depends_on = [aws_iam_user.eelo_infra_deployer_user]
}

module "human_user_groups" {
  source     = "./human_user_groups"
  account_id = var.account_id
}

module "service_roles" {
  source = "./service_roles"

  logging_services_assume_role = [
    "vpc-flow-logs.amazonaws.com",
  ]
}

module "human_roles" {
  source = "./human_roles"

  arns_assume_role = [
    "arn:aws:iam::${var.account_id}:root"
  ]
}
