import Link from "next/link";
import { TenantName } from "@/components/brand/TenantName";
import type { Metadata } from "next";
import { ArrowLeft, Check, UserPlus } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { HexaAccess } from "@/components/admin/HexaAccess";
import { Avatar, Button, Panel, Status, cx } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { auditLog, controls, permissionGroups, roleById, roles, users } from "@/lib/access";
import { date, dateTime, initials } from "@/lib/format";

export const metadata: Metadata = { title: "Access & permissions" };

const audiences = ["Aurum staff", "Client (GP)", "Investor", "External"] as const;

export default function AccessPage() {
  const usersTab = (
    <Panel flush>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Audience</th>
              <th>Scope</th>
              <th>Sign-in</th>
              <th>Last active</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const r = roleById(u.role);
              return (
                <tr key={u.email}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar label={initials(u.name)} />
                      <div>
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-[12px] text-stone-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="font-medium">{r.name}</td>
                  <td className="text-stone-600">{r.audience}</td>
                  <td className="text-stone-600">{u.scope}</td>
                  <td className="text-[12px] text-stone-600">{u.mfa}</td>
                  <td className="num text-stone-600">{u.lastActive === "—" ? "—" : date(u.lastActive)}</td>
                  <td>
                    <Status value={u.status === "Active" ? "Clear" : u.status === "Invited" ? "Invited" : "Expiring"} />
                    {u.status.startsWith("Expires") && <div className="mt-1 text-[11px] text-stone-500">{u.status}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );

  const matrix = (
    <Panel flush>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="min-w-[260px]">Permission</th>
              {roles.map((r) => (
                <th key={r.id} className="!whitespace-normal text-center align-bottom leading-tight">
                  <span className="block text-[10px] font-semibold text-stone-400">{r.audience}</span>
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionGroups.flatMap((g) => [
              <tr key={g.label}>
                <td colSpan={roles.length + 1} className="bg-stone-25 text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500">
                  {g.label}
                </td>
              </tr>,
              ...g.items.map((p) => (
                <tr key={p.key}>
                  <td className="text-ink-800">{p.label}</td>
                  {roles.map((r) => (
                    <td key={r.id} className="text-center">
                      {r.permissions.includes(p.key) ? (
                        <Check size={15} strokeWidth={2.4} className="mx-auto text-ink-900" />
                      ) : (
                        <span className="text-stone-300">·</span>
                      )}
                    </td>
                  ))}
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
    </Panel>
  );

  const rolesTab = (
    <div className="space-y-6">
      {audiences.map((a) => (
        <section key={a}>
          <h2 className="eyebrow mb-3">{a}</h2>
          <div className="grid gap-px overflow-hidden rounded-[8px] border border-stone-200/70 bg-stone-200 shadow-card md:grid-cols-2 xl:grid-cols-3">
            {roles
              .filter((r) => r.audience === a)
              .map((r) => (
                <div key={r.id} className="bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[14px] font-semibold">{r.name}</h3>
                    <span className="num shrink-0 text-[11px] text-stone-400">{users.filter((u) => u.role === r.id).length} users</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-gold-700">{r.scope}</div>
                  <p className="mt-2 text-[13px] leading-relaxed text-stone-600">{r.description}</p>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );

  const controlsTab = (
    <div className="grid gap-px overflow-hidden rounded-[8px] border border-stone-200/70 bg-stone-200 shadow-card md:grid-cols-2">
      {controls.map(([t, d]) => (
        <div key={t} className="bg-white p-5">
          <h3 className="text-[14px] font-semibold">{t}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-stone-600">{d}</p>
        </div>
      ))}
    </div>
  );

  const auditTab = (
    <Panel flush>
      <table className="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Object</th>
            <th>IP address</th>
          </tr>
        </thead>
        <tbody>
          {auditLog.map((e) => (
            <tr key={e.at}>
              <td className="num text-stone-600">{dateTime(e.at)}</td>
              <td className="font-semibold">{e.user}</td>
              <td>{e.action}</td>
              <td className="text-stone-600">{e.object}</td>
              <td className="font-mono text-[12px] text-stone-500">{e.ip}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-stone-100 px-5 py-3 text-[12px] text-stone-500">
        The audit log is append-only and cannot be edited or deleted, including by platform administrators.
      </p>
    </Panel>
  );

  return (
    <AppShell context="Access & permissions">
      <main className="w-full flex-1 space-y-6 px-8 py-8">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-ink-900">
          <ArrowLeft size={14} strokeWidth={1.8} /> <TenantName /> Platform
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <div className="eyebrow">Platform</div>
            <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.015em]">Access & permissions</h1>
            <p className="mt-1.5 max-w-[720px] text-[14px] text-stone-600">
              Access is a role (what someone may do) combined with a scope (which funds or investing entities they see). Approvals
              on money and fund economics always need two different people.
            </p>
          </div>
          <Button>
            <UserPlus size={14} strokeWidth={1.8} /> Invite user
          </Button>
        </div>
        <div className={cx("grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-[8px] border border-stone-200/70 bg-stone-200 shadow-card")}>
          {audiences.map((a) => (
            <div key={a} className="bg-white px-5 py-4">
              <div className="eyebrow">{a}</div>
              <div className="num mt-1 text-[22px] font-medium">{users.filter((u) => roleById(u.role).audience === a).length}</div>
              <div className="text-[12px] text-stone-500">{roles.filter((r) => r.audience === a).length} roles</div>
            </div>
          ))}
        </div>
        <Tabs
          tabs={[
            { id: "hexagons", label: "Hexagon access", content: <HexaAccess /> },
            { id: "users", label: "Users", count: users.length, content: usersTab },
            { id: "roles", label: "Roles", count: roles.length, content: rolesTab },
            { id: "matrix", label: "Permission matrix", content: matrix },
            { id: "controls", label: "Controls", count: controls.length, content: controlsTab },
            { id: "audit", label: "Audit log", content: auditTab },
          ]}
        />
      </main>
    </AppShell>
  );
}
