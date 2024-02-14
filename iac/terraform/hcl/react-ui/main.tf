provider "aws" {
  region                      = var.aws_region
  profile                     = var.aws_profile
  #  aws_access_key_id           = var.localstack ? "test" = null
  #  aws_secret_access_key       = var.localstack ? "test" = null
  skip_credentials_validation = var.localstack ? true : false
  skip_requesting_account_id  = var.localstack ? true : false
}

resource "aws_s3_bucket" "deployment_bucket" {
  bucket = var.bucket_name

  tags = {
    Name       = var.bucket_name
    Created_By = var.created_by
  }
}

resource "aws_s3_bucket_acl" "b_acl" {
  bucket = aws_s3_bucket.deployment_bucket.id
  acl    = "private"
}

resource "null_resource" "remove_and_upload_to_s3" {
  provisioner "local-exec" {
    command = "aws s3 sync ../../../../ui/react-app/build s3://${aws_s3_bucket.deployment_bucket.id}"
  }
}

resource "aws_cloudfront_origin_access_control" "cloudfront_oac" {
  name                              = "My_Cloudfront-OAC"
  description                       = "The origin access control configuration for the Cloudfront distribution"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "website_cdn" {
  enabled = true

  origin {
    domain_name              = aws_s3_bucket.deployment_bucket.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.cloudfront_oac.id
    origin_id                = "origin-bucket-${aws_s3_bucket.deployment_bucket.id}"
  }

  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "DELETE", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    min_ttl                = "0"
    default_ttl            = "300"
    max_ttl                = "1200"
    target_origin_id       = "origin-bucket-${aws_s3_bucket.deployment_bucket.id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  custom_error_response {
    error_caching_min_ttl = 300
    error_code            = 404
    response_code         = "200"
    response_page_path    = "/404.html"
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Created_By = var.created_by
  }
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.website_cdn.domain_name
}