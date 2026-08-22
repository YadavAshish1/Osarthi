"""
MongoDB Portal Domain Data MCP Tools.
"""

import re
from bson import ObjectId
from langchain_core.tools import tool

from app.core.database import get_mongo_db
from app.core.logger import logger


@tool
async def portal_get_platform_metrics() -> str:
    """
    Fetch global Osarthi statistics: user counts by role, active support tickets,
    pending teacher applications, published content, and taxonomy requests.
    Requires Administrator privileges.
    """
    try:
        db = get_mongo_db()

        # User counts
        pipeline = [{"$group": {"_id": "$role", "count": {"$sum": 1}}}]
        user_roles = {}
        async for doc in db["users"].aggregate(pipeline):
            user_roles[doc["_id"]] = doc["count"]

        # Support tickets
        open_tickets = await db["supporttickets"].count_documents({"status": {"$in": ["open", "in_progress"]}})

        # Teacher applications
        pending_teachers = await db["teacherapplications"].count_documents({"status": "pending"})

        # Taxonomy requests
        pending_taxonomy = await db["taxonomyrequests"].count_documents({"status": "pending"})

        # Content stats
        published_lessons = await db["contents"].count_documents({"published": True, "deletedAt": None})
        total_quizzes = await db["quizzes"].count_documents({})

        lines = [
            "📊 **Medhashine Platform Operations Analytics**\n",
            "**Registered Accounts:**",
            f"  • Students: {user_roles.get('student', 0)}",
            f"  • Teachers: {user_roles.get('teacher', 0)}",
            f"  • Admins: {user_roles.get('admin', 0)}",
            f"  • Super Admins: {user_roles.get('super_admin', 0)}",
            f"  • Total Platform Users: {sum(user_roles.values())}\n",
            "**Curriculum Content:**",
            f"  • Published Lessons: {published_lessons}",
            f"  • Active Quizzes: {total_quizzes}\n",
            "**Action Items Requiring Attention:**",
            f"  • 🎫 Pending Support Tickets: {open_tickets}",
            f"  • 📝 Pending Educator Applications: {pending_teachers}",
            f"  • 📂 Pending Taxonomy Requests: {pending_taxonomy}",
        ]
        return "\n".join(lines)

    except Exception as err:
        logger.error(f"Platform metrics error: {err}")
        return f"❌ Error querying platform metrics: {str(err)}"


@tool
async def portal_get_student_progress(student_id: str) -> str:
    """
    Retrieve academic profile, enrolled class, quiz results, scores, and learning history for a given student ID or email.
    """
    try:
        from bson import ObjectId
        db = get_mongo_db()
        student = None
        if ObjectId.is_valid(student_id):
            student = await db["users"].find_one({"_id": ObjectId(student_id)})
        if not student:
            student = await db["users"].find_one({"email": student_id.lower().strip()})
        if not student:
            return f"❌ Student record for '{student_id}' was not found in the database."

        # Fetch class name if present
        class_name = "General / Not Specified"
        if student.get("classRef"):
            c_doc = await db["classes"].find_one({"_id": student["classRef"]})
            if c_doc and c_doc.get("name") and c_doc.get("name").strip() not in [".", ""]:
                class_name = c_doc.get("name").strip()

        attempts_cursor = db["quizattempts"].find(
            {"studentId": student["_id"]}
        ).sort("submittedAt", -1).limit(10)

        attempts = []
        async for item in attempts_cursor:
            attempts.append(item)

        avg_score = 0.0
        if attempts:
            scores = [float(a.get("scorePercent", 0)) for a in attempts]
            avg_score = sum(scores) / len(scores)

        lines = [
            f"🎓 **Student Profile Summary**",
            f"• **Name:** {student.get('name', 'Student')}",
            f"• **Email:** {student.get('email', 'N/A')}",
            f"• **Enrolled Class:** {class_name}",
            f"• **Account Role:** {student.get('role', 'student')}\n",
            f"📊 **Learning & Quiz Performance:**",
            f"• **Total Quizzes Attempted:** {len(attempts)}",
            f"• **Average Score:** {avg_score:.1f}%\n",
            "**Recent Submissions:**",
        ]

        if not attempts:
            lines.append("  (Aapne abhi tak koi quiz attempt nahi kiya hai. Aap blogs padh kar quiz start kar sakte hain!)")
        else:
            for att in attempts[:5]:
                score = att.get("scorePercent", 0)
                status_icon = "🟢" if score >= 75 else "🟡" if score >= 50 else "🔴"
                lines.append(f"  {status_icon} Score: {score}%")

        return "\n".join(lines)

    except Exception as err:
        logger.error(f"Student progress error: {err}")
        return f"❌ Error fetching student records: {str(err)}"


