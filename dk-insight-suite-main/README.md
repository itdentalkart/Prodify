# DK Productivity Suite

A multi-tenant SaaS employee monitoring and productivity platform.

## Overview

DK Productivity Suite is a We360-style enterprise monitoring tool that enables organizations to track employee productivity, capture screenshots, monitor device activity, and generate insights — all within a secure, multi-tenant architecture.

## Architecture

### Multi-Tenant SaaS Model

- **Tenant Isolation**: Each organization (company) gets its own isolated data space via `org_id` scoping
- **Self-Registration**: Companies sign up with a company name, automatically creating an organization, admin account, and license record
- **License-Based Access**: Super Admin assigns device licenses per tenant; enrollment is blocked when licenses are exhausted
- **Role-Based Access Control (RBAC)**: `super_admin`, `admin`, `it`, `employee` roles with granular RLS policies

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Backend | Lovable Cloud (Supabase) |
| Database | PostgreSQL with RLS |
| Auth | Supabase Auth |
| Storage | Supabase Storage (screenshots) |
| Agent | C# .NET 7 Windows Service |
| Edge Functions | Deno (agent-enroll, agent-heartbeat, agent-screenshot, agent-events) |

## Features

### For Tenants (Companies)

- **Dashboard** — Real-time productivity metrics, activity timeline, device status
- **Device Management** — Enroll, monitor, and manage Windows devices
- **Screenshot Capture** — Periodic screenshots with timeline viewer
- **Session Tracking** — Active/idle time per device per session
- **Productivity Analytics** — Charts, gauges, and trends
- **User Management** — Manage team members with role assignment
- **Audit Logs** — Complete activity trail for compliance
- **Email Notifications** — Configurable alerts for offline devices, enrollments
- **PWA Support** — Installable on mobile devices

### For Super Admin

- **Tenant Management** — View all organizations, users, and devices
- **License Management** — Assign device licenses per tenant (manual)
- **Status Control** — Activate, suspend, or expire tenant licenses

## Licensing Model

1. A company signs up → org + license record created with **0 licenses**
2. Super Admin reviews and assigns N device licenses
3. Company generates enrollment tokens and enrolls devices (up to N)
4. When a device is deleted, the used license count decreases automatically

## Windows Agent (C# .NET 7)

The agent runs as a Windows Service and communicates with the backend via HTTPS REST:

| Function | Endpoint |
|----------|----------|
| Enrollment | `POST /agent-enroll` |
| Heartbeat | `POST /agent-heartbeat` |
| Screenshot Upload | `POST /agent-screenshot` |
| Telemetry Events | `POST /agent-events` |

### Agent Deployment

- **MSI Installer** — Built with WiX Toolset v4 for enterprise deployment
- **PowerShell Script** — `install.ps1` for manual installation
- **Silent Install** — `msiexec /i DKAgent.msi /qn SERVERURL="..." ENROLLTOKEN="..."`
- **Group Policy** — GPO deployment guide included

### Agent Features

- Screenshot capture (configurable interval, JPEG compressed, deduplication)
- Idle detection via WinAPI `GetLastInputInfo`
- Working hours enforcement
- Heartbeat telemetry
- Session management (start/end/idle transitions)
- Offline event buffering (planned)

## Roles & Permissions

| Role | Scope |
|------|-------|
| `super_admin` | All tenants — manage orgs, licenses, view all data |
| `admin` | Own org — full management, users, devices, settings |
| `it` | Own org — device management, screenshots, sessions |
| `employee` | Own data only |

## Getting Started

### Development

```bash
git clone <repo-url>
cd dk-productivity-suite
npm install
npm run dev
```

### Production Deployment

The frontend is deployed via Lovable. Backend runs on Lovable Cloud.

## Environment Variables

Automatically managed by Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Security

- All data encrypted at rest and in transit
- Row-Level Security (RLS) on every table
- Security Definer functions to prevent RLS recursion
- Agent tokens are unique per device
- Enrollment tokens are one-time use with expiry
- Audit logging for compliance
- HR consent template available
