import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export type EBSConfig = {
    bucketObjectArgsOpts?: BucketObjectArgsOpts,
};

export type BucketObjectArgsOpts = {
    args: Omit<aws.s3.BucketObjectArgs, 'bucket'> & {
        key?: string;
    },
    opts?: pulumi.ComponentResourceOptions,
}