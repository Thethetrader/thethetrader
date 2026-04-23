# AWS Production Deploy

## Architecture Overview

Production AWS deployments follow a multi-tier architecture: ALB → ECS Fargate → RDS, with CloudFront as CDN, Route53 for DNS, and CloudWatch for observability.

## ECS Fargate Service

### Task Definition

```json
{
  "family": "my-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/my-app:latest",
      "portMappings": [{ "containerPort": 3000, "protocol": "tcp" }],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/my-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "arn:aws:ssm:REGION:ACCOUNT:parameter/my-app/database-url" },
        { "name": "API_KEY", "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:my-app/api-key" }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "3000" }
      ]
    }
  ]
}
```

### Service with Auto-Scaling

```bash
# Create service
aws ecs create-service \
  --cluster production \
  --service-name my-app \
  --task-definition my-app:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100" \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=app,containerPort=3000"

# Auto-scaling target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/production/my-app \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# CPU-based scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/production/my-app \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'
```

## RDS PostgreSQL

### Production Configuration

```hcl
resource "aws_db_instance" "main" {
  identifier     = "my-app-prod"
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = "db.r6g.large"

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "myapp"
  username = "myapp_admin"
  password = var.db_password

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 14
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "my-app-prod-final"

  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  monitoring_interval                   = 60
  monitoring_role_arn                   = aws_iam_role.rds_monitoring.arn

  parameter_group_name = aws_db_parameter_group.optimized.name

  tags = { Environment = "production" }
}

resource "aws_db_parameter_group" "optimized" {
  family = "postgres16"
  name   = "my-app-optimized"

  parameter { name = "shared_preload_libraries" value = "pg_stat_statements" }
  parameter { name = "log_min_duration_statement" value = "1000" }
  parameter { name = "idle_in_transaction_session_timeout" value = "60000" }
  parameter { name = "statement_timeout" value = "30000" }
}

resource "aws_db_instance" "read_replica" {
  identifier          = "my-app-prod-read"
  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = "db.r6g.large"
  storage_encrypted   = true

  performance_insights_enabled = true
}
```

## CloudFront + SSL

```hcl
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = ["app.example.com"]
  price_class         = "PriceClass_100"

  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "alb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "alb"

    cache_policy_id          = aws_cloudfront_cache_policy.dynamic.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.forward_all.id
    viewer_protocol_policy   = "redirect-to-https"
    compress                 = true
  }

  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "alb"

    cache_policy_id        = aws_cloudfront_cache_policy.static.id
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    min_ttl                = 86400
    default_ttl            = 604800
    max_ttl                = 31536000
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.main.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }
}
```

## Route53 with Health Checks

```hcl
resource "aws_route53_record" "app" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.example.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_health_check" "app" {
  fqdn              = "app.example.com"
  port               = 443
  type               = "HTTPS"
  resource_path      = "/health"
  failure_threshold  = 3
  request_interval   = 30

  tags = { Name = "app-health-check" }
}
```

## CloudWatch Monitoring

### Critical Alarms

```hcl
resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "my-app-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 85
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = "production"
    ServiceName = "my-app"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "my-app-5xx-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 5

  metric_query {
    id          = "error_rate"
    expression  = "(m1/m2)*100"
    label       = "5xx Error Rate %"
    return_data = true
  }

  metric_query {
    id = "m1"
    metric {
      metric_name = "HTTPCode_Target_5XX_Count"
      namespace   = "AWS/ApplicationELB"
      period      = 60
      stat        = "Sum"
      dimensions  = { LoadBalancer = aws_lb.main.arn_suffix }
    }
  }

  metric_query {
    id = "m2"
    metric {
      metric_name = "RequestCount"
      namespace   = "AWS/ApplicationELB"
      period      = 60
      stat        = "Sum"
      dimensions  = { LoadBalancer = aws_lb.main.arn_suffix }
    }
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "my-app-rds-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = { DBInstanceIdentifier = "my-app-prod" }
}
```

### Dashboard

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "title": "ECS CPU & Memory",
        "metrics": [
          ["AWS/ECS", "CPUUtilization", "ClusterName", "production", "ServiceName", "my-app"],
          ["AWS/ECS", "MemoryUtilization", "ClusterName", "production", "ServiceName", "my-app"]
        ],
        "period": 60,
        "stat": "Average"
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "ALB Request Rate & Latency",
        "metrics": [
          ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "ALB_ARN_SUFFIX", { "stat": "Sum" }],
          ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "ALB_ARN_SUFFIX", { "stat": "p99" }]
        ],
        "period": 60
      }
    }
  ]
}
```

## CDK Alternative

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class ProductionStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 3,
      natGateways: 2,
    });

    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    const db = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16_1 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
      vpc,
      multiAz: true,
      deletionProtection: true,
      backupRetention: cdk.Duration.days(14),
      storageEncrypted: true,
    });

    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
    });

    taskDef.addContainer('app', {
      image: ecs.ContainerImage.fromEcrRepository(/* repo */),
      portMappings: [{ containerPort: 3000 }],
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'app' }),
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/health || exit 1'],
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSsmParameter(/* param */),
      },
    });

    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 2,
      circuitBreaker: { rollback: true },
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, 'ALB', { vpc, internetFacing: true });
    const listener = lb.addListener('Listener', { port: 443 });
    listener.addTargets('Target', { port: 3000, targets: [service] });

    const scaling = service.autoScaleTaskCount({ minCapacity: 2, maxCapacity: 10 });
    scaling.scaleOnCpuUtilization('CpuScaling', { targetUtilizationPercent: 70 });
  }
}
```

## Deployment Checklist

- [ ] VPC with private subnets across 3 AZs
- [ ] Security groups: ALB (80/443 inbound), ECS (3000 from ALB only), RDS (5432 from ECS only)
- [ ] Secrets in SSM Parameter Store or Secrets Manager
- [ ] ECR repository with image scanning enabled
- [ ] ECS service with rolling deployment (min 100%, max 200%)
- [ ] RDS multi-AZ with 14-day backup retention
- [ ] CloudFront with custom domain and ACM certificate
- [ ] Route53 with health checks
- [ ] CloudWatch alarms: CPU, memory, 5xx rate, latency p99, DB connections
- [ ] SNS topic for alerts → PagerDuty/Slack integration
- [ ] Enable AWS Config and GuardDuty
- [ ] Set up billing alerts
