<script setup lang="ts">
// App.vue - Root component with router
</script>

<template>
  <n-app>
    <n-config-provider>
      <n-message-provider>
        <n-dialog-provider>
          <n-notification-provider>
            <n-insetch-provider>
              <router-view />
            </n-insetch-provider>
          </n-notification-provider>
        </n-dialog-provider>
      </n-message-provider>
    </n-config-provider>
  </n-app>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  background: #0f0f23;
  color: #e0e0e0;
}
</style>