def make_blog_slug(title: str, content_id: str) -> str:
    """Generate SEO-friendly blog URL slug compatible with Next.js frontend router."""
    clean = re.sub(r'[^\w\s-]', '', title).strip().lower()
    clean = re.sub(r'[-\s]+', '-', clean)
    if clean:
        return f"/blog/{clean}-{content_id}"
    return f"/blog/{content_id}"


def extract_text_from_blocks(blocks: list, max_len: int = 250) -> str:
    """Extract readable text snippet from lesson content blocks for summaries."""
    texts = []
    for b in blocks or []:
        if isinstance(b, dict):
            t = b.get("text", "")
            if t:
                texts.append(t)
            for item in b.get("items", []):
                if isinstance(item, str):
                    texts.append(item)
                elif isinstance(item, dict):
                    texts.append(item.get("text", ""))
    full = " ".join(texts).strip()
    return (full[:max_len].strip() + "...") if len(full) > max_len else full


@tool
async def portal_search_teachers_or_courses(query: str = "all", days: int = 0) -> str:
    """
    Search database for educators, teacher's published lessons/blogs, or latest blogs by keyword, subject, educator name, or date window.
    On Medhashine, 'blogs', 'lessons', 'insights', and 'articles' are identical.
    Supports queries like 'rmesh sir ke latest 3 blog', 'latest blogs in last 5 days', 'hindi', 'science', or 'all'.
    """
    try:
        db = get_mongo_db()
        clean_q = (query or "").strip().lower()
        total_teachers_count = await db["users"].count_documents({"role": "teacher"})

        is_general_inquiry = (
            not clean_q
            or clean_q in ["all", "teachers", "teacher", "educators", "total", "how many", "count", "list", "directory"]
            or "how many" in clean_q
            or "total" in clean_q
            or "kitne" in clean_q
            or "kaun" in clean_q
        )

        # Pre-fetch all teachers and map what subjects they teach
        all_teachers = []
        async for t in db["users"].find({"role": "teacher"}):
            t_id = t["_id"]
            subj_ids = await db["contents"].distinct("subjectRef", {"createdBy": t_id, "deletedAt": None})
            taught_subjects = []
            for sid in subj_ids:
                if sid:
                    s_doc = await db["subjects"].find_one({"_id": sid})
                    if s_doc and s_doc.get("name") not in taught_subjects:
                        taught_subjects.append(s_doc.get("name"))

            published_count = await db["contents"].count_documents({"createdBy": t_id, "deletedAt": None, "published": True})
            all_teachers.append({
                "_id": t_id,
                "name": t.get("name", "Educator"),
                "email": t.get("email", "N/A"),
                "bio": t.get("bio", ""),
                "subjects": taught_subjects,
                "lesson_count": published_count,
            })

        if is_general_inquiry:
            lines = [
                f"👨‍🏫 **Medhashine Educators & Teachers Directory**",
                f"• **Total Registered Educators:** {total_teachers_count}\n",
                "**Verified Educators on Medhashine:**",
            ]
            for t in all_teachers:
                subj_str = f" | Subjects: {', '.join(t['subjects'])}" if t["subjects"] else " | Subjects: General"
                bio_str = f" — *{t['bio']}*" if t["bio"] else ""
                lines.append(f"  • 👨‍🏫 **{t['name']}** ({t['email']}){subj_str} ({t['lesson_count']} Lessons/Blogs){bio_str}")

            return "\n".join(lines)

        # Extract days if mentioned in query (e.g. "last 5 days", "5 din", "3 days")
        target_days = days
        day_match = re.search(r'(\d+)\s*(day|days|din|दिन)', clean_q)
        if day_match:
            target_days = int(day_match.group(1))

        # Extract target count (e.g. "latest 3 blog", "5 lessons")
        target_limit = 5
        count_match = re.search(r'(?:latest|top|last)?\s*(\d+)\s*(?:blog|lesson|path|post|insight|item|topic)?', clean_q)
        if count_match and count_match.group(1):
            parsed_num = int(count_match.group(1))
            if 1 <= parsed_num <= 15:
                target_limit = parsed_num

        is_latest_query = any(w in clean_q for w in ["latest", "recent", "naye", "naya", "nayi", "last", "taaza", "हाल", "नवीनतम", "पिछले"])

        # Check teacher name / typo matching
        target_teacher = None
        for t in all_teachers:
            t_name_lower = t["name"].lower()
            name_parts = [p.strip(".").lower() for p in t["name"].split() if len(p.strip(".")) > 2]
            aliases = list(name_parts)
            if "ramesh" in t_name_lower:
                aliases.extend(["rmesh", "ramesh sir", "dr ramesh", "ramesh ji", "yaduvanshi"])
            elif "arpit" in t_name_lower:
                aliases.extend(["arpit sir", "arpit kumar"])
            elif "ashish" in t_name_lower:
                aliases.extend(["ashish sir", "ashish yadav"])

            if any(alias in clean_q for alias in aliases):
                target_teacher = t
                break

        # Handle Teacher Blogs/Lessons (either latest or general teacher search)
        if is_latest_query or target_days > 0 or target_teacher or any(w in clean_q for w in ["blog", "lesson", "post", "path"]):
            content_query = {"published": True, "deletedAt": None}
            if target_teacher:
                content_query["createdBy"] = target_teacher["_id"]

            if target_days > 0:
                from datetime import datetime, timezone, timedelta
                cutoff = datetime.now(timezone.utc) - timedelta(days=target_days)
                content_query["createdAt"] = {"$gte": cutoff}

            recent_lessons = []
            async for l in db["contents"].find(content_query).sort("createdAt", -1).limit(target_limit):
                c_name = "Class"
                s_name = "Subject"
                if l.get("classRef"):
                    c_doc = await db["classes"].find_one({"_id": l["classRef"]})
                    if c_doc:
                        c_name = c_doc.get("name", "Class")
                if l.get("subjectRef"):
                    s_doc = await db["subjects"].find_one({"_id": l["subjectRef"]})
                    if s_doc:
                        s_name = s_doc.get("name", "Subject")

                created_str = l.get("createdAt").strftime("%d %b %Y") if l.get("createdAt") else "Recently"
                slug_url = make_blog_slug(l.get("title", "lesson"), str(l["_id"]))
                summary_text = extract_text_from_blocks(l.get("blocks", []))

                recent_lessons.append({
                    "title": l.get("title", "Untitled"),
                    "class": c_name,
                    "subject": s_name,
                    "date": created_str,
                    "url": slug_url,
                    "summary": summary_text,
                })

            header_tname = f" by **{target_teacher['name']}**" if target_teacher else ""
            header_days = f" (Published in Last {target_days} Days)" if target_days > 0 else f" (Top {len(recent_lessons)} Lessons/Blogs)"
            lines = [f"📰 **Published Lessons/Blogs{header_tname}{header_days}:**\n"]

            if recent_lessons:
                for idx, l in enumerate(recent_lessons, 1):
                    lines.append(f"{idx}. 📖 [{l['title']}]({l['url']})")
                    lines.append(f"   • Class: {l['class']} | Subject: {l['subject']} | Published on: {l['date']}")
                    if l["summary"]:
                        lines.append(f"   • Summary: {l['summary']}\n")
                    else:
                        lines.append("")
            else:
                lines.append(f"No lessons were published within the requested timeframe ({target_days} days).")
                # Show fallback top recent lessons
                lines.append("\n**Most Recent Lessons Published on Medhashine:**")
                fallback_query = {"published": True, "deletedAt": None}
                if target_teacher:
                    fallback_query["createdBy"] = target_teacher["_id"]
                async for l in db["contents"].find(fallback_query).sort("createdAt", -1).limit(5):
                    slug_url = make_blog_slug(l.get("title", "lesson"), str(l["_id"]))
                    d_str = l.get("createdAt").strftime("%d %b %Y") if l.get("createdAt") else "Recently"
                    lines.append(f"  • 📖 [{l.get('title')}]({slug_url}) (Published: {d_str})")

            return "\n".join(lines)

        # Standard keyword / subject search
        regex_term = clean_q
        if clean_q in ["hindi", "हिंदी", "हिन्दी"]:
            regex_term = "हि|हिंदी|हिन्दी|hindi|पद्य|गद्य|व्याकरण"
        elif clean_q in ["science", "vigyan", "विज्ञान"]:
            regex_term = "science|विज्ञान|physics|chemistry|biology"

        # 1. Match teachers by subject taught, name, or bio
        matching_teachers = []
        for t in all_teachers:
            name_match = bool(re.search(regex_term, t["name"], re.I))
            bio_match = bool(re.search(regex_term, t["bio"], re.I))
            subject_match = any(re.search(regex_term, s, re.I) for s in t["subjects"])

            if name_match or bio_match or subject_match:
                matching_teachers.append(t)

        # 2. Search published lessons matching keyword/subject
        matching_lessons = []
        cursor_content = db["contents"].find(
            {"published": True, "deletedAt": None, "title": {"$regex": clean_q, "$options": "i"}},
            {"title": 1, "createdBy": 1, "classRef": 1, "subjectRef": 1, "createdAt": 1, "_id": 1},
        ).sort("createdAt", -1).limit(8)

        async for l in cursor_content:
            teacher_name = "Educator"
            if l.get("createdBy"):
                t_user = await db["users"].find_one({"_id": l["createdBy"]})
                if t_user:
                    teacher_name = t_user.get("name", "Educator")
            slug_url = make_blog_slug(l.get("title", "lesson"), str(l["_id"]))
            matching_lessons.append({
                "title": l.get("title"),
                "teacher": teacher_name,
                "url": slug_url,
            })

        lines = [
            f"🔍 **Search Results for: '{query}'** (Total Platform Educators: {total_teachers_count})\n",
        ]

        if matching_teachers:
            lines.append(f"**Educators teaching '{query}':**")
            for t in matching_teachers:
                subj_str = f" (Subjects: {', '.join(t['subjects'])})" if t["subjects"] else ""
                bio_str = f"\n     *Bio:* {t['bio']}" if t["bio"] else ""
                lines.append(f"  • 👨‍🏫 **{t['name']}** ({t['email']}){subj_str} — {t['lesson_count']} published lessons{bio_str}")
        else:
            lines.append(f"• Medhashine par currently **'{query}'** subject ke liye koi verified educator ya published lessons available nahi hain.")
            lines.append("\n**Available Platform Educators:**")
            for t in all_teachers:
                subj_str = f" | Subjects: {', '.join(t['subjects'])}" if t["subjects"] else ""
                lines.append(f"  • 👨‍🏫 **{t['name']}** ({t['email']}){subj_str} ({t['lesson_count']} Lessons)")

        if matching_lessons:
            lines.append(f"\n**Matching Lessons / Chapters for '{query}':**")
            for l in matching_lessons:
                lines.append(f"  • 📖 [{l['title']}]({l['url']}) — *Taught by: {l['teacher']}*")

        return "\n".join(lines)

    except Exception as err:
        logger.error(f"Portal search error: {err}")
        return f"❌ Error executing search: {str(err)}"

    except Exception as err:
        logger.error(f"Portal search error: {err}")
        return f"❌ Error executing search: {str(err)}"


