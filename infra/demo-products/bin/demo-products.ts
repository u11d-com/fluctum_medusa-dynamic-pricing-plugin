#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DemoProductsStack } from "../lib/demo-products-stack";

const app = new cdk.App();

new DemoProductsStack(app, "FluctumDemoProductsStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    // Pinned (not env-fallback) — this stack must land in us-east-1
    // regardless of the deployer's default AWS CLI/profile region.
    region: "us-east-1",
  },
  description:
    "Demo product image storage for the dynamic-pricing seed data (S3 + CloudFront)",
});
