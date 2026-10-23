# Maintaining the blog

The blog is static HTML. Articles remain readable without JavaScript and use the same header, footer, typeface, and colors as the rest of the site.

## Add an article

1. Copy an existing file in `content/blog/` to a new `.json` file.
2. Give it a unique lowercase, hyphenated `slug`, a title, description, category, and actual publication date (`YYYY-MM-DD`). Add the introduction and sections. Section bodies are trusted editorial HTML; use ordinary paragraphs, links, and semantic lists or tables where useful.
3. Set a relevant `service` URL, `service_label`, `cta_title`, and `cta_text`.
4. Run `python scripts/build-blog.py` from the repository root.
5. Preview the article and blog index, check the links and mobile layout, and commit the source JSON and generated files together.

The builder generates the index, article pages, RSS feed, reading-time estimates, canonical/social metadata, BlogPosting and breadcrumb structured data, related-article links, and blog sitemap entries. It also keeps Blog links in the eight main site pages' navigation and footers.

## Update an article

Edit its JSON source and rebuild. Keep the original `published` date. Add or change `modified` only for a substantive content update; that date appears on the article and in its structured data and sitemap. Keep an existing slug stable unless a redirect is planned.

Yuvathy Technologies is the credited organisation. Use accurate company information, original examples clearly labelled as examples, and links to primary sources for external factual claims. Add client work or individual author credentials only when they are real and approved for use.

The body HTML is maintained by the site owner, not accepted from public visitors. No CMS, sign-in, comment service, or new runtime dependency is required.
