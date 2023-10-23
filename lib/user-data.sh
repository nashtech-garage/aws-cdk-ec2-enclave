#!/bin/bash

sudo yum update -y

sudo amazon-linux-extras install aws-nitro-enclaves-cli -y
sudo yum install aws-nitro-enclaves-cli-devel -y

sudo usermod -aG ne ec2-user
sudo usermod -aG docker ec2-user

nitro-cli --version

sudo systemctl enable --now nitro-enclaves-allocator.service
sudo systemctl enable --now docker

# We need to export HOME to run nitro-cli
export HOME="/root"

sudo yum install -y \
	git

git clone --depth 1 https://github.com/aws/aws-nitro-enclaves-sdk-c.git
cd aws-nitro-enclaves-sdk-c/

# This command for hello world deomo
# docker build /usr/share/nitro_enclaves/examples/hello -t hello
# nitro-cli build-enclave --docker-uri hello:latest --output-file hello.eif
# nitro-cli run-enclave --cpu-count 2 --memory 512 --enclave-cid 16 --eif-path hello.eif --debug-mode

## We need to build image from Dockerfile.al2
## After that we will run build kmstool

docker build --target kmstool-instance -t kmstool-instance -f containers/Dockerfile.al2 .
docker build --target kmstool-enclave -t kmstool-enclave -f containers/Dockerfile.al2 .

nitro-cli build-enclave --docker-uri kmstool-enclave --output-file kmstool.eif

# If we run in debug mode, we can only set "kms:RecipientAttestation:ImageSha384": "000..0"
# If we run in production mode, we will set "kms:RecipientAttestation:ImageSha384": PCR0
nitro-cli run-enclave --cpu-count 2 --memory 512 --enclave-cid 16 --eif-path kmstool.eif --debug-mode

