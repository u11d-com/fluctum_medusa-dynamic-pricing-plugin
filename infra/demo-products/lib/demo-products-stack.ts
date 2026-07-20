import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";

export class DemoProductsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Private S3 bucket holding the demo product images (previously hosted on
    // a third-party Supabase storage account). CloudFront reads via OAC only.
    const imagesBucket = new s3.Bucket(this, "FluctumDemoProductsBucket", {
      bucketName: "fluctum-demo-products",
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

    // CloudFront distribution — no custom domain needed, default *.cloudfront.net
    // domain is fine for a CDN in front of static demo product images.
    // S3BucketOrigin.withOriginAccessControl() creates the OAC and wires the
    // bucket resource policy automatically (modern replacement for the
    // deprecated S3Origin + manual OAI/OAC setup).
    const distribution = new cloudfront.Distribution(
      this,
      "FluctumDemoProductsDistribution",
      {
        comment: "fluctum demo product images CDN",
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe only (cheaper)
        httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
        enableIpv6: true,
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,

        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(imagesBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          compress: true,

          cachePolicy: new cloudfront.CachePolicy(
            this,
            "FluctumDemoProductsCachePolicy",
            {
              cachePolicyName: "FluctumDemoProductsCache",
              comment:
                "Cache policy for static demo product images (filenames are already unique/timestamped)",
              defaultTtl: cdk.Duration.days(7),
              maxTtl: cdk.Duration.days(365),
              minTtl: cdk.Duration.seconds(0),

              queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
              headerBehavior: cloudfront.CacheHeaderBehavior.none(),
              cookieBehavior: cloudfront.CacheCookieBehavior.none(),

              enableAcceptEncodingGzip: true,
              enableAcceptEncodingBrotli: true,
            },
          ),
        },
      },
    );

    // Outputs for the image migration script and next.config.js
    new cdk.CfnOutput(this, "BucketName", {
      value: imagesBucket.bucketName,
      description: "S3 bucket name for demo product images",
      exportName: "FluctumDemoProductsBucketName",
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
      description: "CloudFront distribution ID",
      exportName: "FluctumDemoProductsDistributionId",
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
      description: "CloudFront distribution domain name (*.cloudfront.net)",
      exportName: "FluctumDemoProductsDistributionDomain",
    });

    new cdk.CfnOutput(this, "BucketArn", {
      value: imagesBucket.bucketArn,
      description: "S3 bucket ARN",
    });
  }
}
