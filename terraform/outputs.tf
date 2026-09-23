output "instance_id" {
  description = "ID de la instancia EC2"
  value       = aws_instance.app.id
}

output "public_ip" {
  description = "IP pública de la instancia"
  value       = aws_instance.app.public_ip
}

output "public_dns" {
  description = "DNS público de la instancia"
  value       = aws_instance.app.public_dns
}

output "ami_id" {
  description = "AMI usada (Ubuntu 22.04)"
  value       = data.aws_ami.ubuntu.id
}

output "security_group_id" {
  description = "ID del security group"
  value       = aws_security_group.app.id
}

output "vpc_id" {
  description = "ID de la VPC"
  value       = aws_vpc.main.id
}
