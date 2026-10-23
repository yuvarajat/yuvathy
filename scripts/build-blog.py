#!/usr/bin/env python3
"""Build the static blog from trusted, locally maintained content/blog/*.json files."""

from datetime import date, datetime, time, timedelta, timezone
from email.utils import format_datetime
from html import escape, unescape
from pathlib import Path
import json
import math
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://yuvathy.in'
BLOG = BASE + '/blog/'
DATE_LABEL = lambda value: f'{date.fromisoformat(value).day} {date.fromisoformat(value):%B %Y}'
ARROW = '<span class="arrow" aria-hidden="true">↗</span>'


def write_if_changed(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists() or path.read_text(encoding='utf-8') != text:
        path.write_text(text, encoding='utf-8')


def load_posts():
    posts = []
    for path in sorted((ROOT / 'content/blog').glob('*.json')):
        post = json.loads(path.read_text(encoding='utf-8'))
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', post['slug']):
            raise ValueError(f'Invalid slug in {path}')
        date.fromisoformat(post['published'])
        date.fromisoformat(post.get('modified', post['published']))
        section_ids = [section['id'] for section in post['sections']]
        if len(section_ids) != len(set(section_ids)):
            raise ValueError(f'Duplicate section IDs in {path}')
        post['url'] = BLOG + post['slug'] + '/'
        text = post['intro'] + ' ' + ' '.join(section['body'] for section in post['sections'])
        post['words'] = len(re.findall(r'\b\w+(?:[’-]\w+)*\b', unescape(re.sub(r'<[^>]+>', ' ', text))))
        post['minutes'] = max(1, math.ceil(post['words'] / 200))
        posts.append(post)
    if len({post['slug'] for post in posts}) != len(posts):
        raise ValueError('Duplicate article slugs')
    if not posts:
        raise ValueError('The blog needs at least one article')
    return sorted(posts, key=lambda post: post['published'], reverse=True)


def breadcrumb(items):
    return {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': index, 'name': name, 'item': url}
        for index, (name, url) in enumerate(items, 1)
    ]}


def head(preamble, title, description, url, schema, article=False):
    e = escape
    return preamble + f'''    <title>{e(title)}</title>
    <meta name="description" content="{e(description, quote=True)}">
    <meta name="author" content="Yuvathy Technologies">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="{url}">
    <meta name="theme-color" content="#030303">
    <link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png">
    <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="alternate" type="application/rss+xml" title="Yuvathy Technologies Blog" href="/blog/feed.xml">
    <meta property="og:type" content="{'article' if article else 'website'}">
    <meta property="og:site_name" content="Yuvathy Technologies">
    <meta property="og:locale" content="en_IN">
    <meta property="og:url" content="{url}">
    <meta property="og:title" content="{e(title, quote=True)}">
    <meta property="og:description" content="{e(description, quote=True)}">
    <meta property="og:image" content="{BASE}/assets/og.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Yuvathy Technologies">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{e(title, quote=True)}">
    <meta name="twitter:description" content="{e(description, quote=True)}">
    <meta name="twitter:image" content="{BASE}/assets/og.png">
    <meta name="twitter:image:alt" content="Yuvathy Technologies">
    <script type="application/ld+json">
{json.dumps({'@context': 'https://schema.org', '@graph': schema}, ensure_ascii=False, indent=4)}
    </script>
    <link rel="preload" href="/assets/fonts/plus-jakarta-sans-latin-variable.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/css/site.css">
    <link rel="stylesheet" href="/css/pages.css">
</head>
'''


def sync_blog_links(source, is_blog=False, is_index=False):
    marker = ' aria-current="page"' if is_index else (' aria-current="true"' if is_blog else '')

    def navigation(match):
        body = re.sub(r'\s*<a href="/blog/"[^>]*>Blog</a>', '', match.group(2))
        indent = '                ' if 'desktop-nav' in match.group(1) else '        '
        body = re.sub(r'[ \t]*<a href="/careers/"', lambda _: f'{indent}<a href="/blog/"{marker}>Blog</a>\n{indent}<a href="/careers/"', body, count=1)
        return match.group(1) + body + match.group(3)

    source = re.sub(r'(<nav class="(?:desktop-nav|mobile-menu)"[^>]*>)(.*?)(</nav>)', navigation, source, flags=re.S)
    position = source.index('<footer class="site-footer">')
    footer = re.sub(r'<a href="/blog/"[^>]*>Blog</a>', '', source[position:])
    footer = footer.replace('<a href="/careers/"', f'<a href="/blog/"{marker}>Blog</a><a href="/careers/"', 1)
    return source[:position] + footer


