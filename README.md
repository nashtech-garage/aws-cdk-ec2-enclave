# Using AWS CDK to build EC2 with enclave option Enable
This repo demonstrates using AWS CDK to create an EC2 with enclave options. After that, we can use an enclave for security.

Read the document for information:

https://aws.amazon.com/vi/ec2/nitro/nitro-enclaves/
https://docs.aws.amazon.com/enclaves/latest/user/nitro-enclave.html
https://docs.aws.amazon.com/enclaves/latest/user/getting-started.html

## Prerequisites
1. Need Node.js 14.15.0 or later.

2. Install TypeScript
> npm i -g typescript

3. Enable & set Identity Management Center for AWS SSO:  https://aws.amazon.com/iam/identity-center/

![Enable IAM Identity Center](images/enable_iam_identity_center.png)

4. Account have permission to deploy

5. Using `aws configure sso` to configure the login account

![AWS Configure SSO](images/aws_configure_sso.png)

After logging in to the web browser, we continue to input information.

![AWS Configure Profile](images/aws_configure_profile.png)

6. Replace key pair with your key pair 

![AWS Key pair](images/aws_key_pair.png)

## Code - Build and Run
Using CDK to build infra in AWS, we can use three construct levels:
- L1 constructs (low-level construct): we call **CFN Resources**. These constructs directly represent all resources available in AWS CloudFormation.

- L2 constructs (AWS Resources, but with higher level, intent-based API). AWS constructs offer convenient defaults and reduce the need to know all the details about the AWS resources they represent

- L3 constructs (patterns): These constructs are designed to help you complete common tasks in AWS, often involving multiple kinds of resources.

We should use L2 constructs for ease. But in L2, we currently don't have an `enclave option,` so we will combine L1 and L2.

## Steps by Steps

- (Optional) Build code to check error
> npm run build

- Login to AWS Account
> aws sso login

![Login to AWS Account](images/aws_sso_login.png)

- (Optional) Generate AWS CloudFormation template (That will auto run when we deploy)
> cdk synth

![Generate AWS CloudFormation Template](images/cdk_synth.png)

- Deploy to AWS
> cdk deploy

CloudFormation Stack
![CloudFormation Stack](images/cloud_formation_stacks.png)

EC2 Instance
![EC2 Instance](images/ec2-instance.png)

- Using `SSH` to connect to EC2 for testing
![EC2 connect guideline](images/ec2_connect_guideline.png)

![Using SSH Command](images/ssh_command_to_connect.png)

- Check log to make sure we finish building process
```
sudo su
cd /var/log
tail -n100 cloud-init-output.log
```
![Cloud build success](images/cloud-build-success.png)

- Set configure to run specific region
```
aws configure
```
![AWS Configure Region](images/aws-configure-region.png)

- Run command to check enclaves
```
nitro-cli describe-enclaves
```
![Describe Enclaves](images/describe-enclaves.png)

- Check result from console
> nitro-cli console --enclave-id i-0a8b0095e465ce702-enc18b1d5e61c374bf

![Enclave console](images/enclave_console.png)


## Test with encrypt & decrypt KMS

- After run sucess, checking the EC2 to get information
![EC2 information](images/ec2-information.png)

- We can see role of EC2
![Confidential Computing Role](images/confidential_coputing-role.png)


- We need to create an KMS key with Key Usage: "Encrypt and decrypt", and set policy to allow EC2 role encrypt data. With Decrypt function, we only allow in Enclave (In debug mode, we need to set "000...0". But in production mode, we need to set PCR0 value)
![KMS Policy](images/kms-policy.png)


- SSH to confidentail computing EC2. Run command to encrypt data
```
KMS_KEY_ARN="alias/kms-for-enclave-testing"
MESSAGE="Hello everyone"
CIPHERTEXT=$(aws kms encrypt --key-id "$KMS_KEY_ARN" --plaintext "$MESSAGE" --query CiphertextBlob --output text)
echo $CIPHERTEXT
```
![KMS Encrypt Data](images/kms-encrypt.png)

- Run command to decrypt data, we will get AccessDeniedException
```
aws kms decrypt --ciphertext-blob fileb://<(echo $CIPHERTEXT | base64 -d) --key-id "$KMS_KEY_ARN"
```
![KMS Decrypt Data](images/kms-decrypt.png)

## Open vsock and test with enclave
Now, we open another terminal, connect to Confidentail Computing EC2 again
Run vsock command to connect to kms service
```
CMK_REGION=us-east-1 # The region where you created your AWS KMS CMK
vsock-proxy 8000 kms.$CMK_REGION.amazonaws.com 443
```
![Open vsock proxy](images/vsockproxy-command.png)

- Call to kmstool-instance
```
CMK_REGION=us-east-1 # Must match above
ENCLAVE_CID=$(nitro-cli describe-enclaves | jq -r .[0].EnclaveCID)
# Run docker with network host to allow it to fetch IAM credentials with IMDSv2
docker run --network host -it kmstool-instance /kmstool_instance --cid "$ENCLAVE_CID" --region "$CMK_REGION" "$CIPHERTEXT"
```

![Decypt by enclave](images/decrypt-by-enclave.png)

- (Optional) Destroy all AWS Resources after testing
> cdk destroy
