# ADR 0002: Local-Only and No-Tracking Guardrails

- Status: accepted
- Date: 2026-03-06

## Context

Roadmap features must preserve trust posture: local-first processing, no tracking, and no silent
external transmission.

## Decision

Enforce guardrails in shared policy helpers:

- block non-local URL sinks for roadmap feature wrappers
- reject payloads containing tracking-like identifier keys
- gate feature execution by capability tier before action execution

## Consequences

- Security policy becomes testable and consistent across new roadmap features.
- External calls cannot be introduced accidentally without failing checks.
- New roadmap code paths must route through guardrail helpers.
