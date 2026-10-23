#!/bin/bash
# Despliegue automatico de SION en EC2 - SION DevOps
exec > /var/log/user-data.log 2>&1
set -x

# --- Swap extra para que el build de Maven no muera en t3.micro ---
fallocate -l 3G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=3072
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# --- Dependencias ---
apt-get update -y
apt-get install -y docker.io docker-compose git awscli
systemctl enable --now docker

# --- Codigo de la aplicacion (repo publico) ---
git clone ${repo_url} /opt/sion
cd /opt/sion

# --- IP publica via IMDSv2 (para QR/PUBLIC_BASE_URL y CORS) ---
TOKEN=$(curl -s -X PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4)
export PUBLIC_BASE_URL="http://$PUBLIC_IP"
export CORS_ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000,http://$PUBLIC_IP"

# --- Stack completo: MongoDB + Backend + Frontend(puerto 80) + n8n ---
docker-compose -f docker-compose.yml -f docker-compose.deploy.yml up -d --build

# --- Métrica de salud de la app para CloudWatch (1 = verde) ---
cat > /usr/local/bin/sion-healthcheck.sh <<EOF
#!/bin/bash
if curl -sf -m 5 http://localhost/health >/dev/null 2>&1; then
  aws cloudwatch put-metric-data --region ${aws_region} --namespace SION/Application --metric-data MetricName=HealthCheck,Value=1,Unit=None,Dimensions=[{Name=Environment,Value=production}]
else
  aws cloudwatch put-metric-data --region ${aws_region} --namespace SION/Application --metric-data MetricName=HealthCheck,Value=0,Unit=None,Dimensions=[{Name=Environment,Value=production}]
fi
EOF
chmod +x /usr/local/bin/sion-healthcheck.sh
echo "* * * * * root /usr/local/bin/sion-healthcheck.sh" > /etc/cron.d/sion-health

# primera medición inmediata
/usr/local/bin/sion-healthcheck.sh
