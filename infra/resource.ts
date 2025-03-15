
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { BucketObjectArgsOpts, EBSConfig } from './types';

const zipFolder = (folderPath: string, outputZipPath: string): void => {
    if (!fs.existsSync(folderPath)) {
        throw new Error(`Folder does not exists: ${folderPath}`);
    }

    const zip = new AdmZip();
    zip.addLocalFolder(folderPath);
    zip.writeZip(outputZipPath);

    console.log(`Zipped contents from ${folderPath} -> ${outputZipPath}`);
};

/**
 * zips build dotnet build files and deploys them to s3 bucket with correct
 * permssions for Elastic beanstalk access
 * @param projectName project name and stack name
 * @param bucketObjectArgs bucket object args
 * @returns returns ebsBuildBucket, appZipBucket, bucketPolicy 
 */
const createS3Resource = (projectName: string, bucketObjectArgs?: BucketObjectArgsOpts) => {

    const folderPath = path.resolve(process.cwd(), './src/publish');
    const zippedOutputPath = path.resolve(process.cwd(), './build.zip');
    zipFolder(folderPath, zippedOutputPath);

    const ebsBuildBucket = new aws.s3.Bucket(`${projectName}-s3-ebs-build`);

    const appZipBucket = new aws.s3.BucketObject(`${projectName}-appZip`, {
        bucket: ebsBuildBucket.id,
        source: new pulumi.asset.FileAsset(zippedOutputPath),
        contentType: 'application/zip',
        key: 'app.zip',
        ...bucketObjectArgs.args,
    }, {
        dependsOn: ebsBuildBucket,
        ...bucketObjectArgs.opts,
    });

    const bucketPolicy = new aws.s3.BucketPolicy('ebBucketPolicy', {
        bucket: ebsBuildBucket.id, // The bucket you created
        policy: pulumi.all([ebsBuildBucket.arn, ebsBuildBucket.arn.apply(arn => `${arn}/*`)]).apply(([bucketArn, objectArn]) =>
            JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'elasticbeanstalk.amazonaws.com',
                        },
                        Action: ['s3:GetObject', 's3:ListBucket'],
                        Resource: [bucketArn, objectArn]
                    }
                ]
            })
        )
    });

    
    return { ebsBuildBucket, appZipBucket, bucketPolicy };
};

/**
 * creates elastic beanstalk resource
 * @param config pulumi resoruces configuration
 * @returns pulumi resrources - ebsBuildBucket, appVersion, appEnv,
 */
const createEBSResource = (config: EBSConfig) => {
    const pulumiProject = `${pulumi.getProject()}-${pulumi.getStack()}`;
    const ebsBuildBucket = createS3Resource(pulumiProject, config.bucketObjectArgsOpts);

    const ebsApp = new aws.elasticbeanstalk.Application(`${pulumiProject}-dotnet-ebs-app`, {
        name: `${pulumiProject}-dotnet-ebs-app`,
    }, {
        dependsOn: [ebsBuildBucket.appZipBucket, ebsBuildBucket.appZipBucket],
    })

    const s3Policy = new aws.iam.Policy(`${pulumiProject}-s3-read-policy`, {
        policy: pulumi.output({
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: ['s3:GetObject', 's3:ListBucket'],
                    Resource: [pulumi.interpolate`${ebsBuildBucket.ebsBuildBucket.arn}`, pulumi.interpolate`${ebsBuildBucket.ebsBuildBucket.arn}/*`],
                },
            ],
        }),
    });

    const ebInstanceRole = new aws.iam.Role(`${pulumiProject}-ebs-instance-role`, {
        assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: {
                        Service: 'ec2.amazonaws.com', 
                    },
                    Action: 'sts:AssumeRole',
                },
            ],
        }),
    });

    const ebManagedPolicyAttachment = new aws.iam.RolePolicyAttachment(`${pulumiProject}-ebs-managed-policy`, {
        role: ebInstanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier', // Grants permissions for Beanstalk EC2
    });

    const s3PolicyAttachment = new aws.iam.RolePolicyAttachment(`${pulumiProject}-ebs-s3-policy-attachment`, {
        role: ebInstanceRole.name,
        policyArn: s3Policy.arn,
    });

    const ebInstanceProfile = new aws.iam.InstanceProfile('eb-instance-profile', {
        role: ebInstanceRole.name,
    }, {
        dependsOn: [s3PolicyAttachment, ebManagedPolicyAttachment],
    });

    const appVersion = new aws.elasticbeanstalk.ApplicationVersion(`${pulumiProject}-app-version`, {
        application: ebsApp.name,
        bucket: ebsBuildBucket.ebsBuildBucket.bucket,
        key: 'app.zip',
    }, {
        dependsOn: [ ebsBuildBucket.ebsBuildBucket, ebsApp ],
    });

    const appEnv = new aws.elasticbeanstalk.Environment(`${pulumiProject}-dotnet-env`, {
        name: `${pulumiProject}-dotnet-env`,
        application: ebsApp.name,
        solutionStackName: '64bit Amazon Linux 2 v2.8.8 running .NET Core',
        version: appVersion,
        settings: [
            { namespace: 'aws:autoscaling:launchconfiguration', name: 'InstanceType', value: 't3.micro' },
            { namespace: 'aws:elasticbeanstalk:environment', name: 'EnvironmentType', value: 'SingleInstance' },
            { namespace: 'aws:autoscaling:launchconfiguration', name: 'IamInstanceProfile', value: ebInstanceProfile.name },
        ],
    },{
        dependsOn: [ebsApp, appVersion],
    });
    return {
        ebsBuildBucket, appVersion, appEnv,
    };
};


export { createEBSResource };