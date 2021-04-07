#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { LambdaVpcStack } from "../lib/lambda-vpc-stack";
import { Tags } from "@aws-cdk/core";

const app = new cdk.App();
new LambdaVpcStack(app, "LambdaVpcStack");

Tags.of(app).add("context", "private-lambda-vpc");
Tags.of(app).add("stage", "poc");
