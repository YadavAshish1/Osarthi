import type { Metadata } from "next";
import {
  InsightsSearchParams,
  getTaxonomyMetadata,
  loadTaxonomyInsightsPage,
} from "@/lib/insightsTaxonomy";
import TaxonomyInsightsView from "../../../TaxonomyInsightsView";

type PageProps = {
  params: Promise<{ classSlug: string; subjectSlug: string; topic: string }>;
  searchParams: Promise<InsightsSearchParams>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ classSlug, subjectSlug, topic }, sp] = await Promise.all([params, searchParams]);
  return getTaxonomyMetadata({ classSlug, subjectSlug, topicSlug: topic }, sp);
}

export default async function TopicInsightsPage({ params, searchParams }: PageProps) {
  const [{ classSlug, subjectSlug, topic }, sp] = await Promise.all([params, searchParams]);
  const data = await loadTaxonomyInsightsPage({ classSlug, subjectSlug, topicSlug: topic }, sp);
  return <TaxonomyInsightsView data={data} />;
}
