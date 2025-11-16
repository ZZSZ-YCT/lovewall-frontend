<script setup lang="ts">
import Terminal from '~/components/terminal/Terminal.vue'
import CaptchaGate from "~/components/terminal/CaptchaGate.vue";
import PopupPortal from "~/components/terminal/PopupPortal.vue";

import {registerBasicCommands} from "~/composables/terminal/commands/basicCommand";
import {registerAuthCommands} from "~/composables/terminal/commands/authCommand";
import {registerUserCommands} from "~/composables/terminal/commands/userCommand";
import {registerPostCommands} from "~/composables/terminal/commands/postCommand";

definePageMeta({
  layout: 'empty',
})

useHead({
  title: 'Lsh (Lovewall Shell)',
})

registerBasicCommands()
registerAuthCommands()
registerUserCommands()
registerPostCommands()

</script>

<template>
  <main class="min-h-screen bg-neutral-900 text-neutral-100 p-6">
    <h1 class="text-xl font-semibold mb-4"></h1>
    <Terminal placeholder='Type "help" to begin…' />
    <CaptchaGate />
    <PopupPortal />
    <CaptchaDialog />
  </main>
</template>