def build():
    posts = load_posts()
    reference = (ROOT / 'services/website-development/index.html').read_text(encoding='utf-8')
    preamble = reference.split('    <title>')[0]
    navigation = reference[reference.index('    <a href="#main"'):reference.index('    <main id="main">')].replace(' aria-current="page"', '')
    footer = reference[reference.index('    <footer class="site-footer">'):]
    organization = {'@type': 'Organization', '@id': BASE + '/#organization', 'name': 'Yuvathy Technologies', 'url': BASE + '/#about'}

    entries = []
    for post in posts:
        entries.append(f'''                <article>
                    <a class="blog-entry" href="/blog/{post['slug']}/" aria-labelledby="title-{post['slug']}">
                        <div class="blog-entry-meta"><span>{escape(post['category'])}</span><time datetime="{post['published']}">{DATE_LABEL(post['published'])}</time><span>{post['minutes']} min read</span></div>
                        <div class="blog-entry-copy"><h2 id="title-{post['slug']}">{escape(post['title'])}</h2><p>{escape(post['intro'])}</p></div>
                        {ARROW}
                    </a>
                </article>''')
    blog_schema = [
        {'@type': 'Blog', '@id': BLOG + '#blog', 'name': 'Yuvathy Technologies Blog', 'url': BLOG,
         'description': 'Practical guides to websites, software, and everyday business workflows.', 'publisher': organization,
         'blogPost': [{'@type': 'BlogPosting', '@id': post['url'] + '#article', 'headline': post['title'], 'url': post['url']} for post in posts]},
        breadcrumb([('Home', BASE + '/'), ('Blog', BLOG)])
    ]
    index_main = '''    <main id="main" class="blog-main">
        <div class="container">
            <header class="blog-intro"><span class="eyebrow">The Yuvathy blog</span><h1>Practical guides.<br><em>Less guesswork.</em></h1><p>Notes on websites, software, and keeping everyday work organised.</p></header>
            <section class="blog-entries" aria-labelledby="articles-title"><div class="blog-list-heading"><h2 id="articles-title">Latest articles</h2><a class="quiet-link" href="/blog/feed.xml">RSS feed <span aria-hidden="true">↗</span></a></div>
''' + '\n'.join(entries) + '''
            </section>
        </div>
    </main>
'''
    index = head(preamble, 'Blog | Practical Business Guides | Yuvathy Technologies', 'Practical guides from Yuvathy on business websites, custom software, property enquiries, and making everyday work simpler.', BLOG, blog_schema)
    index += '<body class="blog-page">\n' + navigation + index_main + footer
    write_if_changed(ROOT / 'blog/index.html', sync_blog_links(index, True, True))

    for post in posts:
        schema = [
            {'@type': 'BlogPosting', '@id': post['url'] + '#article', 'url': post['url'],
             'mainEntityOfPage': {'@type': 'WebPage', '@id': post['url']}, 'headline': post['title'],
             'description': post['description'], 'datePublished': post['published'],
             'dateModified': post.get('modified', post['published']), 'author': organization, 'publisher': organization,
             'articleSection': post['category'], 'wordCount': post['words'], 'inLanguage': 'en-IN', 'isPartOf': {'@id': BLOG + '#blog'}},
            breadcrumb([('Home', BASE + '/'), ('Blog', BLOG), (post['title'], post['url'])])
        ]
        sections = '\n'.join(f'''                <section id="{escape(section['id'], quote=True)}"><h2>{escape(section['heading'])}</h2>{section['body']}</section>''' for section in post['sections'])
        related = '\n'.join(f'''                    <a class="article-related-link" href="/blog/{other['slug']}/"><span>{escape(other['title'])}</span>{ARROW}</a>''' for other in posts if other['slug'] != post['slug'])
        modified = f'''<span>Updated <time datetime="{post['modified']}">{DATE_LABEL(post['modified'])}</time></span>''' if post.get('modified', post['published']) != post['published'] else ''
        main = f'''    <main id="main" class="article-main">
        <article class="container article-width" aria-labelledby="article-title">
            <header class="article-header">
                <nav class="service-breadcrumb" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/blog/">Blog</a></li><li aria-current="page">{escape(post['category'])}</li></ol></nav>
                <span class="eyebrow">{escape(post['category'])}</span><h1 id="article-title">{escape(post['title'])}</h1>
                <p class="article-intro">{escape(post['intro'])}</p>
                <div class="article-meta"><a href="/#about" rel="author">Yuvathy Technologies</a><time datetime="{post['published']}">{DATE_LABEL(post['published'])}</time><span title="Estimated reading time">{post['minutes']} min read</span>{modified}</div>
            </header>
            <div class="article-content">
{sections}
            </div>
            <footer class="article-cta"><h2>{escape(post['cta_title'])}</h2><p>{escape(post['cta_text'])}</p><a class="text-link" href="{escape(post['service'], quote=True)}">{escape(post['service_label'])} {ARROW}</a></footer>
        </article>
        <section class="container article-width article-related" aria-labelledby="related-title"><h2 id="related-title">Keep reading</h2>
{related}
            <a class="quiet-link article-back" href="/blog/">Back to all articles <span aria-hidden="true">↗</span></a>
        </section>
    </main>
'''
        article = head(preamble, post['title'] + ' | Yuvathy', post['description'], post['url'], schema, True)
        article += '<body class="blog-page article-page">\n' + navigation + main + footer
        write_if_changed(ROOT / 'blog' / post['slug'] / 'index.html', sync_blog_links(article, True))

    existing_pages = ['index.html', 'privacy.html', 'terms.html', 'cookies.html', 'careers/index.html',
                      'services/accounting-compliance/index.html', 'services/website-development/index.html', 'services/custom-software-development/index.html']
    for name in existing_pages:
        path = ROOT / name
        write_if_changed(path, sync_blog_links(path.read_text(encoding='utf-8')))

    atom = 'http://www.w3.org/2005/Atom'
    ET.register_namespace('atom', atom)
    rss = ET.Element('rss', version='2.0')
    channel = ET.SubElement(rss, 'channel')
    for key, value in [('title', 'Yuvathy Technologies Blog'), ('link', BLOG), ('description', 'Practical guides to websites, software, and everyday business workflows.'), ('language', 'en-IN')]:
        ET.SubElement(channel, key).text = value
    ET.SubElement(channel, '{' + atom + '}link', href=BLOG + 'feed.xml', rel='self', type='application/rss+xml')
    for post in posts:
        item = ET.SubElement(channel, 'item')
        for key, value in [('title', post['title']), ('link', post['url']), ('description', post['description'])]:
            ET.SubElement(item, key).text = value
        ET.SubElement(item, 'guid', isPermaLink='true').text = post['url']
        published = datetime.combine(date.fromisoformat(post['published']), time(), timezone(timedelta(hours=5, minutes=30)))
        ET.SubElement(item, 'pubDate').text = format_datetime(published)
    ET.indent(rss, space='  ')
    write_if_changed(ROOT / 'blog/feed.xml', '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(rss, encoding='unicode') + '\n')

    namespace = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    ET.register_namespace('', namespace)
    sitemap_path = ROOT / 'sitemap.xml'
    sitemap = ET.fromstring(sitemap_path.read_text(encoding='utf-8'))
    for element in list(sitemap):
        if element.findtext('{' + namespace + '}loc', '').startswith(BLOG):
            sitemap.remove(element)
    dates = [post.get('modified', post['published']) for post in posts]
    for url, changed in [(BLOG, max(dates))] + [(post['url'], post.get('modified', post['published'])) for post in posts]:
        element = ET.SubElement(sitemap, '{' + namespace + '}url')
        ET.SubElement(element, '{' + namespace + '}loc').text = url
        ET.SubElement(element, '{' + namespace + '}lastmod').text = changed
    ET.indent(sitemap, space='  ')
    write_if_changed(sitemap_path, '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(sitemap, encoding='unicode') + '\n')
    print(f'Built blog index, {len(posts)} articles, RSS feed, navigation links, and sitemap.')
    for post in posts:
        print(f"  {post['slug']}: {post['words']} words, {post['minutes']} min read")


if __name__ == '__main__':
    build()
