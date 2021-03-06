<template>
  <div>
    <div data-scrolled-to-top-trigger />
    <div
      class="chapter-column"
      :class="{ 'chapter-column--tall': highlightedEvent }"
    >
      <narrative-header
        :title="chapter.title"
        :cover="chapter.cover"
        :pages="pages"
        @scrollTo="smoothScroll"
      />
      <page-component
        data-page-component
        v-for="(page, index) in pages"
        :key="`${page.slug}-${index}`"
        :page="page"
        :id="page.slug"
        :ref="page.slug"
        :class="['chapter__page', `chapter__page--${index}`]"
      />
      <narrative-footer
        :previous-link="chapter.previousChapter"
        :next-link="chapter.nextChapter"
        :related="chapter.related"
      />
    </div>
  </div>
</template>

<script>
import seoHead from '~/lib/seo-head';
import { mapState } from 'vuex';
import NarrativeFooter from '~/components/narrative-footer/NarrativeFooter';
import NarrativeHeader from '~/components/narrative-header/NarrativeHeader';
import PageComponent from '~/components/page-component/PageComponent';
import loadData from '~/lib/load-data';

export default {
  layout: 'globe',
  middleware ({ store }) {
    store.commit('enableGlobePositionRight');
  },
  async asyncData (context) {
    const { pages, seo, path, slug, title, previousChapter, nextChapter, cover, related } = await loadData(context, context.params);
    const chapter = { seo, path, slug, title, previousChapter, nextChapter, cover, related };
    return {
      seo,
      chapter,
      pages,
      path,
      slug,
      title,
    };
  },
  head() {
    return seoHead(this.seo, this.$route.path);
  },
  data () {
    return {
      activePage: null,
      headerCondensed: false,
    };
  },
  computed: {
    ...mapState(['highlightedEvent']),
  },
  mounted () {
    this.$store.commit('setMarkerTypes', [this.chapter.slug]);
    this.$store.commit('enableGlobePositionRight');
    this.$store.commit('disableInteraction');
    this.$store.commit('disableGlobeAutoRotation');
    const pageSlug = this.$route.hash.replace(/^#/, '');
    this.updateActivePage(pageSlug);
    if (
      'IntersectionObserver' in window &&
      'IntersectionObserverEntry' in window &&
      'intersectionRatio' in window.IntersectionObserverEntry.prototype
    ) {
      this.observeIntersectingChildren();
      this.observeScrolledToTop();
    }
  },
  components: {
    NarrativeFooter,
    NarrativeHeader,
    PageComponent,
  },
  methods: {
    observeIntersectingChildren () {
      const trackVisibility = (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pageSlug = entry.target.id;
            this.updateActivePage(pageSlug);
          }
        });
      };
      const observer = new IntersectionObserver(trackVisibility, {
        // No explicit root, we want the viewport
        rootMargin: '-70% 0% -20% 0%',
        thresholds: 0,
      });
      const pageComponentsArray = [].slice.call(this.$el.querySelectorAll('[data-page-component]'));
      pageComponentsArray.forEach(el => observer.observe(el));
    },
    observeScrolledToTop () {
      const trackVisibility = (entries) => {
        entries.forEach(entry => {
          this.headerCondensed = !entry.isIntersecting;
        });
      };
      const observer = new IntersectionObserver(trackVisibility, {
        // No explicit root, we want the viewport
        rootMargin: '0% 0% 0% 0%',
        thresholds: 0,
      });
      const triggerElement = this.$el.querySelector('[data-scrolled-to-top-trigger]');
      observer.observe(triggerElement);
    },
    scrollToSlug (pageSlug) {
      const activeElement = document.getElementById(pageSlug);
      if (activeElement) {
        activeElement.scrollIntoView();
      }
    },
    smoothScroll (slug) {
      const element = this.$refs[slug][0].$el;
      const domRect = element.getBoundingClientRect();
      window.scrollBy({ top: domRect.y - 160, behavior: 'smooth' });
    },
    updateActivePage (pageSlug) {
      const activePages = (pageSlug) ? this.pages.filter(page => page.slug === pageSlug) : null;
      this.activePage = (activePages && activePages[0]) ? activePages[0] : this.pages[0];
    },
  },
  watch: {
    '$route' (to, from) {
      if ((to.path === from.path) && (to.hash !== from.hash)) {
        this.scrollToSlug(to.hash.replace(/^#/, ''));
      }
    },
    activePage (activePage) {
      const path = this.$route.path.replace(/^\/\//, '/'); // remove leading slash to maintain router base
      history.replaceState({}, 'page', `${path}#${this.activePage.slug}`);
      this.$store.commit('activateFeature', activePage);
    },
  },
};
</script>

<style>
.chapter-column {
  margin-top: calc(-1 * var(--globe-spacing-default));
  padding-top: var(--main-menu-height);
  z-index: 0;
  width: 100vw;
  background-color: var(--black-primary);
  overflow: hidden;
}

.chapter-column--tall {
  margin-top: calc(-1 * var(--globe-spacing-tall));
}

@media (--vertical-viewport) {
  .chapter-column {
    padding-top: var(--main-menu-height--tall);
    margin-top: calc(-1 * var(--globe-spacing-default--desktop));
  }

  .chapter-column--tall {
    margin-top: calc(-1 * var(--globe-spacing-tall--desktop));
  }
}

@media (--lg-viewport) {
  .chapter-column {
    width: 45rem;
  }
}

.chapter__page {
  z-index: 1;
}

[data-scrolled-to-top-trigger] {
  display: block;
  position: absolute;
  top: 10.25rem;
  right: 0;
  width: 1px;
  height: 1px;
  background-color: transparent;
  z-index: 1;
}

@media (--md-viewport) {
  [data-scrolled-to-top-trigger] {
    top: calc(12.5rem + 1px);
  }
}

/*
* style rules for a minimal print layout
*/

@media print {
  .chapter-column {
    position: relative;
    padding: 0;
    background-color: var(--white);
  }
}
</style>
