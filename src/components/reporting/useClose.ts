"use client";

import { useMemo } from "react";
import { fundById } from "@/lib/data";
import { gpById } from "@/lib/gps";
import { computeFigures, partnerRows, prevPeriod, runChecks, periodName, type Period } from "@/lib/reporting/figures";
import { fundAdjustments, getClose, staleKeys, useReporting, type Close } from "@/lib/reporting/store";
import { REPORT_STATUS, type Report } from "@/lib/studio/model";
import { quarterlyFor, useStudio } from "@/lib/studio/store";

export type StepState = "done" | "current" | "waiting" | "todo" | "blocked";
export type Step = { id: string; title: string; detail: string; state: StepState; owner: "Aurum" | "Manager" };

const BOOK_CHECKS = ["capital", "called", "distributions", "ledger", "fees"];

/** Everything about one fund's close, derived once: figures, partners, checks, staleness, steps and the next action. */
export function useClose(fundId: string, period: Period) {
  const s = useReporting();
  const st = useStudio();
  return useMemo(() => deriveClose(s, fundId, period, st), [s, fundId, period, st]);
}

/** Figures the quarterly report and the package must agree on. */
const REPORT_KEYS = ["nav", "commitments", "called", "distributed", "tvpi", "dpi", "q_called", "q_distributed", "q_pnl"];

export function deriveClose(s: ReturnType<typeof useReporting>, fundId: string, period: Period, studioState?: ReturnType<typeof useStudio>) {
  const fund = fundById(fundId)!;
  const gp = gpById(fund.gpId)!;
  const close = getClose(s, fundId, period);
  const adjustments = fundAdjustments(s, fundId, period);
  const figures = computeFigures(fundId, period, adjustments);
  const prevClose = getClose(s, fundId, prevPeriod(period));
  const prevFigures = prevClose && prevClose.status !== "not_started" ? computeFigures(fundId, prevPeriod(period), fundAdjustments(s, fundId, prevPeriod(period))) : null;
  const partners = partnerRows(fundId, period, adjustments);
  const current = Object.fromEntries(Object.values(figures).map((f) => [f.key, f.value]));
  const stale = close ? staleKeys(close, current) : [];
  const checks = runChecks(fundId, period, adjustments, {
    valuations: !close || close.request.status === "not_sent" || close.request.status === "sent" ? "missing" : close.request.status === "submitted" ? "submitted" : "posted",
    staleFigures: stale.length,
    reviewed: !!close?.snapshot,
  });
  const bookChecksPass = checks.filter((c) => BOOK_CHECKS.includes(c.id)).every((c) => c.status === "pass");
  const failing = checks.filter((c) => c.status === "fail");
  const openComments = close?.comments.filter((c) => !c.resolved) ?? [];
  const report = studioState ? quarterlyFor(studioState, fundId, period) : null;
  // an approved report shows its frozen snapshot; if the close's figures moved since, it must be refreshed and approved again
  const reportStale =
    report && report.status !== "published" && report.snapshot
      ? REPORT_KEYS.filter((k) => {
          const a = report.snapshot!.data.metrics[k]?.value;
          const b = current[k];
          return typeof a === "number" && typeof b === "number" ? Math.abs(a - b) > 0.005 : a !== b;
        })
      : [];
  const reportReady = !!report && (report.status === "approved" || report.status === "published") && reportStale.length === 0;
  const steps = close ? stepsFor(close, gp.shortName, bookChecksPass, partners.length, openComments.length, studioState ? report : undefined) : [];
  const readyForReview =
    !!close &&
    close.status === "preparing" &&
    steps.filter((x) => x.id !== "review" && x.id !== "approval" && x.id !== "publish").every((x) => x.state === "done") &&
    openComments.length === 0;
  return {
    fund,
    gp,
    close,
    figures,
    prevFigures,
    partners,
    checks,
    failing,
    stale,
    bookChecksPass,
    openComments,
    steps,
    readyForReview,
    adjustments,
    report,
    reportReady,
    reportStale,
  };
}

