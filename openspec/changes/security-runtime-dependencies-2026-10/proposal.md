# Proposal

## Why

La auditoría del 2026-10-23 detecta dependencias con avisos publicados y runtimes Docker sin parche mínimo verificable. Se actualizan Angular y Node a parches recientes y se fija el servidor estático de producción con lockfile.

## What Changes

Actualizar Angular de forma coherente, fijar Node 22.23.4 y sustituir la instalación global sin lockfile de `http-server` por instalación aislada desde manifiesto y lockfile. Mantener los contratos existentes y documentar resultados de lint.

## Capabilities

Sin cambios funcionales intencionados; skip_specs: true por mantenimiento de dependencias.

## Impact

package.json, package-lock.json, Dockerfile y lockfile del servidor estático. Sin cambios de esquema PostgreSQL, variables ni topología Compose. La rama `master` tiene Auto Deploy; el usuario autorizó publicar los proyectos uno a uno y verificar cada despliegue antes de continuar.
