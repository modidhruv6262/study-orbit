import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
import httpx
import pymupdf

from app.config import settings

logger = logging.getLogger(__name__)

WORD_NUMBERS = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
    'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
    'nineteen': 19, 'twenty': 20, 'first': 1, 'second': 2, 'third': 3,
    'fourth': 4, 'fifth': 5, 'sixth': 6, 'seventh': 7, 'eighth': 8,
    'ninth': 9, 'tenth': 10, 'eleventh': 11, 'twelfth': 12
}

ROMAN_NUMBERS = {
    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10,
    'xi': 11, 'xii': 12, 'xiii': 13, 'xiv': 14, 'xv': 15, 'xvi': 16, 'xvii': 17, 'xviii': 18, 'xix': 19, 'xx': 20
}

def clean_text(text: str) -> str:
    """Removes non-printable chars, fixes corrupted symbols and hyphens, collapses spaces."""
    if not text:
        return ""
    # In some PDFs, hyphens or bullets get extracted as replacement characters (\ufffd)
    text = re.sub(r'(\w)\s*[\ufffd\x00-\x1f\x7f-\x9f]+\s*(\w)', r'\1 - \2', text)
    text = re.sub(r'[\x00-\x1f\x7f-\x9f\ufffd]+', ' ', text)
    text = re.sub(r'\s*[\-–—]\s*', ' - ', text)
    return re.sub(r'\s+', ' ', text).strip()

def parse_num_or_word(val: str) -> Optional[int]:
    """Parses a digit string, roman numeral, or english word number into an integer."""
    if not val:
        return None
    val_clean = val.strip().lower()
    if val_clean.isdigit():
        return int(val_clean)
    if val_clean in WORD_NUMBERS:
        return WORD_NUMBERS[val_clean]
    if val_clean in ROMAN_NUMBERS:
        return ROMAN_NUMBERS[val_clean]
    return None


