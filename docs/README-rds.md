# Multi-IaC Pipeline Solution

Example with multiple IaC pipelines to setup a basic AWS solution with Terraform CDK, Pulumi, and AWS CDK.

## RDS Global Cluster

See: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database-getting-started.html
Region
failover: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database-disaster-recovery.html

## Assumptions

From top-level README.
Setup an AWS_PROFILE for LocalStack

#### Add this to your `~/.aws/config` file

```text
[profile localstack]
region=us-east-1
output=json
endpoint_url = http://localhost:4566
```

#### Add this to your `~/.aws/credentials` file

```text
[localstack]
aws_access_key_id=test
aws_secret_access_key=test
```

## Instructions from AWS Docs

See: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database-getting-started.html

### Create RDS Global Cluster

```shell
aws rds create-global-cluster \
    --profile localstack \
    --region 'us-east-1'  \
    --global-cluster-identifier 'myrdsglobalcluster' \
    --engine aurora-postgresql
```

### Describe Global Cluster

```shell
aws rds describe-global-clusters \
    --profile localstack \
    --region 'us-east-1' \
    --global-cluster-identifier 'myrdsglobalcluster'
```

### Create Primary Aurora Cluster

```shell
aws rds create-db-cluster \
  --profile localstack \
  --region 'us-east-1' \
  --db-cluster-identifier 'gclusterprimary' \
  --master-username userid \
  --manage-master-user-password \
  --engine aurora-postgresql \
  --global-cluster-identifier 'myrdsglobalcluster'
```

### Describe Primary Cluster

```shell
aws rds describe-db-clusters \
    --profile localstack \
    --region 'us-east-1' \
    --db-cluster-identifier 'gclusterprimary'
```

### Create DB Instances in Primary Cluster

#### Create First (Writer) Instance

```shell
aws rds create-db-instance \
  --profile localstack \
  --db-cluster-identifier 'gclusterprimary' \
  --db-instance-class 'db.r7g.large' \
  --db-instance-identifier 'priinst-0' \
  --engine aurora-postgresql \
  --region 'us-east-1' 
```

#### Create 2 Reader Instances

```shell
aws rds create-db-instance \
  --profile localstack \
  --db-cluster-identifier 'gclusterprimary' \
  --db-instance-class 'db.r7g.large' \
  --db-instance-identifier 'priinst-1' \
  --engine aurora-postgresql \
  --region 'us-east-1' 
```

```shell
aws rds create-db-instance \
  --profile localstack \
  --db-cluster-identifier 'gclusterprimary' \
  --db-instance-class 'db.r7g.large' \
  --db-instance-identifier 'priinst-2' \
  --engine aurora-postgresql \
  --region 'us-east-1' 
```

### Secondary Region Cluster

```shell
aws rds create-db-cluster \
    --profile localstack \
    --region 'us-west-2' \
    --db-cluster-identifier 'gcluster2' \
    --global-cluster-identifier 'myrdsglobalcluster' \
    --engine aurora-postgresql
```

```shell
aws rds  create-db-instance \
    --profile localstack \
    --region 'us-west-2' \
    --db-instance-class 'db.r7g.large' \
    --db-cluster-identifier 'gcluster2' \
    --db-instance-identifier 'secinst0' \
    --engine aurora-postgresql
```

### Describe Secondary Cluster

```shell
aws rds describe-db-clusters \
    --profile localstack \
    --region 'us-west-2' \
    --db-cluster-identifier 'gcluster2'
```

# AWS Deploy

### Create RDS Global Cluster

```shell
aws rds create-global-cluster \
    --region 'us-east-1'  \
    --global-cluster-identifier 'myrdsglobalcluster' \
    --engine aurora-postgresql
```

### Describe Global Cluster

```shell
aws rds describe-global-clusters \
    --region 'us-east-1' \
    --global-cluster-identifier 'myrdsglobalcluster'
```

### Create Primary Aurora Cluster

```shell
aws rds create-db-cluster \
  --region 'us-east-1' \
  --db-cluster-identifier 'gclusterprimary' \
  --master-username userid \
  --manage-master-user-password \
  --engine aurora-postgresql \
  --global-cluster-identifier 'myrdsglobalcluster'
```

### Describe Primary Cluster

```shell
aws rds describe-db-clusters \
    --region 'us-east-1' \
    --db-cluster-identifier 'gclusterprimary'
```

### Create DB Instances in Primary Cluster

#### Create First (Writer) Instance

```shell
aws rds create-db-instance \
  --db-cluster-identifier 'gclusterprimary' \
  --db-instance-class 'db.r7g.large' \
  --db-instance-identifier 'priinst-0' \
  --engine aurora-postgresql \
  --region 'us-east-1' 
```

#### Create 2 Reader Instances

```shell
aws rds create-db-instance \
  --db-cluster-identifier 'gclusterprimary' \
  --db-instance-class 'db.r7g.large' \
  --db-instance-identifier 'priinst-1' \
  --engine aurora-postgresql \
  --region 'us-east-1' 
```

```shell
aws rds create-db-instance \
  --db-cluster-identifier 'gclusterprimary' \
  --db-instance-class 'db.r7g.large' \
  --db-instance-identifier 'priinst-2' \
  --engine aurora-postgresql \
  --region 'us-east-1' 
```

### Secondary Region Cluster

```shell
aws rds create-db-cluster \
    --region 'us-west-2' \
    --db-cluster-identifier 'gcluster2' \
    --global-cluster-identifier 'myrdsglobalcluster' \
    --engine aurora-postgresql
```

```shell
aws rds  create-db-instance \
    --region 'us-west-2' \
    --db-instance-class 'db.r7g.large' \
    --db-cluster-identifier 'gcluster2' \
    --db-instance-identifier 'secinst0' \
    --engine aurora-postgresql
```

### Describe Secondary Cluster

```shell
aws rds describe-db-clusters \
    --region 'us-west-2' \
    --db-cluster-identifier 'gcluster2'
```



