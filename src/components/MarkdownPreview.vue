<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const props = defineProps<{
  content: string
}>()

// Configure markdown-it with syntax highlighting
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs code-block"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch {
        // ignore
      }
    }
    return `<pre class="hljs code-block"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

// Parse front matter if present
const parsedContent = computed(() => {
  let content = props.content
  // Remove front matter (---...---)
  const frontMatterMatch = content.match(/^---\n[\s\S]*?\n---\n?/)
  if (frontMatterMatch) {
    content = content.slice(frontMatterMatch[0].length)
  }
  return content.trim()
})

const frontMatter = computed(() => {
  const match = props.content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null
  const result: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':')
    if (key && rest.length > 0) {
      result[key.trim()] = rest.join(':').trim()
    }
  }
  return result
})

const renderedHtml = computed(() => {
  return md.render(parsedContent.value)
})
</script>

<template>
  <div class="markdown-preview">
    <!-- Front matter display -->
    <div v-if="frontMatter" class="front-matter">
      <div v-for="(value, key) in frontMatter" :key="key" class="fm-item">
        <span class="fm-key">{{ key }}</span>
        <span class="fm-value">{{ value }}</span>
      </div>
    </div>

    <!-- Rendered markdown -->
    <div class="markdown-body" v-html="renderedHtml" />
  </div>
</template>

<style>
.markdown-preview {
  padding: 16px 24px;
  font-size: 14px;
  line-height: 1.7;
  color: #cfd8dc;
  height: 100%;
  overflow-y: auto;
}

/* Front matter */
.front-matter {
  background: rgba(79, 195, 247, 0.08);
  border: 1px solid rgba(79, 195, 247, 0.2);
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
}

.fm-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.fm-key {
  color: #4fc3f7;
  font-weight: 600;
  font-size: 12px;
}

.fm-value {
  color: #b0bec5;
  font-size: 13px;
}

/* Markdown body styles */
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  color: #eceff1;
  margin-top: 24px;
  margin-bottom: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.markdown-body h1 { font-size: 1.8em; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
.markdown-body h2 { font-size: 1.5em; }
.markdown-body h3 { font-size: 1.25em; }
.markdown-body h4 { font-size: 1.1em; }

.markdown-body p {
  margin: 0 0 14px;
  color: #cfd8dc;
}

.markdown-body a {
  color: #4fc3f7;
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body code {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 0.9em;
  color: #81d4fa;
}

.markdown-body pre.code-block {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 14px;
  overflow-x: auto;
  margin: 12px 0;
}

.markdown-body pre.code-block code {
  background: none;
  padding: 0;
  color: #b0bec5;
  font-size: 13px;
  line-height: 1.5;
}

.markdown-body blockquote {
  border-left: 3px solid #4fc3f7;
  margin: 12px 0;
  padding: 8px 16px;
  background: rgba(79, 195, 247, 0.06);
  color: #90a4ae;
}

.markdown-body ul,
.markdown-body ol {
  margin: 12px 0;
  padding-left: 24px;
}

.markdown-body li {
  margin: 4px 0;
}

.markdown-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.markdown-body th,
.markdown-body td {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  text-align: left;
}

.markdown-body th {
  background: rgba(255, 255, 255, 0.05);
  color: #81d4fa;
  font-weight: 600;
}

.markdown-body tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.02);
}

.markdown-body hr {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 24px 0;
}

.markdown-body img {
  max-width: 100%;
  border-radius: 6px;
}

/* Highlight.js theme overrides */
.hljs {
  background: transparent !important;
}
</style>
