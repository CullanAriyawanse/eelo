terraform {
  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    template = {
      source  = "hashicorp/template"
      version = "2.2.0"
    }
  }

  required_version = "1.4.6"
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      environment = terraform.workspace
      cluster     = "eelo"
      repo_name   = var.repo_name
    }
  }

  assume_role {
    role_arn     = var.telem_infra_deploy_role
    session_name = "eelo-session"
  }
}

module "storages" {
  source = "./storages"

  public_subnet_ids = aws_subnet.public[*].id
}