function stepsFor(c: Close, gpName: string, checksPass: boolean, lps: number, openComments: number, report?: Report | null): Step[] {
  const after = (s: Close["status"]) => ["in_review", "with_gp", "approved", "published"].indexOf(c.status) >= ["in_review", "with_gp", "approved", "published"].indexOf(s);
  const r = c.request.status;
  const list: Step[] = [
    {
      id: "books",
      title: "Close the books",
      detail: c.booksClosed ? `Closed by ${c.booksClosed.by}` : `Lock ${periodName(c.period)} so the figures stop moving.`,
      state: c.booksClosed ? "done" : "current",
      owner: "Aurum",
    },
    {
      id: "valuations",
      title: "Valuations and commentary from the manager",
      detail:
        r === "posted"
          ? "Received and posted"
          : r === "submitted"
            ? `${gpName} answered — review and post the valuation`
            : r === "sent"
              ? `Waiting for ${gpName}`
              : `Ask ${gpName} for the portfolio's fair value and the quarter's commentary.`,
      state: r === "posted" ? "done" : r === "sent" ? "waiting" : "current",
      owner: r === "sent" ? "Manager" : "Aurum",
    },
    {
      id: "checks",
      title: "Tie-out checks",
      detail: checksPass ? "The books tie out" : "Some checks need attention",
      state: checksPass ? "done" : "blocked",
      owner: "Aurum",
    },
    {
      id: "statements",
      title: "Capital account statements",
      detail: c.statements ? `${lps} generated` : `Generate one statement for each of the ${lps} partners.`,
      state: c.statements ? "done" : "current",
      owner: "Aurum",
    },
    ...(report === undefined
      ? []
      : [
          {
            id: "report",
            title: "Quarterly report",
            detail: !report
              ? "Create it in Report Studio from the Quarterly Fund Report template."
              : report.status === "approved" || report.status === "published"
                ? `${REPORT_STATUS[report.status]} in Report Studio`
                : `${REPORT_STATUS[report.status]} in Report Studio — it must be approved before the package goes to review.`,
            state: (report && (report.status === "approved" || report.status === "published") ? "done" : after("in_review") ? "done" : "current") as StepState,
            owner: "Aurum" as const,
          },
        ]),
    {
      id: "letter",
      title: "Investor letter",
      detail: after("in_review") ? "Ready" : openComments ? `${openComments} open comment${openComments > 1 ? "s" : ""}` : "Check the wording; figures update from the books.",
      state: after("in_review") ? "done" : openComments ? "blocked" : "done",
      owner: "Aurum",
    },
    {
      id: "review",
      title: "Review by Aurum",
      detail: c.reviewed ? `Reviewed by ${c.reviewed.by}` : c.status === "in_review" ? "Review the package and send it to the manager" : "A second person checks the package.",
      state: c.reviewed ? "done" : c.status === "in_review" ? "current" : "todo",
      owner: "Aurum",
    },
    {
      id: "approval",
      title: `Approval by ${gpName}`,
      detail: c.gpApproved ? `Approved by ${c.gpApproved.by}` : c.status === "with_gp" ? `Waiting for ${gpName}` : "The manager approves and certifies the package.",
      state: c.gpApproved ? "done" : c.status === "with_gp" ? "waiting" : "todo",
      owner: "Manager",
    },
    {
      id: "publish",
      title: "Publish to investors",
      detail: c.published ? `Published by ${c.published.by}` : "Letter, report and statements go to the investor portal together.",
      state: c.published ? "done" : c.status === "approved" ? "current" : "todo",
      owner: "Aurum",
    },
  ];
  // Before the letter step has been reached, it is not yet "done" in a meaningful sense: keep it neutral.
  const li = list.findIndex((x) => x.id === "letter");
  if (c.status === "preparing" && !openComments) list[li].state = list.slice(0, li).every((x) => x.state === "done") ? "done" : "todo";
  return list;
}
