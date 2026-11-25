import type { Metadata } from "next";
import {
  InsightsSearchParams,
  getTaxonomyMetadata,
  loadTaxonomyInsightsPage,
} from "@/lib/insightsTaxonomy";
import TaxonomyInsightsView from "../../TaxonomyInsightsView";

type PageProps = {
  params: Promise<{ classSlug: string; subjectSlug: string }>;
  searchParams: Promise<InsightsSearchParams>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ classSlug, subjectSlug }, sp] = await Promise.all([params, searchParams]);
  return getTaxonomyMetadata({ classSlug, subjectSlug }, sp);
}

export default async function SubjectInsightsPage({ params, searchParams }: PageProps) {
  const [{ classSlug, subjectSlug }, sp] = await Promise.all([params, searchParams]);
  const data = await loadTaxonomyInsightsPage({ classSlug, subjectSlug }, sp);
  return <TaxonomyInsightsView data={data} />;
}
