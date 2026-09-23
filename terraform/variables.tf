variable "aws_region" {
  description = "Región de AWS"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Nombre del proyecto"
  type        = string
  default     = "sion"
}

variable "instance_type" {
  description = "Tipo de instancia EC2"
  type        = string
  default     = "t3.small"
}

variable "admin_cidr" {
  description = "CIDR permitido para SSH (tu IP pública /32)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "ssh_public_key_path" {
  description = "Ruta a tu clave pública SSH"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "repo_url" {
  description = "URL del repositorio Git"
  type        = string
  default     = "https://github.com/Jose25Barcenas/Parcial-devops.git"
}
