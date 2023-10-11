#!/bin/bash

sudo yum update -y

sudo amazon-linux-extras install aws-nitro-enclaves-cli -y
sudo yum install aws-nitro-enclaves-cli-devel -y

sudo usermod -aG ne ec2-user
sudo usermod -aG docker ec2-user

nitro-cli --version

sudo systemctl enable --now nitro-enclaves-allocator.service
sudo systemctl enable --now docker


docker build /usr/share/nitro_enclaves/examples/hello -t hello

nitro-cli build-enclave --docker-uri hello:latest --output-file hello.eif

nitro-cli run-enclave --cpu-count 2 --memory 512 --enclave-cid 16 --eif-path hello.eif --debug-mode
