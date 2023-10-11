import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ConfidentialComputing from '../lib/confidential_computing-stack';

// example test. To run these tests, uncomment this file along with the
// example resource in lib/confidential_computing-stack.ts

test('EC2 Instance Created', () => {
  const app = new cdk.App();
    // WHEN
  const stack = new ConfidentialComputing.ConfidentialComputingStack(app, 'MyTestStack');
    // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::EC2::Instance', {
    EnclaveOptions: { 
        Enabled: true 
    }
  });
});