class PDFProcessorService:
    @staticmethod
    def extract_document_hierarchy(file_path: str, subject_name: str) -> Dict[str, Any]:
        """
        Extracts a highly accurate hierarchical map (Chapters -> Topics -> Subtopics -> Pages)
        from a textbook PDF of any size, format, or layout.
        Uses 4 complementary tiers:
        1. Embedded PDF Bookmarks / Outline (TOC)
        2. Printed Table of Contents pages (with LLM or regex parsing)
        3. Visual layout & font-hierarchy full document scanner
        4. Intelligent curriculum fallback
        """
        doc = pymupdf.open(file_path)
        total_pages = len(doc)
        chapters = []

        # Tier 1: Read embedded PDF Bookmarks / TOC
        try:
            toc = doc.get_toc() # format: [[lvl, title, page], ...]
            if toc and len(toc) >= 2:
                chapters = PDFProcessorService._parse_toc_to_hierarchy(doc, toc, total_pages)
                if chapters and len(chapters) >= 2:
                    logger.info(f"Tier 1 (Embedded TOC) succeeded with {len(chapters)} chapters")
        except Exception as e:
            logger.warning(f"Error parsing PDF TOC: {e}")

        # Tier 2: Search for printed Table of Contents pages
        if not chapters or len(chapters) < 2:
            try:
                chapters = PDFProcessorService._scan_printed_toc(doc, total_pages)
                if chapters and len(chapters) >= 2:
                    logger.info(f"Tier 2 (Printed TOC) succeeded with {len(chapters)} chapters")
            except Exception as e:
                logger.warning(f"Error parsing printed TOC: {e}")

        # Tier 3: Visual layout and font-hierarchy full document scan
        if not chapters or len(chapters) < 2:
            try:
                chapters = PDFProcessorService._heuristic_scan_full_document(doc, total_pages)
                if chapters and len(chapters) >= 2:
                    logger.info(f"Tier 3 (Visual Heading Scan) succeeded with {len(chapters)} chapters")
            except Exception as e:
                logger.warning(f"Error scanning full document heuristics: {e}")

        # Tier 4: Fallback proportional units
        if not chapters or len(chapters) < 2:
            logger.info("Falling back to Tier 4 proportional curriculum partitioning")
            chapters = PDFProcessorService._fallback_chunking(total_pages, subject_name)

        doc.close()

        # Build clean summary markdown
        summary_markdown = PDFProcessorService._build_summary_markdown(subject_name, chapters)
        total_topics = sum(len(c.get("topics", [])) for c in chapters)

        return {
            "subject": subject_name,
            "total_chapters": len(chapters),
            "total_topics": total_topics,
            "total_pages": total_pages,
            "chapters": chapters,
            "summary_markdown": summary_markdown
        }

    @staticmethod
    def _parse_toc_to_hierarchy(doc: pymupdf.Document, toc: list, total_pages: int) -> List[Dict[str, Any]]:
        """
        Parses PDF bookmarks outline into structured chapters and topics.
        Handles both hierarchical and flat TOCs (like slide decks or session handouts).
        """
        ignore_prefixes = [
            'cover', 'title', 'copyright', 'foreword', 'preface', 'dedication',
            'table of contents', 'contents', 'acknowledgement', 'how to use'
        ]

        valid_entries = []
        for item in toc:
            lvl, raw_title, page = item[0], clean_text(item[1]), max(1, item[2])
            if not raw_title or len(raw_title) < 2:
                continue
            lower_title = raw_title.lower()
            if any(lower_title.startswith(p) for p in ignore_prefixes):
                continue
            valid_entries.append((lvl, raw_title, page))

        if len(valid_entries) < 2:
            return []

        levels = [e[0] for e in valid_entries]
        has_multi_levels = len(set(levels)) > 1

        chapters = []
        current_chapter = None
        current_topic = None

        if has_multi_levels:
            for lvl, title, page in valid_entries:
                if lvl == 1:
                    if current_chapter:
                        current_chapter["page_end"] = max(current_chapter["page_start"], page - 1)
                        if current_topic:
                            current_topic["page_end"] = max(current_topic["page_start"], page - 1)

                    ch_num = len(chapters) + 1
                    num_match = re.search(r'\b\d+\b', title)
                    if num_match:
                        try:
                            ch_num = int(num_match.group())
                        except ValueError:
                            pass

                    clean_title = re.sub(r'^(?:Chapter|Unit|Module|Session|Part|Week|Lesson)\s*\d+[\s:\-\.]*', '', title, flags=re.IGNORECASE).strip()
                    if not clean_title:
                        clean_title = title

                    current_chapter = {
                        "chapter_number": ch_num,
                        "chapter_title": title if any(k in title.lower() for k in ["chapter", "session", "module", "unit"]) else f"Chapter {ch_num}: {clean_title}",
                        "page_start": page,
                        "page_end": total_pages,
                        "estimated_study_minutes": 180,
                        "topics": []
                    }
                    chapters.append(current_chapter)
                    current_topic = None

                elif lvl == 2 and current_chapter:
                    if current_topic:
                        current_topic["page_end"] = max(current_topic["page_start"], page - 1)

                    top_id = f"{current_chapter['chapter_number']}.{len(current_chapter['topics']) + 1}"
                    clean_top = re.sub(r'^\d+\.\d+\s*[\:\-\.]*', '', title).strip()
                    current_topic = {
                        "topic_id": top_id,
                        "title": clean_top or title,
                        "page_start": page,
                        "page_end": total_pages,
                        "subtopics": [],
                        "key_terms": [],
                        "estimated_minutes": 45
                    }
                    current_chapter["topics"].append(current_topic)

                elif lvl >= 3 and current_topic:
                    clean_sub = re.sub(r'^\d+(\.\d+)+\s*[\:\-\.]*', '', title).strip()
                    current_topic["subtopics"].append(clean_sub or title)

        else:
            # Flat TOC (e.g. Session 01, Session 02, Session 03, or Chapter 1, Chapter 2...)
            for idx, (_, title, page) in enumerate(valid_entries):
                ch_num = idx + 1
                num_match = re.search(r'\b\d+\b', title)
                if num_match:
                    try:
                        ch_num = int(num_match.group())
                    except ValueError:
                        pass

                clean_title = re.sub(r'^(?:Chapter|Unit|Module|Session|Part|Week|Lesson)\s*\d+[\s:\-\.]*', '', title, flags=re.IGNORECASE).strip()
                if not clean_title:
                    clean_title = title

                display_title = title if any(k in title.lower() for k in ["chapter", "session", "module", "unit", "lesson"]) else f"Chapter {ch_num}: {clean_title}"

                chapters.append({
                    "chapter_number": ch_num,
                    "chapter_title": display_title,
                    "page_start": page,
                    "page_end": total_pages,
                    "estimated_study_minutes": 180,
                    "topics": []
                })

            # Calculate chapter page boundaries
            for i in range(len(chapters)):
                if i + 1 < len(chapters):
                    chapters[i]["page_end"] = max(chapters[i]["page_start"], chapters[i+1]["page_start"] - 1)
                else:
                    chapters[i]["page_end"] = total_pages

                # Extract rich topics from within the chapter's page span
                extracted_topics = PDFProcessorService._extract_topics_from_page_span(
                    doc, chapters[i]["page_start"], chapters[i]["page_end"], chapters[i]["chapter_number"]
                )
                chapters[i]["topics"] = extracted_topics

        return PDFProcessorService._finalize_chapter_boundaries(chapters, total_pages)

    @staticmethod
    def _scan_printed_toc(doc: pymupdf.Document, total_pages: int) -> List[Dict[str, Any]]:
        """
        Searches for printed 'Table of Contents' / 'Contents' pages (first 35 pages or last 35 pages).
        Uses Groq LLM to parse into exact curriculum hierarchy if available, with deterministic fallback.
        """
        toc_page_indices = []
        
        # Check first 35 pages
        search_range = list(range(min(35, total_pages)))
        # Also check last 30 pages if document is large (e.g. merged textbooks where TOC was appended)
        if total_pages > 70:
            search_range.extend(range(max(35, total_pages - 30), total_pages))

        for p_idx in search_range:
            p_text = doc[p_idx].get_text("text").lower()
            lines = [l.strip() for l in p_text.splitlines() if l.strip()]
            if not lines:
                continue
            # Look for Contents keyword in top lines
            is_toc = any(re.match(r'^(table of contents|contents)\b', l) for l in lines[:5])
            if is_toc:
                toc_page_indices.append(p_idx)
                # Check if subsequent 1-3 pages are also part of TOC
                for next_p in range(p_idx + 1, min(total_pages, p_idx + 5)):
                    next_text = doc[next_p].get_text("text")
                    # If page contains chapter/section numbers followed by page numbers
                    if re.search(r'\b\d{1,2}\.\s+[A-Za-z]', next_text) or re.search(r'\b\d{1,2}\s+[A-Za-z]', next_text):
                        toc_page_indices.append(next_p)
                    else:
                        break
                break

        if not toc_page_indices:
            return []

        # Extract combined TOC text
        combined_toc_text = "\n".join(doc[p].get_text("text") for p in toc_page_indices)
        if len(combined_toc_text.strip()) < 50:
            return []

        # Attempt 1: Call Groq LLM for 100% accurate JSON parsing
        if settings.GROQ_API_KEY:
            try:
                llm_chapters = PDFProcessorService._call_llm_toc_parser(combined_toc_text, total_pages)
                if llm_chapters and len(llm_chapters) >= 2:
                    return PDFProcessorService._finalize_chapter_boundaries(llm_chapters, total_pages)
            except Exception as e:
                logger.warning(f"Groq LLM TOC parsing failed: {e}")

        # Attempt 2: Deterministic regex parser on multi-line TOC
        return PDFProcessorService._parse_printed_toc_regex(combined_toc_text, total_pages)

    @staticmethod
    def _call_llm_toc_parser(toc_text: str, total_pages: int) -> List[Dict[str, Any]]:
        """Invokes Groq LLM to convert raw TOC text into exact chapter/topic JSON structure."""
        prompt = f"""You are an elite textbook curriculum analyzer.
Extract all Chapters and their Topics and starting page numbers from this printed Table of Contents into a valid JSON object matching this schema:
{{
  "chapters": [
    {{
      "chapter_number": 1,
      "chapter_title": "Sets",
      "page_start": 1,
      "topics": [
        {{
          "topic_id": "1.1",
          "title": "Introduction",
          "page_start": 1,
          "subtopics": []
        }}
      ]
    }}
  ]
}}

Rules:
1. Extract ALL valid academic chapters and topics.
2. Filter out non-academic entries (Foreword, Rationalisation, Preface, Answers, Solutions, Appendix).
3. Ensure page_start is a valid integer.
4. Return ONLY the raw JSON object, no markdown codeblocks, no explanations.

Table of Contents Text:
{toc_text[:6000]}"""

        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
            "max_tokens": 4000
        }

        with httpx.Client(timeout=25.0) as client:
            resp = client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                raw_chapters = parsed.get("chapters", [])
                
                valid_chapters = []
                for ch in raw_chapters:
                    raw_p = int(ch.get("page_start", 1))
                    # If any chapter has a page number higher than total_pages, the printed TOC
                    # is referencing external physical book page numbers that don't match this PDF file
                    if raw_p > total_pages:
                        logger.info(f"Printed TOC has page_start {raw_p} > {total_pages}; falling back to visual scan")
                        return []
                    
                    p_start = max(1, min(total_pages, raw_p))
                    ch_num = int(ch.get("chapter_number", len(valid_chapters) + 1))
                    ch_title = clean_text(ch.get("chapter_title", f"Chapter {ch_num}"))
                    
                    topics = []
                    for top in ch.get("topics", []):
                        raw_top_p = int(top.get("page_start", p_start))
                        top_p_start = max(p_start, min(total_pages, raw_top_p))
                        topics.append({
                            "topic_id": str(top.get("topic_id", f"{ch_num}.{len(topics)+1}")),
                            "title": clean_text(top.get("title", f"Topic {len(topics)+1}")),
                            "page_start": top_p_start,
                            "page_end": total_pages,
                            "subtopics": [clean_text(s) for s in top.get("subtopics", []) if s],
                            "key_terms": [],
                            "estimated_minutes": 45
                        })

                    valid_chapters.append({
                        "chapter_number": ch_num,
                        "chapter_title": f"Chapter {ch_num}: {ch_title}" if not ch_title.lower().startswith("chapter") else ch_title,
                        "page_start": p_start,
                        "page_end": total_pages,
                        "estimated_study_minutes": 180,
                        "topics": topics
                    })

                return valid_chapters
        return []

    @staticmethod
    def _parse_printed_toc_regex(text: str, total_pages: int) -> List[Dict[str, Any]]:
        """Deterministic regex parser for printed TOC lines."""
        lines = [clean_text(l) for l in text.splitlines() if clean_text(l)]
        chapters = []
        current_chapter = None
        current_topic = None

        ch_num_dot = re.compile(r'^(\d{1,2})\.\s+([A-Za-z].*?)(?:\s+(\d+))?$')
        topic_num = re.compile(r'^(\d{1,2}\.\d{1,2})\s+([A-Za-z].*?)(?:\s+(\d+))?$')

        for i, l in enumerate(lines):
            # Check chapter
            m_ch = ch_num_dot.match(l)
            m_top = topic_num.match(l)

            if m_ch and not m_top:
                ch_num = int(m_ch.group(1))
                title = m_ch.group(2).strip()
                p_num = int(m_ch.group(3)) if m_ch.group(3) else None
                
                # If page number is on next line
                if not p_num and i + 1 < len(lines) and lines[i+1].isdigit():
                    p_num = int(lines[i+1])

                if not p_num:
                    p_num = (ch_num - 1) * max(15, total_pages // 10) + 1

                if p_num > total_pages:
                    return []

                current_chapter = {
                    "chapter_number": ch_num,
                    "chapter_title": f"Chapter {ch_num}: {title}",
                    "page_start": p_num,
                    "page_end": total_pages,
                    "estimated_study_minutes": 180,
                    "topics": []
                }
                chapters.append(current_chapter)
                current_topic = None

            elif m_top and current_chapter:
                top_id = m_top.group(1)
                top_title = m_top.group(2).strip()
                p_num = int(m_top.group(3)) if m_top.group(3) else None
                if not p_num and i + 1 < len(lines) and lines[i+1].isdigit():
                    p_num = int(lines[i+1])
                if not p_num:
                    p_num = current_chapter["page_start"]

                current_topic = {
                    "topic_id": top_id,
                    "title": top_title,
                    "page_start": min(total_pages, max(current_chapter["page_start"], p_num)),
                    "page_end": total_pages,
                    "subtopics": [],
                    "key_terms": [],
                    "estimated_minutes": 45
                }
                current_chapter["topics"].append(current_topic)

        if len(chapters) >= 2:
            return PDFProcessorService._finalize_chapter_boundaries(chapters, total_pages)
        return []

    @staticmethod
    def _heuristic_scan_full_document(doc: pymupdf.Document, total_pages: int) -> List[Dict[str, Any]]:
        """
        Scans all pages in the PDF for prominent chapter headings.
        Filters out running headers (top 8% of page) and running footers (bottom 7%).
        Recognizes word numbers (CHAPTER EIGHT, CHAPTER NINE, etc.), roman numerals, and multi-line titles.
        """
        chapters = []
        seen_titles = set()

        ch_regex = re.compile(
            r'^(?:CHAPTER|UNIT|MODULE|SESSION|LESSON)\s+([0-9IVXLCDM]+|[A-Za-z]+)\b(.*)$',
            re.IGNORECASE
        )

        non_academic_sections = [
            'answers', 'solutions', 'appendix', 'index', 'references',
            'bibliography', 'model question paper', 'glossary', 'contents'
        ]

        for p_idx in range(total_pages):
            page = doc[p_idx]
            page_h = page.rect.height
            page_num = p_idx + 1

            lines = [clean_text(l) for l in page.get_text("text").splitlines() if clean_text(l)]
            if not lines:
                continue

            # Check if this page is in an appendix or answer section
            first_line_lower = lines[0].lower()
            if any(first_line_lower.startswith(k) for k in non_academic_sections):
                continue

            for i, line in enumerate(lines[:6]):
                m = ch_regex.match(line)
                if not m:
                    continue

                raw_num = m.group(1)
                parsed_num = parse_num_or_word(raw_num)
                rest_title = m.group(2).strip()

                # If rest_title is empty or next line has the real chapter title
                title_candidate = rest_title
                if (not title_candidate or len(title_candidate) < 3) and i + 1 < len(lines):
                    next_l = lines[i+1]
                    if not next_l.lower().startswith("page") and len(next_l) < 90:
                        # Ensure next line is not just a section number like "8.1"
                        if not re.match(r'^\d{1,2}\.\d{1,2}\b', next_l):
                            title_candidate = next_l

                if not title_candidate:
                    title_candidate = f"Unit {parsed_num or len(chapters)+1}"

                # Ignore if title is in non-academic section
                if any(k in title_candidate.lower() for k in non_academic_sections):
                    continue

                # Verify font size is not tiny running header
                blocks = page.get_text("dict")["blocks"]
                max_font_size = 0
                for b in blocks:
                    y0 = b["bbox"][1]
                    # Filter out running header at top of page
                    if y0 > 0.08 * page_h:
                        for bl in b.get("lines", []):
                            for s in bl.get("spans", []):
                                s_txt = s["text"].lower()
                                if m.group(0).lower() in s_txt or title_candidate.lower() in s_txt:
                                    max_font_size = max(max_font_size, s["size"])

                # Chapter headings in real textbooks have large fonts or explicit parsed numbers
                if max_font_size >= 12 or parsed_num is not None:
                    # In textbooks, chapter numbers must be strictly non-decreasing.
                    # If we encounter a number that repeats or drops (e.g. Chapter 8 on page 134 after Chapter 14),
                    # it is an answers or solutions section at the back of the book.
                    if parsed_num is not None and chapters:
                        if any(c["chapter_number"] == parsed_num for c in chapters) or parsed_num < chapters[-1]["chapter_number"]:
                            continue

                    normalized = re.sub(r'[^a-zA-Z0-9]', '', title_candidate.lower())
                    if normalized not in seen_titles:
                        seen_titles.add(normalized)
                        ch_num = parsed_num if parsed_num is not None else len(chapters) + 1
                        display_title = title_candidate if title_candidate.lower().startswith("chapter") else f"Chapter {ch_num}: {title_candidate}"

                        chapters.append({
                            "chapter_number": ch_num,
                            "chapter_title": display_title,
                            "page_start": page_num,
                            "page_end": total_pages,
                            "estimated_study_minutes": 180,
                            "topics": []
                        })
                        break

        if len(chapters) < 2:
            return []

        # Fix chapter page boundaries and extract internal topics
        for i in range(len(chapters)):
            if i + 1 < len(chapters):
                chapters[i]["page_end"] = max(chapters[i]["page_start"], chapters[i+1]["page_start"] - 1)
            else:
                chapters[i]["page_end"] = total_pages

            chapters[i]["topics"] = PDFProcessorService._extract_topics_from_page_span(
                doc, chapters[i]["page_start"], chapters[i]["page_end"], chapters[i]["chapter_number"]
            )
            chapters[i]["estimated_study_minutes"] = sum(t["estimated_minutes"] for t in chapters[i]["topics"])

        return chapters

    @staticmethod
    def _extract_topics_from_page_span(doc: pymupdf.Document, start_page: int, end_page: int, ch_num: int) -> List[Dict[str, Any]]:
        """
        Extracts structured topics and subtopics for a chapter spanning pages start_page to end_page (1-based).
        Handles:
        - Numbered sections: e.g. "8.1 Introduction", "8.2 Stress and Strain"
        - Two-line slide headings: e.g. "01" \n "What is Fine-Tuning?"
        - Bold subtopics and key concepts
        - Automatically groups exercise/problem sections
        """
        topics = []
        curr_topic = None
        prev_num = None

        sec_num_pattern = re.compile(r'^(\d{1,2}\.\d{1,2})\s+([A-Za-z].*)$')
        sub_num_pattern = re.compile(r'^(\d{1,2}\.\d{1,2}\.\d{1,2})\s+([A-Za-z].*)$')
        pure_num_pattern = re.compile(r'^0?(\d{1,2})$')

        ignore_terms = [
            'course handout', 'data science', 'module', 'session', 'chapter',
            'learning objectives', 'where to go next', 'try this live'
        ]

        metadata_banner = re.compile(r'(\d+\s*min|foundations|strategy|fundamentals|advanced)', re.IGNORECASE)

        for p_idx in range(start_page - 1, min(len(doc), end_page)):
            page = doc[p_idx]
            page_h = page.rect.height
            page_num = p_idx + 1

            blocks = page.get_text("dict")["blocks"]
            for b in blocks:
                if "lines" not in b:
                    continue
                y0 = b["bbox"][1]
                # Filter out running header (top 8%) and footer (bottom 7%)
                if y0 < 0.08 * page_h or y0 > 0.93 * page_h:
                    continue

                for line in b["lines"]:
                    spans = line["spans"]
                    line_text = clean_text(" ".join(s["text"].strip() for s in spans if s["text"].strip()))
                    if not line_text:
                        continue

                    max_size = max((s["size"] for s in spans), default=0)
                    is_bold = any(bool(s["flags"] & 2 or "bold" in s["font"].lower()) for s in spans)

                    # Two-line numbered slide pattern: Line 1 = "01", Line 2 = "What is Fine-Tuning?"
                    m_pure = pure_num_pattern.match(line_text)
                    if m_pure and (max_size >= 12 or is_bold):
                        prev_num = m_pure.group(1)
                        continue

                    if prev_num and (max_size >= 12 or is_bold) and len(line_text) > 3:
                        if not any(k in line_text.lower() for k in ignore_terms) and not metadata_banner.search(line_text):
                            top_id = f"{ch_num}.{len(topics) + 1}"
                            if curr_topic:
                                curr_topic["page_end"] = max(curr_topic["page_start"], page_num)
                            curr_topic = {
                                "topic_id": top_id,
                                "title": line_text,
                                "page_start": page_num,
                                "page_end": end_page,
                                "subtopics": [],
                                "key_terms": [],
                                "estimated_minutes": 45
                            }
                            topics.append(curr_topic)
                        prev_num = None
                        continue
                    else:
                        prev_num = None

                    # Section pattern (e.g. 8.1 Introduction)
                    m_sec = sec_num_pattern.match(line_text)
                    m_sub = sub_num_pattern.match(line_text)

                    if m_sub and curr_topic:
                        clean_sub = m_sub.group(2).strip()
                        if clean_sub not in curr_topic["subtopics"] and len(curr_topic["subtopics"]) < 6:
                            curr_topic["subtopics"].append(clean_sub)

                    elif m_sec:
                        sec_id = m_sec.group(1)
                        sec_title = m_sec.group(2).strip()

                        # Detect if this is an exercise/problem set (e.g. "8.10 A rigid bar of mass 15 kg...")
                        if re.search(r'\b(calculate|determine|find|compute|a\s+\d+|what\s+is)\b', sec_title.lower()) or len(sec_title) > 65:
                            # Group into an Exercises block instead of individual question
                            if not any("exercise" in t["title"].lower() for t in topics):
                                top_id = f"{ch_num}.{len(topics) + 1}"
                                if curr_topic:
                                    curr_topic["page_end"] = max(curr_topic["page_start"], page_num)
                                curr_topic = {
                                    "topic_id": top_id,
                                    "title": "Exercises & Practice Problems",
                                    "page_start": page_num,
                                    "page_end": end_page,
                                    "subtopics": ["Problem Sets", "Conceptual Questions"],
                                    "key_terms": [],
                                    "estimated_minutes": 60
                                }
                                topics.append(curr_topic)
                        else:
                            # Standard section title
                            if curr_topic:
                                curr_topic["page_end"] = max(curr_topic["page_start"], page_num)
                            curr_topic = {
                                "topic_id": sec_id,
                                "title": sec_title,
                                "page_start": page_num,
                                "page_end": end_page,
                                "subtopics": [],
                                "key_terms": [],
                                "estimated_minutes": 45
                            }
                            topics.append(curr_topic)

                    # Subtopic extraction from bold key terms (e.g. "Transfer Learning", "Speed to Market")
                    elif is_bold and 8.8 <= max_size <= 11.5 and curr_topic and 3 < len(line_text) < 60:
                        if not any(k in line_text.lower() for k in ignore_terms) and not any(k in line_text.lower() for k in ["figure", "table", "example", "page", "note"]):
                            clean_sub = re.sub(r'^(?:CONCEPT|CASE STUDY|PRO TIP|WARNING)\s*[\—\-–:]*\s*', '', line_text).strip()
                            if clean_sub and clean_sub not in curr_topic["subtopics"] and len(curr_topic["subtopics"]) < 6:
                                curr_topic["subtopics"].append(clean_sub)

        # Fallback if no sections detected in this page range
        if not topics:
            span = end_page - start_page + 1
            topic_count = max(2, min(5, span // 6 if span > 10 else 2))
            step = max(1, span // topic_count)
            for t in range(topic_count):
                p_s = start_page + (t * step)
                p_e = min(end_page, p_s + step - 1 if t < topic_count - 1 else end_page)
                topics.append({
                    "topic_id": f"{ch_num}.{t+1}",
                    "title": f"Part {t+1}: Key Foundations & Theory",
                    "page_start": p_s,
                    "page_end": p_e,
                    "subtopics": ["Key Principles", "Review & Applications"],
                    "key_terms": [],
                    "estimated_minutes": max(30, (p_e - p_s + 1) * 8)
                })

        # Finalize topic boundaries
        for i, t in enumerate(topics):
            if i + 1 < len(topics):
                t["page_end"] = min(end_page, max(t["page_start"], topics[i+1]["page_start"] - 1))
            else:
                t["page_end"] = end_page
            t["estimated_minutes"] = max(30, (t["page_end"] - t["page_start"] + 1) * 8)

        return topics

    @staticmethod
    def _finalize_chapter_boundaries(chapters: List[Dict[str, Any]], total_pages: int) -> List[Dict[str, Any]]:
        """Ensures all chapters have valid page boundaries and estimated study times."""
        for i, ch in enumerate(chapters):
            if i + 1 < len(chapters):
                ch["page_end"] = max(ch["page_start"], chapters[i+1]["page_start"] - 1)
            else:
                ch["page_end"] = total_pages

            if not ch.get("topics"):
                ch["topics"] = [{
                    "topic_id": f"{ch['chapter_number']}.1",
                    "title": f"Core Foundations of {ch['chapter_title'][:30]}",
                    "page_start": ch["page_start"],
                    "page_end": ch["page_end"],
                    "subtopics": ["Fundamental Concepts", "Review & Applications"],
                    "key_terms": [],
                    "estimated_minutes": 60
                }]
            else:
                for j, top in enumerate(ch["topics"]):
                    if j + 1 < len(ch["topics"]):
                        top["page_end"] = min(ch["page_end"], max(top["page_start"], ch["topics"][j+1]["page_start"] - 1))
                    else:
                        top["page_end"] = ch["page_end"]
                    top["estimated_minutes"] = max(30, (top["page_end"] - top["page_start"] + 1) * 8)

            ch["estimated_study_minutes"] = sum(t["estimated_minutes"] for t in ch["topics"])

        return chapters

    @staticmethod
    def _fallback_chunking(total_pages: int, subject_name: str) -> List[Dict[str, Any]]:
        """Intelligent fallback partitioning for documents without explicit chapter headings"""
        chapters = []
        chunk_size = max(15, min(35, total_pages // 6 if total_pages > 60 else max(10, total_pages // 3)))
        num_chapters = max(2, (total_pages + chunk_size - 1) // chunk_size)

        for i in range(num_chapters):
            start = i * chunk_size + 1
            end = min(total_pages, (i + 1) * chunk_size)
            if start > total_pages:
                break
            
            ch_num = i + 1
            topics = [
                {
                    "topic_id": f"{ch_num}.1",
                    "title": f"Part 1: Core Fundamentals & Principles",
                    "page_start": start,
                    "page_end": start + (end - start) // 2,
                    "subtopics": ["Definitions & Core Laws", "Mechanisms & Formulations"],
                    "key_terms": [],
                    "estimated_minutes": 60
                },
                {
                    "topic_id": f"{ch_num}.2",
                    "title": f"Part 2: Applications & Problem Sets",
                    "page_start": start + (end - start) // 2 + 1,
                    "page_end": end,
                    "subtopics": ["Practical Applications", "Practice Questions & Review"],
                    "key_terms": [],
                    "estimated_minutes": 60
                }
            ]
            chapters.append({
                "chapter_number": ch_num,
                "chapter_title": f"Chapter {ch_num}: {subject_name} — Unit {ch_num}",
                "page_start": start,
                "page_end": end,
                "estimated_study_minutes": 120,
                "topics": topics
            })

        return chapters

    @staticmethod
    def _build_summary_markdown(subject_name: str, chapters: List[Dict[str, Any]]) -> str:
        lines = [f"# {subject_name} — Syllabus & Coursework Index", ""]
        lines.append(f"Total Chapters: {len(chapters)}")
        lines.append("")
        for ch in chapters:
            lines.append(f"## {ch['chapter_title']} (Pages {ch['page_start']}–{ch['page_end']})")
            for top in ch.get("topics", []):
                sub_str = f" [Subtopics: {', '.join(top['subtopics'])}]" if top.get("subtopics") else ""
                lines.append(f"  - **{top['topic_id']} {top['title']}** (pp. {top['page_start']}–{top['page_end']}){sub_str}")
            lines.append("")
        return "\n".join(lines)
