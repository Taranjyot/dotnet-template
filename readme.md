# Deployment Guide

## Prerequisites
Before you begin, ensure you have the following installed:
- [.NET SDK]
- [Node.js] (includes npm)
- [Pulumi]
- [AWS CLI] (configured with appropriate credentials)

## Folder structure

```
/project-root
│-- /src          # .NET application source code
│-- /infra        # Pulumi infrastructure (TypeScript)
│-- /node_modules # Node.js dependencies
│-- build.zip     # Compressed build file generated by Pulumi
```

## Setup and Deployment

### 1. Authenticate with AWS and Pulumi
Before running the project, ensure you are logged in to Pulumi and have assumed the required AWS role:
```sh
pulumi login
aws configure
```

### 2. Install Dependencies
Install necessary npm dependencies:
```sh
npm install
```

### 3. Build .NET Application
Run the build command to generate the .NET application package:
```sh
npm run build
```
This will create the .NET build inside `/src/packages`.

### 4. Deploy Infrastructure with Pulumi
Deploy the Pulumi infrastructure to AWS Elastic Beanstalk:
```sh
npm run pulumi:up
```

### 5. Destroy Infrastructure
To remove the deployed resources and clean up AWS infrastructure:
```sh
npm run pulumi:destroy
```