@tool
async def portal_summarize_support_tickets(status: str = "open") -> str:
    """
    Summarize recent customer support and issue tickets.
    """
    try:
        db = get_mongo_db()
        query = {} if status == "all" else {"status": status}

        tickets = []
        cursor = db["supporttickets"].find(query).sort("createdAt", -1).limit(8)
        async for ticket in cursor:
            tickets.append(ticket)

        total_count = await db["supporttickets"].count_documents(query)
        lines = [f"🎫 **Support Tickets (Filter: {status.upper()} | Total: {total_count})**\n"]

        if not tickets:
            lines.append("No support tickets found.")
            return "\n".join(lines)

        for t in tickets:
            prio = t.get("priority", "normal")
            icon = "🔴" if prio == "high" else "🟡" if prio == "medium" else "🟢"
            lines.append(
                f"  {icon} **{t.get('subject', 'Untitled')}**\n"
                f"     Category: {t.get('category', 'General')} | Priority: {prio.upper()} | Status: {t.get('status')}"
            )

        return "\n".join(lines)

    except Exception as err:
        logger.error(f"Support ticket summary error: {err}")
        return f"❌ Error fetching tickets: {str(err)}"


@tool
async def portal_get_teacher_studio_stats(teacher_id: str) -> str:
    """
    Retrieve publishing studio analytics, views count, appreciations, and lesson performance for an educator/teacher.
    """
    try:
        from bson import ObjectId
        db = get_mongo_db()
        teacher = None
        if ObjectId.is_valid(teacher_id):
            teacher = await db["users"].find_one({"_id": ObjectId(teacher_id)})
        if not teacher:
            teacher = await db["users"].find_one({"email": teacher_id.lower().strip()})
        if not teacher:
            return f"❌ Educator record for '{teacher_id}' was not found."

        t_id = teacher["_id"]

        # Fetch published and draft counts
        published_cursor = db["contents"].find({"createdBy": t_id, "deletedAt": None, "published": True})
        published_lessons = []
        total_views = 0
        total_likes = 0
        total_bookmarks = 0

        async for item in published_cursor:
            published_lessons.append(item)
            total_views += item.get("viewsCount", 0)
            total_likes += item.get("likesCount", 0)
            total_bookmarks += item.get("bookmarksCount", 0)

        drafts_count = await db["contents"].count_documents({"createdBy": t_id, "deletedAt": None, "published": False})
        bin_count = await db["contents"].count_documents({"createdBy": t_id, "deletedAt": {"$ne": None}})

        # Sort top lessons by views
        published_lessons.sort(key=lambda x: x.get("viewsCount", 0), reverse=True)

        lines = [
            f"📊 **Educator Studio Analytics: {teacher.get('name', 'Educator')}**",
            f"• Email: {teacher.get('email', 'N/A')}",
            f"• Total Published Insights: {len(published_lessons)}",
            f"• Draft Lessons: {drafts_count}",
            f"• In Recycle Bin: {bin_count}\n",
            f"📈 **Audience Reach & Student Engagement:**",
            f"• Total Lesson Views/Reach: {total_views:,}",
            f"• Student Appreciations (Likes): {total_likes:,}",
            f"• Total Saved Bookmarks: {total_bookmarks:,}\n",
        ]

        if published_lessons:
            lines.append("**Top Performing Lessons:**")
            for l in published_lessons[:5]:
                lines.append(f"  • 📖 **{l.get('title')}** — 👁️ {l.get('viewsCount', 0)} views | ❤️ {l.get('likesCount', 0)} likes")
        else:
            lines.append("  (No published lessons yet. Start drafting in your Educator Studio!)")

        return "\n".join(lines)

    except Exception as err:
        logger.error(f"Teacher studio analytics error: {err}")
        return f"❌ Error retrieving educator analytics: {str(err)}"


