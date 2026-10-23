variable "aws_region" {
  description = "Región de AWS (Ohio)"
  type        = string
  default     = "us-east-2"
}

variable "project" {
  description = "Nombre del proyecto"
  type        = string
  default     = "sion"
}

variable "instance_type" {
  description = "Tipo de instancia EC2"
  type        = string
  default     = "t3.micro"
}

variable "admin_cidr" {
  description = "CIDR permitido para SSH (tu IP pública /32)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "ssh_public_key_path" {
  description = "Ruta a la clave pública SSH (generada desde Jose25.pem)"
  type        = string
  default     = "sion-key.pub"
}

variable "repo_url" {
  description = "URL del repositorio Git"
  type        = string
  default     = "https://github.com/Jose25Barcenas/Parcial-devops.git"
}

variable "ami_id" {
  description = "AMI creada con Packer (vacío = usar Ubuntu 22.04 oficial)"
  type        = string
  default     = ""
}
