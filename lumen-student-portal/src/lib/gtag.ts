export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

// Track pageviews
export const pageview = (url: string) => {
  if (typeof window !== "undefined" && (window as any).gtag && GA_MEASUREMENT_ID) {
    (window as any).gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track custom GA4 events
export const event = (
  action: string,
  params: {
    event_category?: string;
    event_label?: string;
    value?: number;
    [key: string]: any;
  } = {}
) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", action, params);
  }
};

// ─── Pre-defined Custom Event Helpers for Medhashine Student Portal ──────────

/** Track when a student reads an academic insight */
export const trackInsightView = (data: {
  insight_id?: string;
  title: string;
  subject?: string;
  class_level?: string;
  teacher_name?: string;
}) => {
  event("view_insight", {
    event_category: "Academic Content",
    event_label: data.title,
    insight_id: data.insight_id,
    subject: data.subject,
    class_level: data.class_level,
    teacher_name: data.teacher_name,
  });
};

/** Track global searches */
export const trackSearch = (query: string) => {
  if (!query.trim()) return;
  event("search", {
    event_category: "User Discovery",
    search_term: query.trim(),
  });
};

/** Track teacher profile visits */
export const trackTeacherProfileView = (teacherName: string, teacherId?: string) => {
  event("view_teacher_profile", {
    event_category: "Educator Engagement",
    event_label: teacherName,
    teacher_id: teacherId,
  });
};

/** Track insight appreciation (likes) */
export const trackAppreciation = (title: string, insightId?: string) => {
  event("appreciate_insight", {
    event_category: "Student Feedback",
    event_label: title,
    insight_id: insightId,
  });
};

/** Track insight shares */
export const trackShare = (title: string, method?: string) => {
  event("share_insight", {
    event_category: "Social Engagement",
    event_label: title,
    method: method || "copy_link",
  });
};

/** Track teacher application submission */
export const trackBecomeTeacherSubmit = (name: string, email: string) => {
  event("become_teacher_submit", {
    event_category: "Educator Onboarding",
    event_label: name,
    applicant_email: email,
  });
};

/** Track insight publication */
export const trackInsightPublished = (title: string, topic?: string) => {
  event("publish_insight", {
    event_category: "Teacher Publishing",
    event_label: title,
    topic: topic,
  });
};
