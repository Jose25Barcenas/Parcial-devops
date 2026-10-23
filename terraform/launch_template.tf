# Plantilla de lanzamiento: la configuración base de las instancias
resource "aws_launch_template" "app" {
  name_prefix   = "${var.project}-lt-"
  image_id      = local.ami_id
  instance_type = var.instance_type
  key_name      = aws_key_pair.deployer.key_name

  vpc_security_group_ids = [aws_security_group.app.id]

  iam_instance_profile {
    arn = aws_iam_instance_profile.instance.arn
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh.tpl", {
    repo_url  = var.repo_url
    aws_region = var.aws_region
  }))

  block_device_mappings {
    device_name = "/dev/sda1"
    ebs {
      volume_size = 20
      volume_type = "gp3"
    }
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project}-instance"
    }
  }

  tags = {
    Name = "${var.project}-lt"
  }
}
