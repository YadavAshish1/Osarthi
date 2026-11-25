import type { ResolvedTaxonomyPageData } from "@/lib/insightsTaxonomy";
import TaxonomyInsightsClient from "./TaxonomyInsightsClient";

export default function TaxonomyInsightsView({ data }: { data: ResolvedTaxonomyPageData }) {
  const {
    blogs,
    total,
    hasMore,
    pageNum,
    sortParam,
    tree,
    teachers,
    popularBlogs,
    matchedIds,
    taxonomyContext,
    searchQuery,
  } = data;

  const baseUrl = "https://www.medhashine.in";
  const isUnfilteredFirstPage =
    pageNum === 1 && sortParam === "newest" && !searchQuery.q && !searchQuery.teacher_id;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: taxonomyContext.breadcrumbs.map((bc, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: bc.label,
      item: `${baseUrl}${bc.href || taxonomyContext.canonicalPath}`,
    })),
  };

  const collectionJsonLd =
    isUnfilteredFirstPage && blogs && blogs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${taxonomyContext.title}${taxonomyContext.accentTitle} | Medhashine`,
          url: `${baseUrl}${taxonomyContext.canonicalPath}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: total,
            itemListElement: blogs.slice(0, 12).map((b, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              url: `${baseUrl}/blog/${encodeURIComponent(b.slug || b.id)}`,
              name: b.title,
            })),
          },
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {collectionJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
        />
      )}
      <TaxonomyInsightsClient
        initialBlogs={blogs}
        initialTotal={total}
        initialHasMore={hasMore}
        initialPage={pageNum}
        initialTeachers={teachers}
        popularBlogs={popularBlogs}
        tree={tree}
        matchedIds={matchedIds}
        taxonomyContext={taxonomyContext}
        initialQuery={{
          q: searchQuery.q,
          teacher_id: searchQuery.teacher_id,
          sort: sortParam,
        }}
      />
    </>
  );
}
