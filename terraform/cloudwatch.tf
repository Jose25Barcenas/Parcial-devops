# Dashboard de CloudWatch: estado de la aplicación (verde = OK)
resource "aws_cloudwatch_dashboard" "sion" {
  dashboard_name = "SION-Production-Dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 6
        properties = {
          markdown = <<-EOT
            # SION - Sistema de Inscripción y Admisión Online (UNAC)

            **Problema:** el proceso de inscripción y admisión de aspirantes era manual (documentos en papel, sin trazabilidad, demoras para informar resultados).

            **Solución:** plataforma web end-to-end (React + Spring Boot + MongoDB) con flujo de inscripción → pago → documentos → resultado, automatización con n8n y credenciales académicas verificables (piloto blockchain).

            **Infraestructura DevOps:** GitLab CI (lint → test → build → deploy) + AWS VPC → Auto Scaling Group → EC2 (docker-compose) + este dashboard de monitoreo.
          EOT
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "CPU - Auto Scaling Group"
          region = var.aws_region
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", aws_autoscaling_group.app.name]
          ]
          stat  = "Average"
          period = 60
          view   = "timeSeries"
          ymin   = 0
          ymax   = 100
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Status Checks EC2 (0 = sano)"
          region = var.aws_region
          metrics = [
            ["AWS/EC2", "StatusCheckFailed_Instance", "AutoScalingGroupName", aws_autoscaling_group.app.name],
            ["AWS/EC2", "StatusCheckFailed_System", "AutoScalingGroupName", aws_autoscaling_group.app.name]
          ]
          stat   = "Maximum"
          period = 60
          view   = "timeSeries"
          ymin   = 0
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          title  = "Salud de la app SION (1 = OK, /health)"
          region = var.aws_region
          metrics = [
            ["SION/Application", "HealthCheck", "Environment", "production"]
          ]
          stat   = "Maximum"
          period = 60
          view   = "timeSeries"
          ymin   = 0
          ymax   = 1
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          title  = "Red (bytes)"
          region = var.aws_region
          metrics = [
            ["AWS/EC2", "NetworkIn", "AutoScalingGroupName", aws_autoscaling_group.app.name],
            ["AWS/EC2", "NetworkOut", "AutoScalingGroupName", aws_autoscaling_group.app.name]
          ]
          stat   = "Average"
          period = 60
          view   = "timeSeries"
          ymin   = 0
        }
      },
      {
        type   = "alarm_status"
        x      = 0
        y      = 18
        width  = 24
        height = 6
        properties = {
          title          = "Alarmas (OK = verde)"
          alarmNamePrefix = "sion-"
          sortBy         = "state"
          view           = "alarm"
        }
      }
    ]
  })
}

# Alarma: status check de EC2 falla
resource "aws_cloudwatch_metric_alarm" "status_check" {
  alarm_name          = "sion-status-check"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Falla de status check en la instancia de SION"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  treat_missing_data = "notBreaching"
}

# Alarma: la app responde /health
resource "aws_cloudwatch_metric_alarm" "app_health" {
  alarm_name          = "sion-app-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheck"
  namespace           = "SION/Application"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1
  alarm_description   = "El endpoint /health de SION dejo de responder"

  dimensions = {
    Environment = "production"
  }

  treat_missing_data = "notBreaching"
}

# Alarma: CPU sostenida muy alta
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "sion-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU de SION por encima del 80%"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  treat_missing_data = "notBreaching"
}
