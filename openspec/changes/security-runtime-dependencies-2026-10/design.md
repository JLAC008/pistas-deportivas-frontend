# Design

## Context

Auditoría npm actual y boletín Node del 21 de octubre: 22.23.4 corrige vulnerabilidades del runtime. El runtime realmente desplegado sigue pendiente de comprobar en Dokploy.

## Goals / Non-Goals

Eliminar vulnerabilidades del árbol verificado y conservar comportamiento. No modificar esquema ni datos.

## Decisions

Mantener Angular core/compiler/CLI/build en la versión 21.2.25/21.2.28 compatible y fijar Node 22.23.4 con Alpine. El runtime instala `http-server@14.1.1` mediante un lockfile aislado y `npm ci --omit=dev`; el árbol runtime auditado no tiene vulnerabilidades. No usar `npm audit fix --force`. Conservar cambios ajenos.

## Risks / Trade-offs

`npm audit` del proyecto y del servidor runtime da cero vulnerabilidades. El proyecto no declara tests unitarios ni tiene archivos `*.spec.ts`; `npm run lint` informa tres errores en dos componentes que no forman parte del diff. La compilación Angular, el build Docker y el smoke local del HTML y JS pasan. Una auditoría de manifiestos no equivale a escaneo de imagen.

## Migration Plan

No hay base de datos ni migraciones para este frontend. Se verificaron el remoto y la rama `origin/master` de Dokploy; el push dispara Auto Deploy de producción. Tras publicar, comprobar el commit y HTTP del dominio.
