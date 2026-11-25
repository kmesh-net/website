---
sidebar_position: 5
title: "Using the Kmesh MCP Server"
description: "Connect Claude Desktop or Cursor to Kmesh and diagnose service connectivity with read-only MCP tools."
keywords: [kmesh, mcp, model context protocol, claude, cursor, diagnostics]
---

# Using the Kmesh MCP Server

The Kmesh MCP server (`kmeshctl mcp serve`) exposes Kmesh internals as
[Model Context Protocol](https://modelcontextprotocol.io) tools. AI agents can
then answer questions like "which services are running?" or "why can service A
not reach service B?" using the tools instead of hand-written `kubectl` and
daemon commands.

The server is a thin, read-only layer:

![Kmesh MCP Server architecture](/img/mcp/architecture.svg)

- **Daemon tools** open a short-lived port-forward to the kmesh-daemon status
  server (`:15200`) and query config dumps, BPF maps, logger levels or health.
- **Kubernetes tools** use the Kubernetes API for pods, namespaces, services,
  waypoints and secrets.
- **Nothing is mutated.** Every tool only reads.

Because the server runs as a local process, the client must be able to start a
local MCP server (for example Claude Desktop, Cursor, VS Code Copilot or Gemini
CLI). Browser-only chat apps cannot connect to it.

:::note
Data comes from one daemon pod. On a multi-node cluster, use
`list_daemon_pods` and pass `podName` to check each node.
:::

## Prerequisites

| Requirement | Details |
| --- | --- |
| Kmesh | Dual-engine mode. See the [Kmesh support matrix](https://github.com/kmesh-net/kmesh/blob/main/docs/en/kmesh_support.md) for the supported Istio versions (1.26 to 1.31 for dual-engine). |
| Daemon image | Exposes the operating mode in `/version`. Current images do. |
| kubectl | Access to `kmesh-system` and the workloads you want to inspect. |
| Go | 1.25 or later, only when building `kmeshctl` from source. |
| AI client | Claude Desktop, Cursor, or another client that can run a local MCP server. |

Check that the cluster is healthy before connecting a client:

![Cluster health](/img/mcp/01-cluster-health.png)

## Build the server

```bash
git clone https://github.com/kmesh-net/kmesh.git
cd kmesh
make mcp-server
```

This produces `out/kmeshctl`. The repository also provides the `make mcp-test`,
`make mcp-smoke` and `make mcp-image` targets:

![Build output](/img/mcp/02-build-server.png)

## Connect Claude Desktop

### Find the config file

Claude Desktop stores MCP servers in `claude_desktop_config.json`.

| Platform | Location |
| --- | --- |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Windows (Microsoft Store / MSIX) | `%LOCALAPPDATA%\Claude-Data\claude_desktop_config.json` (the exact folder that **Edit Config** opens) |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |

The reliable route is to edit `claude_desktop_config.json` directly at the
path above, and create it if it does not exist.

On Claude Desktop 6.28899.x the in-app route is:

1. **Settings** → **Desktop app**
2. Scroll to **Extensions** and click **Manage**
3. Under **Local MCP servers**, click **Edit config**

Older builds expose **Settings** → **Developer** → **Edit Config**. The menu
location changes between versions; if you cannot find it, edit the file
directly.

### Add the server

```json
{
  "mcpServers": {
    "kmesh": {
      "command": "/path/to/kmeshctl",
      "args": ["mcp", "serve"]
    }
  }
}
```

If Claude Desktop runs on Windows and `kmeshctl` lives inside WSL, use WSL as
the command:

```json
{
  "mcpServers": {
    "kmesh": {
      "command": "wsl",
      "args": ["-e", "/home/<your-user>/bin/kmeshctl", "mcp", "serve"]
    }
  }
}
```

After saving, fully quit Claude Desktop (including the tray icon) and reopen
it. The server then appears as a local MCP server with a running status. On
version 6.28899.x this is **Settings** → **Desktop app** → **Extensions** →
**Manage**; other builds show it under **Plugins** → **Connectors**:

![Claude Desktop connected to the Kmesh MCP server](/img/mcp/04-claude-connected.png)

## Connect Cursor

Add the same server block to `~/.cursor/mcp.json` (on Windows:
`%USERPROFILE%\.cursor\mcp.json`) and restart Cursor.

Other local clients work the same way: use the same command and arguments in
the client's MCP configuration (for example VS Code Copilot or Gemini CLI).

## Run over SSE

```bash
out/kmeshctl mcp serve --transport sse
```

The SSE transport listens on `localhost:8080` and runs in the foreground.

:::warning
The SSE transport has no authentication or TLS and binds to loopback only. Use
it locally. Keep stdio (the default) for desktop clients.
:::

## Run in Docker

```bash
make mcp-image

docker run --rm -i -v ~/.kube/config:/kubeconfig \
  -e KUBECONFIG=/kubeconfig kmesh-mcp:latest
```

The `-i` flag is required: without it stdin is not attached and the stdio
transport cannot receive requests. If your kubeconfig is only readable by your
user (the default `600` mode on Linux and macOS), pass
`--user "$(id -u):$(id -g)"` so the container can read it.

:::note
The SSE transport is not available from the container yet because it binds to
the container's loopback interface. Run SSE from the host if you need it.
:::

## Walkthrough

New chats sometimes report that a tool is not loaded yet on the very first
call. Run a lightweight tool first (for example `get_version`) so the client
loads the tool definitions, then continue.

### 1. Check the daemon version and mode

```text
get Kmesh version and mode
```

The response includes the version, commit, build date and the operating mode.
Here the daemon reports `dual-engine`:

![Get version and mode](/img/mcp/05-get-version.png)

### 2. Diagnose a healthy path

```text
diagnose connectivity from productpage-v1 to reviews in bookinfo
```

The tool resolves the source workload and the target service, then checks the
BPF maps against the configuration dump. A healthy path looks like this:

- verdict `reachable-suspected`
- the target service VIP and its waypoint address
- the number of backends programmed in BPF
- a reminder that this is a configuration check, not a live request

![Diagnose a healthy path](/img/mcp/06-diagnose-success.png)

### 3. Understand a failure

```text
diagnose connectivity from sleep to productpage in bookinfo
```

The `sleep` pod sits in the `default` namespace, which is not enrolled in the
mesh. The tool reports `source-not-enrolled` and explains that the pod's
traffic never reaches the Kmesh data plane, with the commands to enrol the
namespace:

![Diagnose a failure](/img/mcp/07-diagnose-failure.png)

Other verdicts you may see are `target-not-found`, `target-not-enrolled`,
`missing-endpoints`, `blocked-by-policy` and `needs-manual-inspection`.

### 4. Inspect the tool call

Expand the tool call in the chat to see the request that Claude sent. This is
useful when you build your own client or debug arguments:

![Tool request JSON](/img/mcp/08-tool-request.png)

## Verify traffic end to end

The MCP tools explain configuration. To prove that packets flow, run a request
from an enrolled pod. The bookinfo application images do not ship `curl`, so
start a temporary client pod:

```bash
kubectl -n bookinfo run demo-curl --image=curlimages/curl:8.10.1 \
  --restart=Never --command -- sleep 120

kubectl -n bookinfo wait --for=condition=ready pod/demo-curl

kubectl -n bookinfo exec demo-curl -- curl -s -o /dev/null \
  -w "HTTP %{http_code}\n" \
  http://productpage.bookinfo.svc.cluster.local:9080/productpage

kubectl -n bookinfo delete pod demo-curl
```

A `200` confirms the request reached the service through the data plane:

![Live traffic returns 200](/img/mcp/09-live-200.png)

## Run the smoke test

The repository ships an end-to-end smoke test that starts the real server over
stdio and SSE and exercises all 15 tools:

```bash
make mcp-smoke
```

It needs a cluster with Kmesh installed. A healthy run prints 18 stdio checks,
4 SSE checks and `MCP end-to-end smoke test PASSED`:

![Smoke test passed](/img/mcp/10-smoke-pass.png)

## Tool catalog

| Group | Tools |
| --- | --- |
| Cluster discovery | `get_version`, `list_daemon_pods`, `get_daemon_health`, `get_mesh_namespaces`, `list_mesh_services` |
| Status server | `config_dump`, `get_bpf_maps`, `get_bpf_workload_details`, `get_bpf_ads_details`, `get_logger_levels` |
| Waypoints | `list_waypoints`, `get_waypoint_status` |
| Security | `get_authz_status`, `get_ipsec_status` |
| Diagnostics | `diagnose_connectivity` |

The full input and output reference is in the repository:
[Kmesh MCP tools reference](https://github.com/kmesh-net/kmesh/blob/main/docs/mcp-tools.md).

## Troubleshooting

- **"tool has not been loaded yet"**: this is client-side behaviour, not a
  server error. In a new chat the client may call a tool before loading its
  definition. Run a lightweight tool such as `get_version` first, or resend
  the request.
- **"pod ... not found"**: the `podName` argument points at a daemon pod that
  was recreated. Leave `podName` empty to auto-discover the current pod.
- **"no kmesh daemon pods found"**: Kmesh is not installed in `kmesh-system`,
  or the pod is not Running and Ready.
- **Port 8080 already in use**: stop the process that owns the port before
  starting the SSE transport.
- **Cannot reach the cluster**: check `KUBECONFIG` and the current context.
- **VIP or waypoint failures**: confirm the cluster is on a supported Istio
  version for dual-engine, then check the waypoint pod and Gateway status.
- **Cluster on kind or Docker Desktop stopped**: start Docker Desktop and wait
  for the node to be Ready again.

## Limitations

- The server is read-only. It never changes the cluster or the daemon.
- Data comes from one daemon pod. On a multi-node cluster, check each node
  separately.

## References

- [Kmesh MCP tools reference](https://github.com/kmesh-net/kmesh/blob/main/docs/mcp-tools.md)
- [MCP server proposal](https://github.com/kmesh-net/kmesh/blob/main/docs/proposal/MCP_Server_AI_Native_Kmesh.md)
- [Feature request: MCP server for Kmesh](https://github.com/kmesh-net/kmesh/issues/1800)
- [Kmesh support matrix](https://github.com/kmesh-net/kmesh/blob/main/docs/en/kmesh_support.md)
