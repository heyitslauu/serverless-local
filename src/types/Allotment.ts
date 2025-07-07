export interface AllotmentFilters {
  status?: string;
  createdAtRange?: { from: string; to: string };
  papId?: string;
  allotmentId?: string;
  search?: string;
  particulars?: string;
}

export interface AllotmentBreakdown {
  fieldOfficeId: string;
  papId: string;
  uacsId: string;
  amount: number;
}

export interface Allotment {
  officeId: string;
  allotmentId: string;
  particulars: string;
  appropriationType: string;
  bfarsBudgetType: string;
  allotmentType: string;
  status:
    | "for-triage"
    | "for-processing"
    | "for-peer-review"
    | "for-approval"
    | "approved-and-posted"
    | "completed";
  breakdown: AllotmentBreakdown[];
}
