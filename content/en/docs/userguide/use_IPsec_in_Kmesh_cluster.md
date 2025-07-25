---
draft: true
linktitle: use IPsec in Kmesh cluster
menu:
  docs:
    parent: user guide
    weight: 21
title: use IPsec in Kmesh cluster
toc: true
type: docs

---

### Use IPsec in Kmesh cluster

IPsec is a mature and widely used encryption method for inter node communication. This document explains how to enable IPsec for two Kmesh managed nodes in a Kmesh cluster to encrypt communication data between both parties.

### How to enable IPsec in Kmesh

**Step 1: Generate an IPsec pre shared key for Kmesh before starting the Kmesh by kmeshctl. Currently, only the rfc4106 (gcm (AES)) algorithm is supported. key need 36 characters(32 character as algo key, 4 character as salt)**
``` bash
kmeshctl secret --key=<aead key>
```

If you want to randomly generate a key, you can use the following command
```bash
kmeshctl secret --key=$(dd if=/dev/urandom count=36 bs=1 2>/dev/null | xxd -p -c 64)
```
If you want use custom key, you can use the following command
``` bash
kmeshctl secret --key=$(echo -n "{36-character user-defined key here}" | xxd -p -c 64)
```

**Step 2: Add the parameter --enable-ipsec=true to the Kmesh yaml**

	kmesh.yaml
	...
		  args:
            [
              "./start_kmesh.sh --mode=dual-engine --enable-bypass=false --enable-ipsec=true",
            ]
	...

**Step 3: Place pods or namespace under the management of Kmesh.**

Only when both communicating pods are managed by Kmesh, will they enter the encryption process.
``` bash
kubectl label namespace default istio.io/dataplane-mode=Kmesh
```
**Step 4: Test whether the data packet has been encrypted**

Use tcpdump on nodes to capture packets and check if IPsec has been used during data communication between nodes (determined by ESP packets)

	root@master:~/kmesh# tcpdump -i any |grep ESP
	...
	14:19:24.143654 ?    Out IP master > node1: ESP(spi=0x00000001,seq=0x3da88), length 80
	14:19:24.143690 ?    Out IP master > node1: ESP(spi=0x00000001,seq=0x3da89), length 80
	14:19:24.143707 ?    In  IP node1 > master: ESP(spi=0x00000001,seq=0x3c037), length 80
	14:19:24.143738 ?    In  IP node1 > master: ESP(spi=0x00000001,seq=0x3c038), length 172
	...

**Step 5: Replace pre shared key**

After a period of time, the pre shared key of the cluster can be changed. After changing the pre shared key, the ESP SPI number of the IPsec used for communication between nodes will be increased by 1 compared to the previous version. You can be observed again through tcpdump. The initial IPSec SPI version number is 1

	root@master:~/kmesh# tcpdump -i any |grep ESP
	...
	14:26:33.782665 ?    Out IP master > node1: ESP(spi=0x00000002,seq=0x1aaa1), length 80
	14:26:33.782666 ?    Out IP master > node1: ESP(spi=0x00000002,seq=0x1aaa2), length 80
	14:26:33.782667 ?    In  IP node1 > master: ESP(spi=0x00000002,seq=0x183d2), length 80
	14:26:33.782667 ?    In  IP node1 > master: ESP(spi=0x00000002,seq=0x183d3), length 80
	...

### Note

1、 IPsec encryption uses mark `0xe0` and `0xd0` as markers for IPsec encryption and decryption. Please ensure that no conflicting Makr is used on the host network, otherwise unknown behavior may occur

2、Please ensure that `address MASQ` is not used on packets encrypted with IPsec. After address MASQ, IPsec cannot accurately match encryption and decryption rules, which can result in packet loss
