import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2, aws_iam as iam } from 'aws-cdk-lib';
import { readFileSync } from 'fs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ConfidentialComputingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //VPC
    const vpc = new ec2.Vpc(this, 'confidential_computing_vpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16') ,
      subnetConfiguration: [
        {
          name: 'subnet_public', 
          subnetType: ec2.SubnetType.PUBLIC, 
          cidrMask: 24
       }
      ]
    });

    let userData = readFileSync('./lib/user-data.sh', 'utf-8');
    userData = this.base64_encode(userData);
    
    // Security Group
    const security_group = new ec2.SecurityGroup(this, 'confidential_computing_sg', {
      vpc,
      allowAllOutbound: true
    });

    security_group.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH from any where'
    );

    security_group.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP Traffic from any where'
    );

    security_group.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS Traffic from any where'
    );

    const cfnInstance = new ec2.CfnInstance(this, 'confidential_computing_ec2', /* all optional props */ {
      disableApiTermination: false,
      enclaveOptions: {
        enabled: true,
      },
      imageId: 'ami-0bb4c991fa89d4b9b',
      instanceType: 'm5.xlarge',
      keyName: 'confidential-ec2-key-pair',
      monitoring: false,
      subnetId: vpc.publicSubnets[0].subnetId,
      userData,
      securityGroupIds: [security_group.securityGroupId],
    });

    // The code that defines your stack goes here

    // //VPC
    // const vpc = new ec2.Vpc(this, 'confidential_computing_vpc', {
    //   ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16') ,
    //   subnetConfiguration: [
    //     {
    //       name: 'subnet_public', 
    //       subnetType: ec2.SubnetType.PUBLIC, 
    //       cidrMask: 24
    //    }
    //   ]
    // });

    // // Security Group
    // const security_group = new ec2.SecurityGroup(this, 'confidential_computing_sg', {
    //   vpc,
    //   allowAllOutbound: true
    // });

    // security_group.addIngressRule(
    //   ec2.Peer.anyIpv4(),
    //   ec2.Port.tcp(22),
    //   'Allow SSH from any where'
    // );

    // security_group.addIngressRule(
    //   ec2.Peer.anyIpv4(),
    //   ec2.Port.tcp(80),
    //   'Allow HTTP Traffic from any where'
    // );

    // security_group.addIngressRule(
    //   ec2.Peer.anyIpv4(),
    //   ec2.Port.tcp(443),
    //   'Allow HTTPS Traffic from any where'
    // );

    // // Create Role
    // const web_server_role = new iam.Role(this, 'confidential_computing_role', {
    //   assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    //   managedPolicies: [
    //     iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
    //   ],
    // });

    // // Create EC2


    // const ec2_instance = new ec2.Instance(this, 'confidential_computing_ec2', {
    //   vpc,
    //   vpcSubnets: {
    //     subnetType: ec2.SubnetType.PUBLIC,
    //   },
    //   role: web_server_role,
    //   securityGroup: security_group,
    //   instanceType: ec2.InstanceType.of(
    //     ec2.InstanceClass.M5,
    //     ec2.InstanceSize.XLARGE
    //   ),
    //   machineImage: new ec2.AmazonLinuxImage({
    //     generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    //   }),
    //   keyName: 'confidential-ec2-key-pair',
    // });
  }

  base64_encode(str: string): string {
    // create a buffer
    const buff = Buffer.from(str, 'utf-8');

    // decode buffer as Base64
    const base64 = buff.toString('base64');

    return base64
  }
}
