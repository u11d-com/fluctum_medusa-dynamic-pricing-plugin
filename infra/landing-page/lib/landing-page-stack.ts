import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class LandingPageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for static site content
    const siteBucket = new s3.Bucket(this, "FluctumSiteBucket", {
      bucketName: "fluctum-landing-page", // Customize this to your preference
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // CloudFront will use OAC
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Don't delete bucket on stack destroy
      autoDeleteObjects: false,
      lifecycleRules: [
        {
          // Clean up old uploads after 7 days (if using multipart uploads)
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // CloudFront Origin Access Control (OAC) — modern replacement for OAI
    const oac = new cloudfront.CfnOriginAccessControl(this, "FluctumOAC", {
      originAccessControlConfig: {
        name: "FluctumLandingPageOAC",
        originAccessControlOriginType: "s3",
        signingBehavior: "always",
        signingProtocol: "sigv4",
        description: "Origin Access Control for fluctum.io landing page",
      },
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(
      this,
      "FluctumDistribution",
      {
        comment: "fluctum.io landing page CDN",
        defaultRootObject: "index.html",
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe only (cheaper)
        httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
        enableIpv6: true,
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,

        defaultBehavior: {
          origin: new origins.S3Origin(siteBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          compress: true,

          cachePolicy: new cloudfront.CachePolicy(this, "FluctumCachePolicy", {
            cachePolicyName: "FluctumLandingPageCache",
            comment: "Cache policy for static Next.js export",
            defaultTtl: cdk.Duration.hours(24),
            maxTtl: cdk.Duration.days(365),
            minTtl: cdk.Duration.seconds(0),

            // Cache based on query strings (Next.js may use them for static assets)
            queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),

            // Don't cache based on headers (static content)
            headerBehavior: cloudfront.CacheHeaderBehavior.none(),

            // Don't cache based on cookies (static site, no personalization)
            cookieBehavior: cloudfront.CacheCookieBehavior.none(),

            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
          }),
        },

        // Custom error responses for SPA-style routing
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 404,
            responsePagePath: "/404.html",
            ttl: cdk.Duration.minutes(5),
          },
        ],
      },
    );

    // Grant CloudFront OAC permission to read from S3 bucket
    // This is required when using OAC instead of OAI
    siteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: "AllowCloudFrontServicePrincipalReadOnly",
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
        actions: ["s3:GetObject"],
        resources: [siteBucket.arnForObjects("*")],
        conditions: {
          StringEquals: {
            "AWS:SourceArn": `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
          },
        },
      }),
    );

    // Outputs for GitHub Actions workflow
    new cdk.CfnOutput(this, "BucketName", {
      value: siteBucket.bucketName,
      description: "S3 bucket name for landing page content",
      exportName: "FluctumLandingPageBucketName",
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
      description: "CloudFront distribution ID",
      exportName: "FluctumLandingPageDistributionId",
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
      description: "CloudFront distribution domain name (*.cloudfront.net)",
      exportName: "FluctumLandingPageDistributionDomain",
    });

    new cdk.CfnOutput(this, "BucketArn", {
      value: siteBucket.bucketArn,
      description: "S3 bucket ARN",
    });
  }
}
