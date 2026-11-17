/** The triage filter fields. Revenue is in major units; an empty number field is null. */
export interface TriageFilterValues {
  minVotes: number | null;
  minMrr: number | null;
  minScore: number | null;
  segmentId: string;
}

export const noFilters: TriageFilterValues = {
  minVotes: null,
  minMrr: null,
  minScore: null,
  segmentId: "",
};

/** The query fields of listQuillsPosts for the filters, with revenue in cents. */
export const filterQuery = (values: TriageFilterValues) => ({
  ...(values.minVotes !== null && { minVotes: String(values.minVotes) }),
  ...(values.minMrr !== null && {
    minMrrCents: String(Math.round(values.minMrr * 100)),
  }),
  ...(values.minScore !== null && { minScore: String(values.minScore) }),
  ...(values.segmentId && { segmentIds: values.segmentId }),
});