@tool
async def portal_get_taxonomy_categories(query: str = "all") -> str:
    """
    Retrieve active Classes (Grades), Subjects, and complete list of Topics/Lessons for a given Class or Subject.
    Pass 'class 10', 'class 12', 'class 11', 'class 8', a subject name, or 'all' to list the full curriculum.
    """
    try:
        db = get_mongo_db()
        clean_q = (query or "all").strip().lower()

        # Check if query targets a specific class number
        class_regex = None
        if any(c in clean_q for c in ["10", "tenth", "ten"]):
            class_regex = "10"
        elif any(c in clean_q for c in ["12", "twelfth", "twelve"]):
            class_regex = "12"
        elif any(c in clean_q for c in ["11", "eleventh", "eleven"]):
            class_regex = "11"
        elif any(c in clean_q for c in ["8", "eighth", "eight"]):
            class_regex = "8"

        # 1. If targeting a specific class:
        if class_regex:
            target_class = await db["classes"].find_one({
                "name": {"$regex": class_regex, "$options": "i"},
                "deletedAt": None
            })
            if not target_class:
                return f"❌ Class '{query}' not found in the Medhashine curriculum."

            c_id = target_class["_id"]
            c_name = target_class.get("name", "Class")

            # Fetch subjects for this class
            subjects = []
            async for s in db["subjects"].find({"classRef": c_id, "deletedAt": None}):
                subjects.append(s)

            total_class_lessons = await db["contents"].count_documents({
                "classRef": c_id, "published": True, "deletedAt": None
            })

            lines = [
                f"📚 **{c_name} — Complete Curriculum & Topics Directory**",
                f"• **Total Published Lessons/Topics:** {total_class_lessons}\n",
            ]

            for s in subjects:
                s_id = s["_id"]
                s_name = s.get("name", "Subject")
                lessons = []
                async for l in db["contents"].find({
                    "classRef": c_id, "subjectRef": s_id, "published": True, "deletedAt": None
                }, {"title": 1, "_id": 1}):
                    lessons.append((l.get("title", "Lesson"), str(l["_id"])))

                lines.append(f"📘 **Subject: {s_name}** ({len(lessons)} Topics/Lessons):")
                if lessons:
                    for idx, (title, lid) in enumerate(lessons, 1):
                        lines.append(f"  {idx}. 📖 [{title}](/blog/{lid})")
                else:
                    lines.append("  (No lessons published under this subject yet.)")
                lines.append("")

            # Any lesson directly under class without subject
            other_lessons = []
            subj_ids = [s["_id"] for s in subjects]
            async for l in db["contents"].find({
                "classRef": c_id, "published": True, "deletedAt": None,
                "subjectRef": {"$nin": subj_ids}
            }, {"title": 1, "_id": 1}):
                other_lessons.append((l.get("title", "Lesson"), str(l["_id"])))

            if other_lessons:
                lines.append(f"📑 **General / Additional Lessons** ({len(other_lessons)} Topics):")
                for idx, (title, lid) in enumerate(other_lessons, 1):
                    lines.append(f"  {idx}. 📖 [{title}](/blog/{lid})")
                lines.append("")

            return "\n".join(lines)

        # 2. If general overview of all classes and curriculum:
        classes = []
        async for c in db["classes"].find({"deletedAt": None}):
            classes.append(c)

        lines = [
            "📚 **Medhashine Academic Curriculum & Classes Overview**\n",
            "**Available Classes & Subject Breakdown:**",
        ]

        total_portal_lessons = await db["contents"].count_documents({"published": True, "deletedAt": None})

        for c in classes:
            c_id = c["_id"]
            c_name = c.get("name", "Class")
            subjs = []
            async for s in db["subjects"].find({"classRef": c_id, "deletedAt": None}):
                subjs.append(s.get("name"))

            c_lesson_count = await db["contents"].count_documents({
                "classRef": c_id, "published": True, "deletedAt": None
            })

            subj_str = ", ".join(subjs) if subjs else "General"
            lines.append(f"  • 🏫 **{c_name}** — Subjects: *{subj_str}* ({c_lesson_count} Topics published)")

        lines.append(f"\n• **Total Published Insights on Platform:** {total_portal_lessons}")
        lines.append("\n*(Tip: Ask 'Class 10 ke topics' ya 'Class 12 ke topics' to get the full detailed chapter-wise list!)*")

        return "\n".join(lines)

    except Exception as err:
        logger.error(f"Taxonomy categories error: {err}")
        return f"❌ Error fetching curriculum categories: {str(err)}"


