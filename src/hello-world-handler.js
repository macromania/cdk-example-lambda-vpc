const loadBalancerDns = process.env.LoadBalancerUrl;
const loadBalancerUrl = "http://" + loadBalancerDns.toLowerCase();

const AWS = require("aws-sdk");

const https = require("http");

exports.handler = async (event, context, callback) => {
    let dataString = "";
    const harmful = event.queryStringParameters.harmful;
    dataString += "<p>hamrful: " + harmful + "</p>";
    if (harmful === "1") {
        console.log("running a harmful action");

        // AMI is amzn-ami-2011.09.1.x86_64-ebs
        const instanceParams = {
            ImageId: "ami-00c983d871338210e",
            InstanceType: "t2.micro",
            MinCount: 1,
            MaxCount: 1,
        };

        const instancePromise = new AWS.EC2({ apiVersion: "2016-11-15" }).runInstances(instanceParams);

        console.log("creating instance...");

        try {
            const data = await instancePromise.promise();
            console.log(data);
            const instanceId = data.Instances[0].InstanceId;
            console.log("Created instance", instanceId);
            dataString += "<p>Created a new ec2 instance: " + instanceId + "</p>";
        } catch (e) {
            console.error(e, e.stack);
            dataString += "<p>Error creating a new ec2 instance:<br/> " + e + "</p>";
        }
    }

    console.log("fetching internal load balancer: " + loadBalancerUrl);

    const response = await new Promise((resolve, reject) => {
        const req = https.get(loadBalancerUrl, function (res) {
            res.on("data", (chunk) => {
                dataString += chunk;
            });
            res.on("end", () => {
                resolve({
                    statusCode: 200,
                    body: dataString,
                });
            });
        });

        req.on("error", (e) => {
            reject({
                statusCode: 500,
                body: "Something went wrong!\n" + e.message,
            });
        });
    });

    return response;
};
