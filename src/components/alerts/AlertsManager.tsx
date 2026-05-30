"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, ChevronDown, ChevronRight, ExternalLink, Info, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/components/auth/CurrentUserProvider";
import {
  acknowledgeAlert,
  createAlert,
  deleteAlert,
  getAlerts,
  getRooms,
  getSensors,
  resolveAlert,
  updateAlert,
} from "@/lib/building-api";
import {
  alertSeverityLabel,
  alertSeverityVariant,
  alertSourceLabel,
  alertSourceVariant,
  alertStatusVariant,
  formatDateTime,
  groupOperationalAlerts,
  operationalAlertCategoryLabel,
} from "@/lib/building-ui";
import { hasPermission } from "@/lib/rbac";
import type { AlertFormInput } from "@/lib/validation";
import type { AlertStatus, AlertWithRelations, RoomWithRelations, SensorWithRelations } from "@/types/building";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { EmptyState } from "../common/EmptyState";
import { Feedback } from "../common/Feedback";
import { Toast } from "../common/Toast";
import { AlertForm } from "./AlertForm";

export function AlertsManager() {
  const currentUser = useCurrentUser();
  const canCreateAlert = hasPermission(currentUser.role, "alert:create");
  const canUpdateAlert = hasPermission(currentUser.role, "alert:update");
  const canDeleteAlert = hasPermission(currentUser.role, "alert:delete");
  const [alerts, setAlerts] = useState<AlertWithRelations[]>([]);
  const [rooms, setRooms] = useState<RoomWithRelations[]>([]);
  const [sensors, setSensors] = useState<SensorWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "ALL">("ACTIVE");
  const [editingAlert, setEditingAlert] = useState<AlertWithRelations | null>(null);
  const [deletingAlert, setDeletingAlert] = useState<AlertWithRelations | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const dismissToast = useCallback(() => setFeedback(null), []);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getAlerts(), getRooms(), getSensors()])
      .then(([alertData, roomData, sensorData]) => {
        if (isMounted) {
          setAlerts(alertData);
          setRooms(roomData);
          setSensors(sensorData);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : "Failed to load alerts.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleAlerts = useMemo(() => {
    if (statusFilter === "ALL") {
      return alerts;
    }

    return alerts.filter((alert) => alert.status === statusFilter);
  }, [alerts, statusFilter]);
  const visibleAlertGroups = useMemo(() => groupOperationalAlerts(visibleAlerts), [visibleAlerts]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current);

      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }

      return next;
    });
  };

  const handleSubmit = async (input: AlertFormInput) => {
    if (editingAlert?.source === "SYSTEM") {
      setError("System alerts can only be acknowledged or resolved.");
      return;
    }

    if ((editingAlert && !canUpdateAlert) || (!editingAlert && !canCreateAlert)) {
      setError("Your role can view alerts but cannot save alert changes.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      if (editingAlert) {
        const updated = await updateAlert(editingAlert.id, input);
        setAlerts((current) => current.map((alert) => (alert.id === updated.id ? updated : alert)));
        setFeedback("Alert updated.");
      } else {
        const created = await createAlert(input);
        setAlerts((current) => [created, ...current]);
        setFeedback("Alert created.");
      }

      setEditingAlert(null);
      setIsFormOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save alert.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAlert || !canDeleteAlert) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await deleteAlert(deletingAlert.id);
      setAlerts((current) => current.filter((alert) => alert.id !== deletingAlert.id));
      setFeedback("Alert deleted.");
      setDeletingAlert(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete alert.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledge = async (alert: AlertWithRelations) => {
    if (!canUpdateAlert) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const updated = await acknowledgeAlert(alert.id);
      setAlerts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setFeedback("Alert acknowledged.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to acknowledge alert.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (alert: AlertWithRelations) => {
    if (!canUpdateAlert) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const updated = await resolveAlert(alert.id);
      setAlerts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setFeedback("Alert resolved.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to resolve alert.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Card>Loading alerts...</Card>;
  }

  const renderAlertRow = (
    alert: AlertWithRelations,
    {
      groupLabel,
      groupId,
      supportingCount = 0,
      isExpanded = false,
      isSupportingSignal = false,
    }: {
      groupLabel?: string;
      groupId?: string;
      supportingCount?: number;
      isExpanded?: boolean;
      isSupportingSignal?: boolean;
    } = {},
  ) => (
    <tr
      key={`${isSupportingSignal ? "supporting" : "primary"}-${alert.id}`}
      className={`transition hover:bg-slate-50 ${isSupportingSignal ? "bg-slate-50/60 text-xs" : ""}`}
    >
      <td className={isSupportingSignal ? "py-2 pl-10 pr-5" : "px-5 py-4"}>
        {isSupportingSignal && (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Supporting signal</p>
        )}
        {!isSupportingSignal && groupLabel && (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-teal-700">{groupLabel}</p>
        )}
        <p className={`font-semibold leading-6 ${isSupportingSignal ? "text-slate-700" : "text-slate-900"}`}>
          {alert.message}
        </p>
        <p className="mt-1 text-xs text-slate-500">{alert.sensor?.name ?? "No sensor attached"}</p>
        {!isSupportingSignal && supportingCount > 0 && (
          <button
            type="button"
            onClick={() => groupId && toggleGroup(groupId)}
            className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            {supportingCount} supporting signal{supportingCount === 1 ? "" : "s"}
          </button>
        )}
      </td>
      <td className={isSupportingSignal ? "px-5 py-2" : "px-5 py-4"}>
        <Link
          href={`/floor-plan?roomId=${encodeURIComponent(alert.roomId)}`}
          className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-800"
        >
          {alert.room.name}
          <ExternalLink size={13} />
        </Link>
      </td>
      <td className={isSupportingSignal ? "px-5 py-2 text-center" : "px-5 py-4 text-center"}>
        <Badge variant={alertSeverityVariant(alert.severity)}>
          {alertSeverityLabel(alert.severity)}
        </Badge>
      </td>
      <td className={isSupportingSignal ? "px-5 py-2 text-center" : "px-5 py-4 text-center"}>
        <Badge variant={alertSourceVariant(alert.source)}>
          {alertSourceLabel(alert.source)}
        </Badge>
      </td>
      <td className={isSupportingSignal ? "px-5 py-2 text-center" : "px-5 py-4 text-center"}>
        <Badge variant={alertStatusVariant(alert.status)} showDot>
          {alert.status}
        </Badge>
        {alert.acknowledgedAt && alert.status === "ACTIVE" && (
          <p className="mt-1 text-[10px] font-semibold text-slate-500">Acknowledged</p>
        )}
      </td>
      <td className={isSupportingSignal ? "px-5 py-2 text-center text-xs font-medium text-slate-400" : "px-5 py-4 text-center text-xs font-medium text-slate-500"}>
        {formatDateTime(alert.createdAt)}
      </td>
      {(canUpdateAlert || canDeleteAlert) && (
        <td className={isSupportingSignal ? "px-5 py-2" : "px-5 py-4"}>
          <div className="flex flex-wrap justify-end gap-2">
            {canUpdateAlert && alert.status === "ACTIVE" && !alert.acknowledgedAt && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleAcknowledge(alert)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
              >
                <Check size={14} />
                Acknowledge
              </button>
            )}
            {canUpdateAlert && alert.status === "ACTIVE" && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleResolve(alert)}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
              >
                <CheckCircle2 size={14} />
                Resolve
              </button>
            )}
            {canUpdateAlert && alert.source === "MANUAL" && (
              <button
                type="button"
                onClick={() => {
                  setEditingAlert(alert);
                  setIsFormOpen(true);
                }}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label={`Edit alert for ${alert.room.name}`}
              >
                <Pencil size={15} />
              </button>
            )}
            {canDeleteAlert && alert.source === "MANUAL" && (
              <button
                type="button"
                onClick={() => setDeletingAlert(alert)}
                className="rounded-lg border border-rose-200 p-2 text-rose-500 transition hover:bg-rose-50"
                aria-label={`Delete alert for ${alert.room.name}`}
              >
                <Trash2 size={15} />
              </button>
            )}
            {alert.source === "SYSTEM" && (
              <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-500">
                System managed
              </span>
            )}
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <div className="space-y-6">
      {error && <Feedback type="error" message={error} />}
      <Toast message={feedback} onDismiss={dismissToast} />

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-medium leading-5 text-sky-800">
            <Info size={15} className="mt-0.5 shrink-0" />
            <p>
              System alerts are generated from building readings and can be acknowledged or resolved.
              Manual alerts can also be edited or deleted.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as AlertStatus | "ALL")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ACTIVE">Active alerts</option>
            <option value="RESOLVED">Resolved alerts</option>
            <option value="ALL">All alerts</option>
          </select>
          {canCreateAlert && (
            <button
              type="button"
              onClick={() => {
                setEditingAlert(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={15} />
              Add alert
            </button>
          )}
          </div>
        </div>
      </Card>

      {isFormOpen && (editingAlert ? canUpdateAlert : canCreateAlert) && (
        <Card title={editingAlert ? "Edit Alert" : "Create Alert"}>
          <AlertForm
            alert={editingAlert}
            rooms={rooms}
            sensors={sensors}
            isSubmitting={isSubmitting}
            onCancel={() => {
              setEditingAlert(null);
              setIsFormOpen(false);
            }}
            onSubmit={handleSubmit}
          />
        </Card>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {visibleAlertGroups.length === 0 ? (
          <EmptyState
            title="No alerts found"
            message={canCreateAlert ? "Create an alert or change the status filter." : "Change the status filter to inspect alerts."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="px-5 py-4">Alert</th>
                  <th className="px-5 py-4">Room</th>
                  <th className="px-5 py-4 text-center">Severity</th>
                  <th className="px-5 py-4 text-center">Source</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-center">Created</th>
                  {(canUpdateAlert || canDeleteAlert) && <th className="px-5 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {visibleAlertGroups.map((group) => (
                  <Fragment key={group.id}>
                    {renderAlertRow(group.primary, {
                      groupLabel: operationalAlertCategoryLabel(group.category),
                      groupId: group.id,
                      supportingCount: group.diagnostics.length,
                      isExpanded: expandedGroups.has(group.id),
                    })}
                    {expandedGroups.has(group.id) &&
                      group.diagnostics.map((alert) =>
                        renderAlertRow(alert, {
                          isSupportingSignal: true,
                        }),
                      )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deletingAlert && (
        <ConfirmDialog
          title="Delete alert?"
          message="This permanently removes the alert record from the operations dashboard."
          isBusy={isSubmitting}
          onCancel={() => setDeletingAlert(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
