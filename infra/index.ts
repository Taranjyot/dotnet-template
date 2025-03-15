import * as yaml from 'yamljs';
import * as fs from 'fs';
import * as path from 'path';
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import {createEBSResource } from './resource';
import { BucketObjectArgsOpts, EBSConfig } from './types';

// Pulumi Program
const pulumiProgram  = (resourcesConfig: EBSConfig) => async () =>  {

    const bucketObjectArgsOpts = <BucketObjectArgsOpts>resourcesConfig.bucketObjectArgsOpts;
    const ebsResource = createEBSResource({
        bucketObjectArgsOpts: bucketObjectArgsOpts,
    });
    return {
        appUrl: ebsResource.appEnv.cname,
    };
};

/**
 * run function
 * creates/destroys pulumi stack deployments
 * cli args1 as pulumi action up/destroy/refresh
 * cli args2 as config yaml file url
 */
const run = async () => {
    const yamlFile = process.argv[3];
    const action = process.argv[2];

    const filePath = path.resolve(yamlFile);
    if (!fs.existsSync(filePath)) {
        console.error('Invalid YAML configuration');
    }
    const config = yaml.load(filePath);

    const projectName = config.projectName || 'dotnet-template';
    const stackName = config.stackName || 'dev';

    // Create or select a stack
    const stack = await pulumi.automation.LocalWorkspace.createOrSelectStack({
        stackName,
        projectName,
        program: pulumiProgram(config.resources),
    });

    await stack.setConfig("aws:region", { value: "eu-west-2" });

    switch (action) {
        case 'up': {
            console.log("Deploying resources...");
            const upRes = await stack.up({ onOutput: console.log });
            break;
        }
        case 'destroy': {
            console.log("Destroying resources...");
            const upRes = await stack.destroy({ onOutput: console.log });
            break;
        }
        case 'refresh': {
            console.log("Refreshing resources...");
            const upRes = await stack.refresh({ onOutput: console.log });
        }
        default: {
            console.error('up/destroy commands alllowed!')
            break;
        }
    }
};

run();