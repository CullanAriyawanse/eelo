module "redback_cognito_user_pool" {
  source  = "lgallard/cognito-user-pool/aws"
  version = "0.26.0"

  user_pool_name           = "Eelo users"
  domain                   = "Eelo users"
  alias_attributes         = ["email"]
  auto_verified_attributes = ["email"]

  deletion_protection = "ACTIVE"

  mfa_configuration = "OPTIONAL"
  software_token_mfa_configuration = {
    enabled = true
  }

  email_verification_subject = "Eelo - Verification Code"
  email_verification_message = "Your verification code is {####}."

  admin_create_user_config = {
    email_subject = "Eelo - Verification Code"
    email_message = "Dear {username}, your verification code is {####}."
  }

  email_configuration = {
    email_sending_account = "COGNITO_DEFAULT"
  }

  admin_create_user_config_allow_admin_create_user_only = false

  user_pool_add_ons = {
    advanced_security_mode = "ENFORCED"
  }

  password_policy = {
    minimum_length                   = 8
    require_lowercase                = false
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 120
  }

  schemas = [
    {
      attribute_data_type      = "Boolean"
      developer_only_attribute = true
      mutable                  = true
      name                     = "registered"
      required                 = false
    }
  ]

  string_schemas = [
    {
      attribute_data_type      = "String"
      developer_only_attribute = false
      mutable                  = false
      name                     = "email"
      required                 = true

      string_attribute_constraints = {
        max_length = 2048
        min_length = 0
      }
    },
    {
      attribute_data_type      = "String"
      developer_only_attribute = false
      mutable                  = true
      name                     = "given_name"
      required                 = true
      string_attribute_constraints = {
        max_length = 2048
        min_length = 0
      }
    },
    {
      attribute_data_type      = "String"
      developer_only_attribute = false
      mutable                  = true
      name                     = "family_name"
      required                 = true
      string_attribute_constraints = {
        max_length = 2048
        min_length = 0
      }
    }
  ]

  recovery_mechanisms = [
    {
      name     = "verified_email"
      priority = 1
    }
  ]

  # clients = [
  #   {
  #     allowed_oauth_flows                  = ["code"]
  #     generate_secret                      = false
  #     allowed_oauth_flows_user_pool_client = true
  #     allowed_oauth_scopes                 = ["email", "openid", "phone"]
  #     callback_urls = [
  #     ]
  #     explicit_auth_flows = [
  #       "ALLOW_REFRESH_TOKEN_AUTH",
  #       "ALLOW_USER_SRP_AUTH",
  #     ]
  #     generate_secret              = true
  #     logout_urls                  = []
  #     name                         = "eelo"
  #     read_attributes              = ["email", "given_name", "family_name"]
  #     supported_identity_providers = ["COGNITO"]
  #     write_attributes             = []
  #     access_token_validity        = 0
  #     id_token_validity            = 0
  #     token_validity_units = {
  #       access_token  = "hours"
  #       id_token      = "hours"
  #       refresh_token = "days"
  #     }
  #     ui_customization_image_file = filebase64("resources/image.jpg")
  #   }
  # ]

  tags = {
    Owner       = "infra"
    Environment = "production"
    Terraform   = true
  }
}