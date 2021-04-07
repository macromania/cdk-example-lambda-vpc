# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

-   `npm run build` compile typescript to js
-   `npm run watch` watch for changes and compile
-   `npm run test` perform the jest unit tests
-   `cdk deploy` deploy this stack to your default AWS account/region
-   `cdk diff` compare deployed stack with current state
-   `cdk synth` emits the synthesized CloudFormation template

## Demo Purpose

This demo creates a backend service behind an ALB in private subnet and provides access to the backend service via APIGW + Lambda.
Lambda also tries to create an EC2 instance to check if the current managed policies for creating ENIs could potentially allow it or not.

To enable this behaviour, send `?harmful=1` in the query parameters to APIGW call.
The error messages are expected to be shown on top of expected response.

Creation of ENIs could take time in the beginning and can give 503 errors.
Give it some time and it will start accepting the traffic accordingly.

### Expected Response from ALB

```
<!DOCTYPE html>
<html lang="en">

    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title>Simple PHP App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="assets/css/bootstrap.min.css" rel="stylesheet">
        <style>body {margin-top: 40px; background-color: #333;
}</style>
        <link href="assets/css/bootstrap-responsive.min.css" rel="stylesheet">
        <!--[if lt IE 9
]><script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script><![endif
]-->
    </head>

    <body>
        <div class="container">
            <div class="hero-unit">
                <h1>Simple PHP App</h1>
                <h2>Congratulations</h2>
                <p>Your PHP application is now running on a container in Amazon ECS.</p>
                <p>The container is running PHP version 5.4.16.</p>
```
