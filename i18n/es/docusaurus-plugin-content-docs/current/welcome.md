---
sidebar_position: 1
title: Bienvenido
last_update:
  date: "2025-02-22"
---

# Bienvenido a Kmesh: Plano de datos de Service Mesh de alto rendimiento y baja sobrecarga

Kmesh aprovecha eBPF y kernels programables para descargar la gestión de tráfico al sistema operativo, acelerando el rendimiento del service mesh. En comparación con los service meshes tradicionales, ofrece ventajas como baja latencia, arquitectura sin sidecar y bajo consumo de recursos.

## ¿Por qué Kmesh?

- **Rendimiento Superior**: Reduce la latencia del service mesh mediante optimizaciones a nivel de kernel
- **Eficiencia de Recursos**: Minimiza la sobrecarga implementando la gobernanza de servicios en la capa del sistema operativo
- **Operaciones Simplificadas**: Agiliza la gestión del service mesh con enrutamiento de tráfico integrado en el kernel
- **Integración Nativa en la Nube**: Funciona perfectamente con la infraestructura nativa de la nube existente

## Beneficios Principales

| Beneficio                 | Descripción                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| Reducción de Latencia     | El enrutamiento directo en el kernel reduce la sobrecarga de comunicación servicio a servicio |
| Optimización de Recursos  | Menor uso de CPU y memoria a través de la implementación en la capa del SO                    |
| Arquitectura Simplificada | Menos saltos en las rutas de acceso a servicios mejoran el rendimiento general                |

En los siguientes documentos, explicaremos:

- La [arquitectura](/docs/architecture/) y destaca las ventajas de Kmesh.
- El [inicio rápido](/docs/setup/quick-start) de Kmesh.
- El [rendimiento](/docs/performance/) de Kmesh.
- La [comunidad](/docs/community/contribute.md) de Kmesh.
