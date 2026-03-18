<script lang="ts">
  import { fade } from "svelte/transition";

  const visible = true;
</script>

{#if visible}
  <div transition:fade>Hi</div>
{/if}
