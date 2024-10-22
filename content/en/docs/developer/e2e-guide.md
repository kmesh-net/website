---
draft: false
linktitle: E2E Test Guide
menu:
  docs:
    parent: developer guide
    weight: 15
title: Run E2E test
toc: true
type: docs

---
End-to-End (E2E) testing is a crucial component in modern software development, designed to simulate user interactions across the entire application to ensure all components and integrations function together seamlessly. By incorporating E2E testing, we can verify that changes in code do not disrupt existing functionalities, maintaining the integrity and reliability of the system even as it evolves. 

## Prerequisites

Components that need to be installed by the user

- Go

- Docker
- Kubectl

The following components will be installed while using the shell

- Kind
- Helm
- Istioctl

## Usage

To run the E2E tests, execute the `run_test.sh` script located in the `./test/e2e` directory. This script automates the following tasks:

1. **Installing dependencies:** Tools like Kind, Helm and Istioctl ...
2. **Deploying a local image registry:** A Docker container functions as the local image registry.
3. **Building and pushing the Kmesh image:** The custom Kmesh Docker image is built and pushed to the local registry.
4. **Deploying Kubernetes cluster, Istio, and Kmesh:** These components are necessary for the tests and are set up in this step.
5. **Deploying test applications and executing the E2E tests.**

## Command Line Flags

When testing locally, you may want to skip some setup steps to save time, especially after the initial setup is complete. The following flags are available to customize the test execution:

- `--skip-install-dep`: Skips the installation of dependencies.
- `--skip-build`: Skips building and pushing the Kmesh image to the local image registry.
- `--skip-setup`: Skips deploying the Kubernetes cluster, Istio, and Kmesh.
- `--only-run-tests`: Skips all other steps and focuses only on deploying test applications and running E2E tests.

You might need different kinds of tests. 
- `--cluster`: Allows specifying a pre-existing KinD cluster by name.
- `--ipv6`: Enables creating a KinD cluster with IPv6 networking.

In some cases, you might want to clean up some resources after the tests, while in other cases, you might want to skip cleaning up test applications for further usage. The following flags are available to customize cleanup.
- `--cleanup`: Cleans up the KinD cluster and local registry after tests are completed.
- `--skip-cleanup-apps`: Skips the cleanup of test applications after the tests have been executed.

You can also directly use `go test` command-line arguments when running the tests. Some detailed examples are provided in the next part.

### Example Commands

- Full Test Run (First time):

  ```bash
  ./test/e2e/run_test.sh
  ```

  Use this command for the initial setup and test run to ensure everything is configured correctly.

- Subsequent Test Runs (Skipping all setup and only run tests):

  ```bash
  ./test/e2e/run_test.sh --only-run-tests
  ```

- Specifying a Pre-existing KinD Cluster:

  ```bash
  ./test/e2e/run_test.sh --cluster <KinD-Cluster-Name>
  ```
- Cleanup the KinD Cluster or Docker Registry After Tests

  ```bash
  ./test/e2e/run_test.sh --cleanup
  ```

You can directly use go test command-line arguments when running the tests. For example, you can filter specific tests, or control other aspects of the testing process directly from the command line.

- Selecting Specific Test Cases:

  ```bash
  ./test/e2e/run_test.sh --select-cases TestSpecificCase
  ```

- Controlling Test Verbosity

  ```bash
  ./test/e2e/run_test.sh -v
  ```