@tool
async def portal_get_portal_guide(topic: str = "general") -> str:
    """
    Get official platform FAQs, guides, and feature workflows for Medhashine.
    Topics: 'quizzes', 'bookmarks', 'become_teacher', 'publishing', 'requests', 'support', 'general'.
    """
    clean_t = (topic or "").strip().lower()

    if "quiz" in clean_t:
        return (
            "🎯 **How Quizzes Work on Medhashine:**\n"
            "• After reading any lesson or blog chapter, scroll to the bottom to take the interactive Chapter Quiz.\n"
            "• Quizzes contain instant scoring, detailed explanations for correct answers, and performance analytics.\n"
            "• Your quiz history and scores are recorded in your Profile (`/profile`) and tracked by your AI Study Tutor!"
        )

    if "bookmark" in clean_t or "save" in clean_t:
        return (
            "🔖 **How to Save Bookmarks & Read Later:**\n"
            "• Click the bookmark icon on any lesson card or at the top of any article.\n"
            "• All saved lessons can be accessed anytime in your Profile under 'Saved Insights'."
        )

    if "teacher" in clean_t or "apply" in clean_t:
        return (
            "👨‍🏫 **How to Become a Verified Educator on Medhashine:**\n"
            "1. Visit the `/become-a-teacher` page from the footer or navigation.\n"
            "2. Fill in your educational background, subject expertise, and teaching bio.\n"
            "3. Platform administrators review and approve applications within 24-48 hours.\n"
            "4. Once approved, you get access to the rich Native Content Editor and Teacher Studio!"
        )

    if "write" in clean_t or "publish" in clean_t:
        return (
            "✍️ **How Teachers Publish Insights:**\n"
            "• Go to `/teacher/write` to access the Native Content Editor.\n"
            "• You can add rich formatting, code snippets, callout blocks, formulas, and attach interactive Quizzes with MCQs.\n"
            "• Save drafts anytime or click 'Publish' to make it live for students immediately."
        )

    if "request" in clean_t or "taxonomy" in clean_t:
        return (
            "📂 **How to Request New Subjects or Classes:**\n"
            "• Verified educators can go to `/teacher/requests`.\n"
            "• Submit a request for a new Class or Subject taxonomy category.\n"
            "• Admins review and approve it from the Admin Portal."
        )

    return (
        "🌟 **Medhashine Platform Overview:**\n"
        "• **For Students:** Free curriculum notes, chapter explanations, interactive quizzes, AI Study Tutor, and teacher profiles.\n"
        "• **For Teachers:** Creator Studio, audience reach analytics, lesson publishing, and category requests.\n"
        "• **Help Center:** For assistance, visit `/help` or submit a ticket to our support team."
    )

