---
title: Run Unit test
sidebar_position: 1
---

# Run Unit Test

Compiling Kmesh directly in the operating system requires a certain [OS version](https://github.com/kmesh-net/kmesh/blob/main/docs/kmesh_support.md). Therefore, in order to allow all operating systems to run Kmesh's UT, Kmesh provides two ways to do so. One to run the go unit test in docker and one to run the go unit test locally.

Developers of unsupported kernel version can run go unit test in docker through script. Developers of supported version can run go unit test locally through script.

```sh
cd $(Kmesh root directory)

# Run kmesh ut through docker
./hack/run-ut.sh --docker

# Run kmesh ut locally
./hack/run-ut.sh --local
```

Alternatively, you can execute the test by `make test`:

```sh
# Run kmesh ut through docker
make test RUN_IN_CONTAINER=1

# Run kmesh ut locally
make test RUN_IN_CONTAINER=0
```

## Unit test

This section describes the ut settings for Kmesh so that developers can run unit tests without using scripts.

Because Kmesh uses eBPF, you need to set some environment variables when running Kmesh-related Unit Tests.

```sh
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/usr/local/lib:$ROOT_DIR/api/v2-c:$ROOT_DIR/bpf/deserialization_to_bpf_map
export PKG_CONFIG_PATH=$ROOT_DIR/mk
```

Set `LD_LIBRARY_PATH` so that the system can find the .so files.

Set `PKG_CONFIG_PATH` so that the system can find the .pc files that Kmesh compiled.

In addition to this, you may also encounter a c header file not found error. Such errors can be resolved by setting `C_INCLUDE_PATH`. The header files needed for Kmesh are saved in the [bpf](https://github.com/kmesh-net/kmesh/tree/main/bpf) folder.

Note the **multiple header file** problem.

Besides the above issues, since Kmesh ut uses gomonkey, there may be a situation where monkey's functions are small and inlined during Go compilation optimization.

We can solve this problem by adding the following parameter to the go test execution:

```bash
-gcflags="all=-N -l"
```
