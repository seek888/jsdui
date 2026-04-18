<script setup lang="ts">
import { computed } from 'vue'
import { NTree, NIcon, NSpin } from 'naive-ui'
import type { TreeOption } from 'naive-ui'
import { useFileTreeStore, type TreeNode } from '@/stores/fileTree'

const fileTreeStore = useFileTreeStore()

// Convert store tree to NTree format
function nodeToOption(node: TreeNode, parentPath: string = ''): TreeOption {
  const isDir = node.isDirectory
  const isExpanded = fileTreeStore.isExpanded(node.path)
  return {
    key: node.path,
    label: node.name,
    isLeaf: !isDir,
    prefix: () => getIcon(node),
    children: node.children ? node.children.map((n) => nodeToOption(n, node.path)) : undefined
  }
}

const treeOptions = computed<TreeOption[]>(() => {
  return fileTreeStore.tree.map((n) => nodeToOption(n))
})

function getIcon(node: TreeNode): string {
  if (node.isDirectory) {
    return fileTreeStore.isExpanded(node.path) ? '📂' : '📁'
  }
  return '📄'
}

function handleSelect(keys: string[]) {
  if (keys.length > 0) {
    const path = keys[0] as string
    // Find if it's a file (not directory)
    const findNode = (nodes: TreeNode[], target: string): TreeNode | null => {
      for (const n of nodes) {
        if (n.path === target) return n
        if (n.children) {
          const found = findNode(n.children, target)
          if (found) return found
        }
      }
      return null
    }
    const node = findNode(fileTreeStore.tree, path)
    if (node && !node.isDirectory) {
      fileTreeStore.selectFile(path)
    }
  }
}

function handleExpand(keys: string[]) {
  for (const path of keys) {
    const findNode = (nodes: TreeNode[], target: string): TreeNode | null => {
      for (const n of nodes) {
        if (n.path === target) return n
        if (n.children) {
          const found = findNode(n.children, target)
          if (found) return found
        }
      }
      return null
    }
    const node = findNode(fileTreeStore.tree, path as string)
    if (node && node.isDirectory) {
      if (!fileTreeStore.isExpanded(path as string)) {
        fileTreeStore.toggleExpand(node)
      }
    }
  }
}
</script>

<template>
  <div class="file-tree">
    <div class="file-tree-header">
      <span class="file-tree-title">📂 文件树</span>
      <button class="refresh-btn" @click="fileTreeStore.refresh" title="刷新">🔄</button>
    </div>

    <NSpin :show="fileTreeStore.isLoading">
      <NTree
        v-if="treeOptions.length > 0"
        :data="treeOptions"
        :selected-keys="fileTreeStore.selectedPath ? [fileTreeStore.selectedPath] : []"
        :expanded-keys="Array.from(fileTreeStore.expandedPaths)"
        block-line
        expand-on-click
        select-on-click
        virtual-scroll
        @update:selected-keys="handleSelect"
        @update:expanded-keys="handleExpand"
        class="tree-content"
      />
      <div v-else class="empty-tree">
        <span>暂无文件</span>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.file-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.15);
  min-width: 220px;
  max-width: 280px;
}

.file-tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.file-tree-title {
  font-size: 13px;
  font-weight: 600;
  color: #b0bec5;
}

.refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tree-content {
  flex: 1;
  overflow: auto;
  font-size: 13px;
}

.empty-tree {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #607d8b;
  font-size: 13px;
}
</style>
