import type { Metadata } from "next";
import {
  InsightsSearchParams,
  getTaxonomyMetadata,
  loadTaxonomyInsightsPage,
} from "@/lib/insightsTaxonomy";
import TaxonomyInsightsView from "../TaxonomyInsightsView";

type PageProps = {
  params: Promise<{ classSlug: string }>;
  searchParams: Promise<InsightsSearchParams>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ classSlug }, sp] = await Promise.all([params, searchParams]);
  return getTaxonomyMetadata({ classSlug }, sp);
}

export default async function ClassInsightsPage({ params, searchParams }: PageProps) {
  const [{ classSlug }, sp] = await Promise.all([params, searchParams]);
  const data = await loadTaxonomyInsightsPage({ classSlug }, sp);
  return <TaxonomyInsightsView data={data} />;
}
