output "vpc_id" {
  description = "ID de la VPC"
  value       = aws_vpc.main.id
}

output "autoscaling_group" {
  description = "Nombre del Auto Scaling Group"
  value       = aws_autoscaling_group.app.name
}

output "security_group_id" {
  description = "ID del security group"
  value       = aws_security_group.app.id
}

output "ami_id" {
  description = "AMI utilizada (Packer o Ubuntu oficial)"
  value       = local.ami_id
}

output "cloudwatch_dashboard_url" {
  description = "URL del dashboard de CloudWatch"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=SION-Production-Dashboard"
}

output "get_app_ip_command" {
  description = "Comando para obtener la IP publica de la app"
  value       = "aws ec2 describe-instances --region ${var.aws_region} --filters Name=tag:aws:autoscaling:groupName,Values=${aws_autoscaling_group.app.name} Name=instance-state-name,Values=running --query 'Reservations[].Instances[].PublicIpAddress' --output text"
}
