import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface TreeNode {
  name: string
  path: string
  isDirectory: boolean
  size: number
  mtime: number
  children?: TreeNode[]
}

export const useFileTreeStore = defineStore('fileTree', () => {
  const rootPath = ref<string | null>(null)
  const tree = ref<TreeNode[]>([])
  const expandedPaths = ref<Set<string>>(new Set())
  const selectedPath = ref<string | null>(null)
  const isLoading = ref(false)

  const hasTree = computed(() => tree.value.length > 0)

  async function loadDir(dirPath: string): Promise<TreeNode[]> {
    const result = await window.electronAPI.readDir(dirPath)
    if (!result.success || !result.data) return []

    const nodes: TreeNode[] = []
    for (const file of result.data) {
      if (file.isDirectory) {
        // Only include .planning directory
        if (file.name === '.planning' || dirPath.includes('.planning')) {
          nodes.push({
            name: file.name,
            path: file.path,
            isDirectory: true,
            size: file.size,
            mtime: file.mtime,
            children: []
          })
        }
      } else if (file.name.endsWith('.md')) {
        nodes.push({
          name: file.name,
          path: file.path,
          isDirectory: false,
          size: file.size,
          mtime: file.mtime
        })
      }
    }

    // Sort: directories first, then files, alphabetically
    nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })

    return nodes
  }

  async function expandNode(node: TreeNode) {
    if (!node.isDirectory) return
    if (node.children && node.children.length > 0) return // already loaded

    const children = await loadDir(node.path)
    node.children = children
  }

  function toggleExpand(node: TreeNode) {
    if (expandedPaths.value.has(node.path)) {
      expandedPaths.value.delete(node.path)
    } else {
      expandedPaths.value.add(node.path)
      if (node.isDirectory && (!node.children || node.children.length === 0)) {
        expandNode(node)
      }
    }
    // Force reactivity
    expandedPaths.value = new Set(expandedPaths.value)
  }

  function isExpanded(path: string): boolean {
    return expandedPaths.value.has(path)
  }

  async function initTree(projectPath: string) {
    isLoading.value = true
    rootPath.value = projectPath

    // Build path to .planning directory
    const planningPath = `${projectPath}/.planning`

    // Check if .planning exists
    const exists = await window.electronAPI.exists(planningPath)
    if (!exists.success || !exists.data) {
      tree.value = []
      isLoading.value = false
      return
    }

    const nodes = await loadDir(planningPath)
    tree.value = nodes
    isLoading.value = false
  }

  function selectFile(path: string) {
    selectedPath.value = path
  }

  async function refresh() {
    if (!rootPath.value) return
    await initTree(rootPath.value)
  }

  function clear() {
    rootPath.value = null
    tree.value = []
    expandedPaths.value = new Set()
    selectedPath.value = null
  }

  return {
    rootPath,
    tree,
    expandedPaths,
    selectedPath,
    isLoading,
    hasTree,
    initTree,
    expandNode,
    toggleExpand,
    isExpanded,
    selectFile,
    refresh,
    clear
  }
})
