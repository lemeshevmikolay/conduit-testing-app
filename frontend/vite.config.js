import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const gitValue = (format) => {
  try {
    return execFileSync('git', ['log', '-1', `--format=${format}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

const commit = {
  subject: process.env.VITE_COMMIT_SUBJECT || gitValue('%s'),
  shortHash: process.env.VITE_COMMIT_SHA?.slice(0, 7) || gitValue('%h'),
  date: process.env.VITE_COMMIT_DATE || gitValue('%cI'),
}

export default defineConfig({
  define: {
    __CONDUIT_COMMIT__: JSON.stringify(commit),
  },
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001'
      }
    }
  }
})
