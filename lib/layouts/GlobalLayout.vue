<template>
  <div id="vuepress-theme-summer1874">
    <TheHeader />

    <TheMain />

    <TheFooter />
  </div>
</template>

<script>
import TheHeader from '../components/TheHeader.vue'
import TheMain from '../components/TheMain.vue'
import TheFooter from '../components/TheFooter.vue'

export default {
  name: 'Themesummer1874',

  components: {
    TheHeader,
    TheMain,
    TheFooter,
  },
}
</script>

<style lang="stylus" src="../styles/index.styl" />
