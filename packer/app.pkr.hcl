packer {
  required_plugins {
    amazon = {
      source  = "github.com/hashicorp/amazon"
      version = "~> 1.3"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "project" {
  type    = string
  default = "sion"
}

source "amazon-ebs" "app" {
  region        = var.aws_region
  instance_type = var.instance_type
  ssh_username  = "ubuntu"
  ami_name      = "${var.project}-app-${timestamp}"

  source_ami_filter {
    filters = {
      virtualization-type = "hvm"
      name                = "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
    }
    most_recent = true
    owners      = ["099720109477"]
  }

  tags = {
    Name    = "${var.project}-app"
    Project = var.project
    BuiltBy = "packer"
  }
}

build {
  sources = ["source.amazon-ebs.app"]

  provisioner "shell" {
    inline = [
      "sudo apt-get update -y",
      "sudo apt-get install -y docker.io docker-compose-v2 git nginx",
      "sudo systemctl enable --now docker",
      "sudo usermod -aG docker ubuntu"
    ]
  }

  provisioner "file" {
    source      = "${path.root}/../docker-compose.yml"
    destination = "/tmp/docker-compose.yml"
  }

  provisioner "file" {
    source      = "${path.root}/../Dockerfile.frontend"
    destination = "/tmp/Dockerfile.frontend"
  }

  provisioner "file" {
    source      = "${path.root}/../nginx.conf"
    destination = "/tmp/nginx.conf"
  }

  provisioner "file" {
    source      = "${path.root}/../backend/Dockerfile"
    destination = "/tmp/backend-Dockerfile"
  }

  provisioner "shell" {
    inline = [
      "mkdir -p /home/ubuntu/app/backend",
      "mv /tmp/docker-compose.yml /home/ubuntu/app/",
      "mv /tmp/Dockerfile.frontend /home/ubuntu/app/",
      "mv /tmp/nginx.conf /home/ubuntu/app/",
      "mv /tmp/backend-Dockerfile /home/ubuntu/app/backend/Dockerfile",
      "sudo chown -R ubuntu:ubuntu /home/ubuntu/app",
      "sudo apt-get clean",
      "sudo rm -rf /var/lib/apt/lists/*"
    ]
  }
}
