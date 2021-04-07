import * as cdk from "@aws-cdk/core";
import ecs = require("@aws-cdk/aws-ecs");
import ec2 = require("@aws-cdk/aws-ec2");
import elbv2 = require("@aws-cdk/aws-elasticloadbalancingv2");
import { CfnOutput, Duration } from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { Code, Runtime } from "@aws-cdk/aws-lambda";
import { AuthorizationType, Deployment, EndpointType, LambdaIntegration, RestApi, Stage } from "@aws-cdk/aws-apigateway";

export class LambdaVpcStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create a cluster
        const vpc = new ec2.Vpc(this, "Vpc", { maxAzs: 2 });

        const cluster = new ecs.Cluster(this, "EcsCluster", { vpc });
        cluster.addCapacity("DefaultAutoScalingGroup", {
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
        });

        // Create Task Definition
        const taskDefinition = new ecs.Ec2TaskDefinition(this, "TaskDef");
        const container = taskDefinition.addContainer("web", {
            image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
            memoryLimitMiB: 256,
        });

        container.addPortMappings({
            containerPort: 80,
            hostPort: 8080,
            protocol: ecs.Protocol.TCP,
        });

        // Create Service
        const service = new ecs.Ec2Service(this, "Service", {
            cluster,
            taskDefinition,
        });

        // Create ALB
        const lb = new elbv2.ApplicationLoadBalancer(this, "LB", {
            vpc,
            internetFacing: false,
        });
        const listener = lb.addListener("VPCListener", { port: 80, open: true });

        // Attach ALB to ECS Service
        listener.addTargets("ECS", {
            port: 80,
            targets: [
                service.loadBalancerTarget({
                    containerName: "web",
                    containerPort: 80,
                }),
            ],
            // include health check (default is none)
            healthCheck: {
                // @ts-ignore
                interval: Duration.seconds(60),
                path: "/health",
                // @ts-ignore
                timeout: Duration.seconds(5),
            },
        });

        // Create lambda
        const helloWorldHandler = new lambda.Function(this, "hello-world-handler", {
            runtime: Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset("./src/"),
            handler: "hello-world-handler.handler",
            logRetention: 3,
            vpc: vpc,
            environment: {
                LoadBalancerUrl: lb.loadBalancerDnsName,
            },
        });

        // Create Lambda Integration
        const helloWorldIntegration = new LambdaIntegration(helloWorldHandler);

        // Create API
        const restApi = new RestApi(this, "hello-world-private-lambda", {
            endpointTypes: [EndpointType.REGIONAL],
        });
        restApi.root.addMethod("Any");

        // Create Resource in API
        const greetings = restApi.root.addResource("greetings");

        // Create Method for Resource
        const getMethod = greetings.addMethod("GET", helloWorldIntegration, {
            apiKeyRequired: false,
            authorizationType: AuthorizationType.NONE,
        });

        // Add method to API
        restApi.methods.push(getMethod);

        // Create Deployment for API
        const deployment = new Deployment(this, "deployment-" + new Date().toISOString(), {
            api: restApi,
        });

        // Create Stage
        const prodStage = new Stage(this, "v1", {
            deployment: deployment,
            stageName: "v1",
        });

        restApi.deploymentStage = prodStage;

        // Output
        new CfnOutput(this, "GreetingsApi", {
            value: `https://${restApi.restApiId}.execute-api.${this.region}.amazonaws.com/v1/greetings`,
        });

        new CfnOutput(this, "LoadBalancerDNS", { value: lb.loadBalancerDnsName });
    }
}
