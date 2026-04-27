import { WORLD_LIMIT } from "../gameplayContent.js";
import {
  ALL_RECIPES,
  COOKING_RECIPES,
  CRAFTING_RECIPES,
  FEATURED_ARTICLE_ID,
  GUIDE_NAV,
  GUIDE_PAGE_BUNDLES,
  GUIDE_PLAYBOOKS,
  GUIDE_SECTIONS,
  SMALL_ISLAND_MAP_POINTS,
  TOOLKIT_ARTICLES,
  TOOLKIT_GUIDES,
} from "../winterBurrowData.js";
import {
  getArticleById,
  getGuideById,
  getRecipesForView,
  getTrackedRecipe,
  getVisibleRecipes,
  isRecipeView,
} from "./guidePanelModel.js";

const SCENE_LIMIT = WORLD_LIMIT;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatIngredientList(ingredients) {
  return ingredients.map((entry) => `${entry.amount} ${entry.name}`).join(", ");
}

function getCategoryList(recipes) {
  return [...new Set(recipes.map((recipe) => recipe.category))];
}

function normalizeMapPoint(point) {
  const x = ((point.position.x + SCENE_LIMIT) / (SCENE_LIMIT * 2)) * 100;
  const y = ((SCENE_LIMIT - point.position.z) / (SCENE_LIMIT * 2)) * 100;
  return {
    ...point,
    screenX: Math.max(6, Math.min(94, x)),
    screenY: Math.max(6, Math.min(94, y)),
  };
}

function renderPill(label, value) {
  return `
    <div class="guide-kpi">
      <span class="guide-kpi__label">${escapeHtml(label)}</span>
      <strong class="guide-kpi__value">${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderEmptyState(title, copy) {
  return `
    <article class="empty-state">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(copy)}</p>
    </article>
  `;
}

function buildRecipeNarrative(recipe, meta) {
  const categoryBlurb = meta.categoryBlurb?.[recipe.category];

  if (recipe.section === "crafting") {
    const parts = [
      categoryBlurb ||
        `${recipe.category} blueprint with ${recipe.ingredients.length} ingredient${
          recipe.ingredients.length === 1 ? "" : "s"
        }.`,
    ];

    if (recipe.attack) {
      parts.push(`Attack output: ${recipe.attack}.`);
    }

    if (recipe.obtainedFrom) {
      parts.push(`Unlock source: ${recipe.obtainedFrom}.`);
    }

    return parts.join(" ");
  }

  const boostPreview = recipe.statBoosts.slice(0, 3).join(", ");
  return `${categoryBlurb || `${recipe.category} food route.`} Duration: ${recipe.duration}. Key boosts: ${boostPreview}.`;
}

function renderRecipeCard(recipe, selected) {
  const metaLabel = recipe.section === "crafting"
    ? recipe.attack
      ? `Attack ${recipe.attack}`
      : recipe.obtainedFrom || `${recipe.ingredients.length} ingredient${recipe.ingredients.length === 1 ? "" : "s"}`
    : recipe.duration;

  const chipValues = recipe.section === "crafting"
    ? [
        recipe.obtainedFrom,
        `${recipe.ingredients.length} ingredient${recipe.ingredients.length === 1 ? "" : "s"}`,
      ].filter(Boolean)
    : [...recipe.statBoosts.slice(0, 2), `${recipe.ingredients.length} ingredient${recipe.ingredients.length === 1 ? "" : "s"}`];

  return `
    <article class="recipe-card" data-selected="${selected ? "true" : "false"}">
      <button class="recipe-card__button" type="button" data-recipe-id="${escapeHtml(recipe.id)}">
        <div class="recipe-card__topline">
          <span class="recipe-card__category">${escapeHtml(recipe.category)}</span>
          <span class="recipe-card__meta">${escapeHtml(metaLabel)}</span>
        </div>
        <h3 class="recipe-card__title">${escapeHtml(recipe.name)}</h3>
        <p class="recipe-card__copy">${escapeHtml(formatIngredientList(recipe.ingredients))}</p>
        <div class="recipe-card__chips">
          ${chipValues.map((value) => `<span class="guide-pill">${escapeHtml(value)}</span>`).join("")}
        </div>
      </button>
    </article>
  `;
}

function renderRecipeDetail(recipe, meta, trackedRecipeId) {
  const keyFacts = recipe.section === "crafting"
    ? [
        { label: "Category", value: recipe.category },
        { label: "Attack", value: recipe.attack ? String(recipe.attack) : "None" },
        { label: "Obtained From", value: recipe.obtainedFrom || "Standard unlock" },
      ]
    : [
        { label: "Category", value: recipe.category },
        { label: "Duration", value: recipe.duration || "Instant" },
        { label: "Boost Count", value: String(recipe.statBoosts.length) },
      ];

  const detailTags = recipe.section === "crafting"
    ? [
        recipe.attack ? `Attack ${recipe.attack}` : null,
        recipe.obtainedFrom,
        `${recipe.ingredients.length} ingredient${recipe.ingredients.length === 1 ? "" : "s"}`,
      ].filter(Boolean)
    : [...recipe.statBoosts, recipe.duration].filter(Boolean);

  return `
    <div class="detail-stack">
      <section class="detail-hero">
        <div class="detail-eyebrow">${escapeHtml(meta.overline)}</div>
        <h3 class="detail-title">${escapeHtml(recipe.name)}</h3>
        <p class="detail-copy">${escapeHtml(buildRecipeNarrative(recipe, meta))}</p>
        <button
          class="detail-action"
          type="button"
          data-track-recipe="${escapeHtml(recipe.id)}"
          data-active="${trackedRecipeId === recipe.id ? "true" : "false"}"
        >
          ${trackedRecipeId === recipe.id ? "Remover do HUD" : "Rastrear no HUD"}
        </button>
      </section>
      <section class="detail-block">
        <div class="detail-block__title">Ingredients</div>
        <ul class="detail-list">
          ${recipe.ingredients
            .map(
              (entry) => `
                <li class="detail-list__row">
                  <span>${escapeHtml(entry.name)}</span>
                  <strong>x${escapeHtml(entry.amount)}</strong>
                </li>
              `
            )
            .join("")}
        </ul>
      </section>
      <section class="detail-block">
        <div class="detail-block__title">Key Facts</div>
        <ul class="detail-list">
          ${keyFacts
            .map(
              (fact) => `
                <li class="detail-list__row">
                  <span>${escapeHtml(fact.label)}</span>
                  <strong>${escapeHtml(fact.value)}</strong>
                </li>
              `
            )
            .join("")}
        </ul>
      </section>
      <section class="detail-block">
        <div class="detail-block__title">${recipe.section === "crafting" ? "Blueprint Notes" : "Stat Boosts"}</div>
        <div class="detail-tag-cloud">
          ${detailTags.map((tag) => `<span class="guide-pill">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderSectionCopy(meta) {
  return `
    <div class="detail-stack">
      <section class="detail-hero">
        <div class="detail-eyebrow">${escapeHtml(meta.overline)}</div>
        <h3 class="detail-title">${escapeHtml(meta.title)}</h3>
        <p class="detail-copy">${escapeHtml(meta.description)}</p>
      </section>
      ${
        meta.bullets?.length
          ? `
            <section class="detail-block">
              <div class="detail-block__title">Field Notes</div>
              <ul class="detail-copy-list">
                ${meta.bullets.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
              </ul>
            </section>
          `
          : ""
      }
      ${
        meta.whyItMatters?.length
          ? `
            <section class="detail-block">
              <div class="detail-block__title">Why It Matters</div>
              <ul class="detail-copy-list">
                ${meta.whyItMatters.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
              </ul>
            </section>
          `
          : ""
      }
      ${
        meta.tips?.length
          ? `
            <section class="detail-block">
              <div class="detail-block__title">Strategy & Tips</div>
              <ul class="detail-copy-list">
                ${meta.tips.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
              </ul>
            </section>
          `
          : ""
      }
      ${
        meta.faq?.length
          ? `
            <section class="detail-block">
              <div class="detail-block__title">FAQ</div>
              <div class="detail-faq">
                ${meta.faq
                  .map(
                    (item) => `
                      <article class="detail-faq__item">
                        <strong>${escapeHtml(item.question)}</strong>
                        <p>${escapeHtml(item.answer)}</p>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
          : ""
      }
    </div>
  `;
}

function renderToolkitActionButtons(actions) {
  if (!actions?.length) {
    return "";
  }

  return `
    <div class="article-action-row">
      ${actions
        .map(
          (action) => `
            <button
              class="guide-jump"
              type="button"
              data-toolkit-action-type="${escapeHtml(action.type)}"
              data-toolkit-action-target="${escapeHtml(action.targetId)}"
            >
              ${escapeHtml(action.label)}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderGuideCard(guide, selected) {
  return `
    <article class="toolkit-card" data-selected="${selected ? "true" : "false"}">
      <button class="toolkit-card__button" type="button" data-toolkit-guide="${escapeHtml(guide.id)}">
        <div class="toolkit-card__eyebrow">${escapeHtml(guide.kind)}</div>
        <h3 class="toolkit-card__title">${escapeHtml(guide.title)}</h3>
        <p class="toolkit-card__copy">${escapeHtml(guide.summary)}</p>
      </button>
    </article>
  `;
}

function renderGuideBundleCard(bundle) {
  return `
    <article class="guide-bundle-card">
      <div class="guide-bundle-card__eyebrow">Core Bundle</div>
      <h3 class="guide-bundle-card__title">${escapeHtml(bundle.title)}</h3>
      <p class="guide-bundle-card__copy">${escapeHtml(bundle.summary)}</p>
    </article>
  `;
}

function renderPlaybook(playbook) {
  return `
    <section class="playbook-card">
      <div class="playbook-card__eyebrow">Playbook</div>
      <h3 class="playbook-card__title">${escapeHtml(playbook.title)}</h3>
      <div class="playbook-card__stack">
        ${playbook.items
          .map(
            (item) => `
              <article class="playbook-tip">
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.body)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderGuideDetail(guide) {
  if (!guide) {
    return renderSectionCopy(GUIDE_SECTIONS.guides);
  }

  return `
    <div class="detail-stack">
      <section class="detail-hero">
        <div class="detail-eyebrow">Toolkit ${escapeHtml(guide.kind)}</div>
        <h3 class="detail-title">${escapeHtml(guide.title)}</h3>
        <p class="detail-copy">${escapeHtml(guide.summary)}</p>
        <button
          class="detail-action"
          type="button"
          data-toolkit-action-type="${escapeHtml(guide.action.type)}"
          data-toolkit-action-target="${escapeHtml(guide.action.targetId)}"
        >
          ${escapeHtml(guide.ctaLabel)}
        </button>
      </section>
      <section class="detail-block">
        <div class="detail-block__title">Best Use</div>
        <ul class="detail-copy-list">
          ${guide.bullets.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
        </ul>
      </section>
    </div>
  `;
}

function renderArticleShelfCard(article, selected) {
  return `
    <article class="article-shelf-card" data-selected="${selected ? "true" : "false"}">
      <button class="article-shelf-card__button" type="button" data-toolkit-article="${escapeHtml(article.id)}">
        <div class="article-shelf-card__eyebrow">${escapeHtml(article.category)}</div>
        <h3 class="article-shelf-card__title">${escapeHtml(article.title)}</h3>
        <p class="article-shelf-card__copy">${escapeHtml(article.summary)}</p>
      </button>
    </article>
  `;
}

function renderArticleSection(article, section, index) {
  const sectionId = `article-section-${article.id}-${index + 1}`;

  return `
    <section class="article-section" id="${escapeHtml(sectionId)}">
      <div class="article-section__eyebrow">${escapeHtml(section.label)}</div>
      <h4 class="article-section__title">${escapeHtml(section.title)}</h4>
      <p class="article-section__copy">${escapeHtml(section.body)}</p>
      ${
        section.bullets?.length
          ? `
            <ul class="article-section__list">
              ${section.bullets.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
            </ul>
          `
          : ""
      }
      ${
        section.callout
          ? `
            <div class="article-callout">${escapeHtml(section.callout)}</div>
          `
          : ""
      }
      ${
        section.formula
          ? `
            <div class="article-formula-wrap">
              <div class="article-formula__eyebrow">Formula</div>
              <pre class="article-formula"><code>${escapeHtml(section.formula)}</code></pre>
            </div>
          `
          : ""
      }
    </section>
  `;
}

function renderArticleBody(article) {
  const relatedArticles = (article.relatedIds || [])
    .map((relatedId) => getArticleById(relatedId))
    .filter(Boolean);

  return `
    <article class="article-story">
      <header class="article-hero">
        <div class="article-hero__eyebrow">${escapeHtml(article.category)}</div>
        <h3 class="article-hero__title">${escapeHtml(article.title)}</h3>
        <p class="article-hero__copy">${escapeHtml(article.summary)}</p>
        <div class="article-meta">
          ${article.readTime ? `<span>${escapeHtml(article.readTime)}</span>` : ""}
          ${article.date ? `<span>${escapeHtml(article.date)}</span>` : ""}
          ${article.tags?.length ? `<span>${escapeHtml(article.tags.join(" • "))}</span>` : ""}
        </div>
        ${renderToolkitActionButtons(article.actions)}
      </header>
      ${
        article.mapAnchors?.length
          ? `
            <section class="article-anchor">
              <div class="article-anchor__copy">
                <div class="article-anchor__eyebrow">World Anchor</div>
                <strong>${escapeHtml(article.heroMapTitle)}</strong>
                <p>${escapeHtml(article.heroMapCaption)}</p>
              </div>
              <div class="article-anchor__tags">
                ${article.mapAnchors.map((anchor) => `<span class="guide-pill">${escapeHtml(anchor)}</span>`).join("")}
              </div>
              <button class="guide-jump" type="button" data-toolkit-action-type="view" data-toolkit-action-target="map">
                Open Local Map
              </button>
            </section>
          `
          : ""
      }
      ${article.sections.map((section, index) => renderArticleSection(article, section, index)).join("")}
      ${
        article.supplyTips?.length
          ? `
            <section class="article-section">
              <div class="article-section__eyebrow">Supply Tips</div>
              <h4 class="article-section__title">Practical expedition baselines</h4>
              <div class="article-note-grid">
                ${article.supplyTips
                  .map(
                    (tip, index) => `
                      <article class="article-note">
                        <strong>Supply Tip ${index + 1}</strong>
                        <p>${escapeHtml(tip)}</p>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
          : ""
      }
      ${
        article.faq?.length
          ? `
            <section class="article-section">
              <div class="article-section__eyebrow">Frequently Asked Questions</div>
              <h4 class="article-section__title">Quick walkthrough answers</h4>
              <div class="detail-faq">
                ${article.faq
                  .map(
                    (item) => `
                      <article class="detail-faq__item">
                        <strong>${escapeHtml(item.question)}</strong>
                        <p>${escapeHtml(item.answer)}</p>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
          : ""
      }
      ${
        article.internalLinks?.length
          ? `
            <section class="article-section">
              <div class="article-section__eyebrow">Internal Links</div>
              <h4 class="article-section__title">Targeted routes</h4>
              <div class="article-link-grid">
                ${article.internalLinks
                  .map(
                    (item) => `
                      <button
                        class="article-link-card"
                        type="button"
                        data-toolkit-action-type="${escapeHtml(item.type || "article")}"
                        data-toolkit-action-target="${escapeHtml(item.targetId)}"
                      >
                        ${escapeHtml(item.label)}
                      </button>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
          : ""
      }
      ${
        article.calculatorHooks?.length
          ? `
            <section class="article-section">
              <div class="article-section__eyebrow">Calculator Hooks</div>
              <h4 class="article-section__title">Toolkit shortcuts</h4>
              <div class="article-link-grid">
                ${article.calculatorHooks
                  .map(
                    (item) => `
                      <button
                        class="article-link-card"
                        type="button"
                        data-toolkit-action-type="${escapeHtml(item.type)}"
                        data-toolkit-action-target="${escapeHtml(item.targetId)}"
                      >
                        ${escapeHtml(item.label)}
                      </button>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
          : ""
      }
      ${
        article.media?.length
          ? `
            <section class="article-section">
              <div class="article-section__eyebrow">Media & Visuals</div>
              <h4 class="article-section__title">Reference captures</h4>
              <div class="article-note-grid">
                ${article.media
                  .map(
                    (item) => `
                      <article class="article-note">
                        <strong>${escapeHtml(item.title)}</strong>
                        <p>${escapeHtml(item.caption)}</p>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
          : ""
      }
      ${
        relatedArticles.length
          ? `
            <section class="article-section">
              <div class="article-section__eyebrow">Related Articles</div>
              <h4 class="article-section__title">Survival follow-ups</h4>
              <div class="article-related-grid">
                ${relatedArticles
                  .map(
                    (relatedArticle) => `
                      <article class="article-related-card">
                        <div class="article-related-card__eyebrow">${escapeHtml(relatedArticle.category)}</div>
                        <strong>${escapeHtml(relatedArticle.title)}</strong>
                        <p>${escapeHtml(relatedArticle.summary)}</p>
                        <button
                          class="guide-jump"
                          type="button"
                          data-toolkit-action-type="article"
                          data-toolkit-action-target="${escapeHtml(relatedArticle.id)}"
                        >
                          Open Article
                        </button>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
          : ""
      }
      ${
        article.footerActions?.length
          ? `
            <section class="article-section">
              <div class="article-section__eyebrow">Quick Actions</div>
              <h4 class="article-section__title">Next step</h4>
              ${renderToolkitActionButtons(article.footerActions)}
            </section>
          `
          : ""
      }
    </article>
  `;
}

function renderArticleDetail(article) {
  const relatedArticles = (article.relatedIds || [])
    .map((relatedId) => getArticleById(relatedId))
    .filter(Boolean);

  return `
    <div class="detail-stack">
      <section class="detail-hero">
        <div class="detail-eyebrow">${escapeHtml(article.category)}</div>
        <h3 class="detail-title">${escapeHtml(article.title)}</h3>
        <p class="detail-copy">${escapeHtml(article.summary)}</p>
      </section>
      <section class="detail-block">
        <div class="detail-block__title">Article Meta</div>
        <ul class="detail-list">
          <li class="detail-list__row">
            <span>Read Time</span>
            <strong>${escapeHtml(article.readTime || "Guide")}</strong>
          </li>
          <li class="detail-list__row">
            <span>Date</span>
            <strong>${escapeHtml(article.date || "Toolkit shelf")}</strong>
          </li>
          <li class="detail-list__row">
            <span>Tags</span>
            <strong>${escapeHtml((article.tags || []).join(", ") || "none")}</strong>
          </li>
        </ul>
      </section>
      <section class="detail-block">
        <div class="detail-block__title">Outline</div>
        <div class="article-outline">
          ${article.sections
            .map(
              (section, index) => `
                <button
                  class="article-outline__button"
                  type="button"
                  data-article-section="article-section-${escapeHtml(article.id)}-${index + 1}"
                >
                  ${escapeHtml(section.label)} - ${escapeHtml(section.title)}
                </button>
              `
            )
            .join("")}
        </div>
      </section>
      ${
        article.internalLinks?.length
          ? `
            <section class="detail-block">
              <div class="detail-block__title">Internal Links</div>
              <div class="article-outline">
                ${article.internalLinks
                  .map(
                    (item) => `
                      <button
                        class="article-outline__button"
                        type="button"
                        data-toolkit-action-type="${escapeHtml(item.type || "article")}"
                        data-toolkit-action-target="${escapeHtml(item.targetId)}"
                      >
                        ${escapeHtml(item.label)}
                      </button>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
          : ""
      }
      ${
        relatedArticles.length
          ? `
            <section class="detail-block">
              <div class="detail-block__title">Related</div>
              <div class="article-outline">
                ${relatedArticles
                  .map(
                    (relatedArticle) => `
                      <button
                        class="article-outline__button"
                        type="button"
                        data-toolkit-action-type="article"
                        data-toolkit-action-target="${escapeHtml(relatedArticle.id)}"
                      >
                        ${escapeHtml(relatedArticle.title)}
                      </button>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
          : ""
      }
    </div>
  `;
}

function renderNav(refs, state) {
  refs.nav.innerHTML = GUIDE_NAV.map(
    (item) => `
      <button
        class="guide-nav__button"
        type="button"
        data-guide-view="${escapeHtml(item.id)}"
        data-active="${state.view === item.id ? "true" : "false"}"
      >
        ${escapeHtml(item.label)}
      </button>
    `
  ).join("");
}

function renderPinned(refs, state) {
  const trackedRecipe = getTrackedRecipe(state.trackedRecipeId);

  if (!trackedRecipe) {
    refs.pinned.innerHTML = `
      <div class="guide-pinned__eyebrow">Pinned Recipe</div>
      <strong>None</strong>
      <p>Select any recipe and pin it to the HUD.</p>
    `;
    return;
  }

  refs.pinned.innerHTML = `
    <div class="guide-pinned__eyebrow">Pinned Recipe</div>
    <strong>${escapeHtml(trackedRecipe.name)}</strong>
    <p>${escapeHtml(formatIngredientList(trackedRecipe.ingredients))}</p>
  `;
}

function renderHeader(refs, state) {
  const meta = GUIDE_SECTIONS[state.view];
  refs.overline.textContent = meta.overline;
  refs.title.textContent = meta.title;
  refs.description.textContent = meta.description;

  const hasSearch = isRecipeView(state.view);
  refs.searchWrap.hidden = !hasSearch;
  refs.searchInput.placeholder = meta.searchPlaceholder || "";
  refs.searchInput.value = state.search;
}

function renderKpis(refs, state) {
  if (state.view === "home") {
    refs.kpis.innerHTML = [
      renderPill("Articles", String(TOOLKIT_ARTICLES.length)),
      renderPill("Guide Hooks", String(TOOLKIT_GUIDES.length)),
      renderPill("Recipes", String(ALL_RECIPES.length)),
      renderPill("Map Notes", String(SMALL_ISLAND_MAP_POINTS.length)),
    ].join("");
    return;
  }

  if (state.view === "guides") {
    refs.kpis.innerHTML = [
      renderPill("Guide Hooks", String(TOOLKIT_GUIDES.length)),
      renderPill("Linked Articles", String(TOOLKIT_ARTICLES.length)),
      renderPill("Featured", getGuideById(state.selectedGuideId)?.title || "None"),
    ].join("");
    return;
  }

  if (state.view === "articles") {
    refs.kpis.innerHTML = [
      renderPill("Articles", String(TOOLKIT_ARTICLES.length)),
      renderPill("Related Links", String(getArticleById(state.selectedArticleId)?.relatedIds?.length || 0)),
      renderPill("Featured", getArticleById(state.selectedArticleId)?.readTime || "Guide"),
    ].join("");
    return;
  }

  if (state.view === "map") {
    const resourceCount = SMALL_ISLAND_MAP_POINTS.filter((point) => point.kind === "Resource").length;
    refs.kpis.innerHTML = [
      renderPill("Field Notes", String(SMALL_ISLAND_MAP_POINTS.length)),
      renderPill("Resource Nodes", String(resourceCount)),
      renderPill("Shelters", "1"),
    ].join("");
    return;
  }

  if (state.view === "knitting") {
    refs.kpis.innerHTML = [
      renderPill("Imported Patterns", "0"),
      renderPill("Ready Components", "Search / Detail / Pin"),
    ].join("");
    return;
  }

  const recipes = getRecipesForView(state.view);
  const visibleRecipes = getVisibleRecipes(state);
  const categories = state.view === "database"
    ? ["crafting", "cooking"]
    : getCategoryList(recipes);

  refs.kpis.innerHTML = [
    renderPill("Showing", `${visibleRecipes.length} of ${recipes.length}`),
    renderPill("Groups", String(categories.length)),
    renderPill(
      state.view === "database" ? "Crafting / Cooking" : "Recipes",
      state.view === "database"
        ? `${CRAFTING_RECIPES.length} / ${COOKING_RECIPES.length}`
        : String(recipes.length)
    ),
  ].join("");
}

function renderFilters(refs, state) {
  if (state.view === "guides" || state.view === "articles") {
    refs.filters.innerHTML = "";
    return;
  }

  if (state.view === "crafting" || state.view === "cooking") {
    const categories = getCategoryList(getRecipesForView(state.view));
    refs.filters.innerHTML = [
      `<button class="guide-filter" type="button" data-guide-filter="all" data-active="${state.filter === "all" ? "true" : "false"}">All</button>`,
      ...categories.map(
        (category) => `
          <button
            class="guide-filter"
            type="button"
            data-guide-filter="${escapeHtml(category)}"
            data-active="${state.filter === category ? "true" : "false"}"
          >
            ${escapeHtml(category)}
          </button>
        `
      ),
    ].join("");
    return;
  }

  if (state.view === "database") {
    refs.filters.innerHTML = [
      `<button class="guide-filter" type="button" data-guide-filter="all" data-active="${state.filter === "all" ? "true" : "false"}">All</button>`,
      `<button class="guide-filter" type="button" data-guide-filter="crafting" data-active="${state.filter === "crafting" ? "true" : "false"}">Crafting</button>`,
      `<button class="guide-filter" type="button" data-guide-filter="cooking" data-active="${state.filter === "cooking" ? "true" : "false"}">Cooking</button>`,
    ].join("");
    return;
  }

  refs.filters.innerHTML = "";
}

function renderHome(refs) {
  const featuredArticle = getArticleById(FEATURED_ARTICLE_ID);

  refs.content.innerHTML = `
    <section class="guide-home-grid">
      <article class="guide-home-card guide-home-card--hero">
        <div class="guide-home-card__eyebrow">Winter Burrow Toolkit</div>
        <h3>The toolkit archive now lives inside the game.</h3>
        <p>
          The handbook now carries article-style walkthroughs, quick-launch guide hooks, recipe
          archives, and a local field map tied to the current island scene.
        </p>
        <div class="guide-home-card__actions">
          <button class="guide-jump" type="button" data-guide-view="articles">Open Articles</button>
          <button class="guide-jump" type="button" data-guide-view="guides">Open Guides</button>
          <button class="guide-jump" type="button" data-guide-view="database">Open Database</button>
        </div>
      </article>
      <article class="guide-home-card">
        <div class="guide-home-card__eyebrow">Featured Walkthrough</div>
        <h3>${escapeHtml(featuredArticle.title)}</h3>
        <p>${escapeHtml(featuredArticle.summary)}</p>
      </article>
      <article class="guide-home-card">
        <div class="guide-home-card__eyebrow">Guide Hooks</div>
        <h3>${TOOLKIT_GUIDES.length} quick references</h3>
        <p>Planner notes, map routing, and pickaxe progression shortcuts live here.</p>
      </article>
      <article class="guide-home-card">
        <div class="guide-home-card__eyebrow">Crafting</div>
        <h3>${CRAFTING_RECIPES.length} blueprints</h3>
        <p>Planks, tools, furniture, planters, unlock sources, and attack values.</p>
      </article>
      <article class="guide-home-card">
        <div class="guide-home-card__eyebrow">Cooking & Database</div>
        <h3>${COOKING_RECIPES.length} meals, ${ALL_RECIPES.length} total rows</h3>
        <p>Browse every imported recipe entry alongside the article archive and local map.</p>
      </article>
    </section>
  `;

  refs.detail.innerHTML = renderSectionCopy(GUIDE_SECTIONS.home);
}

function renderGuides(refs, state) {
  const selectedGuide = getGuideById(state.selectedGuideId);

  refs.content.innerHTML = `
    <section class="guides-hero">
      <div class="guides-hero__eyebrow">Winter Burrow Guides</div>
      <h3 class="guides-hero__title">Tactical Playbooks for Every Expedition</h3>
      <p class="guides-hero__copy">
        Six core guide bundles updated with our latest expedition math. Pair these with the
        Expedition Console and Warmth Budget to plan safer routes, efficient cooking loops, and
        restoration milestones.
      </p>
    </section>
    <section class="guide-bundle-grid">
      ${GUIDE_PAGE_BUNDLES.map((bundle) => renderGuideBundleCard(bundle)).join("")}
    </section>
    <section class="toolkit-card-grid">
      ${TOOLKIT_GUIDES.map((guide) => renderGuideCard(guide, guide.id === selectedGuide?.id)).join("")}
    </section>
    <section class="playbook-grid">
      ${GUIDE_PLAYBOOKS.map((playbook) => renderPlaybook(playbook)).join("")}
    </section>
    <section class="guides-cta">
      <div class="guides-cta__eyebrow">Looking for More Specific Advice?</div>
      <h3 class="guides-cta__title">Detailed walkthroughs, recipe guides, and answers live in Articles.</h3>
      <p class="guides-cta__copy">
        Use the article shelf for long-form routes, FAQs, and more focused breakdowns of key systems.
      </p>
      <button class="guide-jump" type="button" data-guide-view="articles">Browse Articles</button>
    </section>
  `;

  refs.detail.innerHTML = renderGuideDetail(selectedGuide);
}

function renderMap(refs, state) {
  const normalizedPoints = SMALL_ISLAND_MAP_POINTS.map(normalizeMapPoint);
  const selectedPoint = normalizedPoints.find((point) => point.id === state.selectedMapPointId) || normalizedPoints[0];

  refs.content.innerHTML = `
    <section class="map-layout">
      <div class="map-board">
        ${normalizedPoints
          .map(
            (point) => `
              <button
                class="map-point"
                type="button"
                data-map-point="${escapeHtml(point.id)}"
                data-kind="${escapeHtml(point.kind)}"
                data-selected="${selectedPoint?.id === point.id ? "true" : "false"}"
                style="left:${point.screenX}%; top:${point.screenY}%"
              >
                ${escapeHtml(point.label)}
              </button>
            `
          )
          .join("")}
      </div>
      <div class="map-note-list">
        ${normalizedPoints
          .map(
            (point) => `
              <button
                class="map-note"
                type="button"
                data-map-point="${escapeHtml(point.id)}"
                data-selected="${selectedPoint?.id === point.id ? "true" : "false"}"
              >
                <span>${escapeHtml(point.kind)}</span>
                <strong>${escapeHtml(point.label)}</strong>
              </button>
            `
          )
          .join("")}
      </div>
    </section>
  `;

  refs.detail.innerHTML = `
    <div class="detail-stack">
      <section class="detail-hero">
        <div class="detail-eyebrow">${escapeHtml(GUIDE_SECTIONS.map.overline)}</div>
        <h3 class="detail-title">${escapeHtml(selectedPoint.label)}</h3>
        <p class="detail-copy">${escapeHtml(selectedPoint.description)}</p>
      </section>
      <section class="detail-block">
        <div class="detail-block__title">Point Data</div>
        <ul class="detail-list">
          <li class="detail-list__row">
            <span>Type</span>
            <strong>${escapeHtml(selectedPoint.kind)}</strong>
          </li>
          <li class="detail-list__row">
            <span>World X</span>
            <strong>${escapeHtml(selectedPoint.position.x)}</strong>
          </li>
          <li class="detail-list__row">
            <span>World Z</span>
            <strong>${escapeHtml(selectedPoint.position.z)}</strong>
          </li>
        </ul>
      </section>
      <section class="detail-block">
        <div class="detail-block__title">Routing Notes</div>
        <ul class="detail-copy-list">
          ${GUIDE_SECTIONS.map.bullets.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
        </ul>
      </section>
    </div>
  `;
}

function renderRecipeBrowser(refs, state) {
  const visibleRecipes = getVisibleRecipes(state);
  const selectedRecipe = visibleRecipes.find((recipe) => recipe.id === state.selectedRecipeId) || null;

  refs.content.innerHTML = visibleRecipes.length
    ? `<section class="recipe-grid">${visibleRecipes
        .map((recipe) => renderRecipeCard(recipe, recipe.id === selectedRecipe?.id))
        .join("")}</section>`
    : renderEmptyState("No recipes found", "Try another search term or clear the active filter.");

  refs.detail.innerHTML = selectedRecipe
    ? renderRecipeDetail(selectedRecipe, GUIDE_SECTIONS[selectedRecipe.section], state.trackedRecipeId)
    : renderSectionCopy(GUIDE_SECTIONS[state.view]);
}

function renderArticles(refs, state) {
  const selectedArticle = getArticleById(state.selectedArticleId);

  refs.content.innerHTML = `
    <section class="article-shelf">
      ${TOOLKIT_ARTICLES
        .map((article) => renderArticleShelfCard(article, article.id === selectedArticle?.id))
        .join("")}
    </section>
    ${selectedArticle ? renderArticleBody(selectedArticle) : renderEmptyState("No article selected", "Choose an article from the shelf to open it.") }
  `;

  refs.detail.innerHTML = selectedArticle
    ? renderArticleDetail(selectedArticle)
    : renderSectionCopy(GUIDE_SECTIONS.articles);
}

function renderDatabase(refs, state) {
  const visibleRecipes = getVisibleRecipes(state);
  const selectedRecipe = visibleRecipes.find((recipe) => recipe.id === state.selectedRecipeId) || null;

  refs.content.innerHTML = visibleRecipes.length
    ? `
      <div class="database-table-wrap">
        <table class="database-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Section</th>
              <th>Category</th>
              <th>Ingredients</th>
              <th>Bonus / Unlock</th>
            </tr>
          </thead>
          <tbody>
            ${visibleRecipes
              .map(
                (recipe) => `
                  <tr data-selected="${recipe.id === selectedRecipe?.id ? "true" : "false"}">
                    <td>
                      <button class="database-row-button" type="button" data-recipe-id="${escapeHtml(recipe.id)}">
                        ${escapeHtml(recipe.name)}
                      </button>
                    </td>
                    <td>${escapeHtml(recipe.section)}</td>
                    <td>${escapeHtml(recipe.category)}</td>
                    <td>${escapeHtml(formatIngredientList(recipe.ingredients))}</td>
                    <td>${escapeHtml(
                      recipe.section === "crafting"
                        ? recipe.obtainedFrom || (recipe.attack ? `Attack ${recipe.attack}` : "Standard")
                        : `${recipe.duration} | ${recipe.statBoosts.slice(0, 2).join(", ")}`
                    )}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
    : renderEmptyState("No database rows found", "Search or section filters removed every row from the current view.");

  refs.detail.innerHTML = selectedRecipe
    ? renderRecipeDetail(selectedRecipe, GUIDE_SECTIONS[selectedRecipe.section], state.trackedRecipeId)
    : renderSectionCopy(GUIDE_SECTIONS.database);
}

function renderKnitting(refs) {
  refs.content.innerHTML = `
    <section class="guide-home-grid">
      <article class="guide-home-card guide-home-card--hero">
        <div class="guide-home-card__eyebrow">Knitting</div>
        <h3>Pattern data not included in the imported brief.</h3>
        <p>
          The section is implemented as part of the handbook shell, but it is waiting on real
          knitting recipes, yarn requirements, warmth stats, and unlock records.
        </p>
      </article>
      <article class="guide-home-card">
        <div class="guide-home-card__eyebrow">Ready</div>
        <h3>Search and detail layout</h3>
        <p>Once patterns arrive, they can plug into the same list, detail, and pin pipeline.</p>
      </article>
      <article class="guide-home-card">
        <div class="guide-home-card__eyebrow">Current Recommendation</div>
        <h3>Use Database for now</h3>
        <p>Crafting and Cooking are fully populated, so the unified index remains the fastest browse path.</p>
      </article>
    </section>
  `;

  refs.detail.innerHTML = renderSectionCopy(GUIDE_SECTIONS.knitting);
}

export function mountGuidePanelShell(root) {
  root.innerHTML = `
    <div class="guide-shell">
      <aside class="guide-sidebar" aria-label="Handbook navigation">
        <div class="guide-brand">
          <span class="guide-brand__eyebrow">Winter Burrow Logo</span>
          <strong class="guide-brand__title">Winter Burrow Toolkit</strong>
          <p class="guide-brand__copy">Guides, articles, recipes, and route notes wired into Small Island.</p>
        </div>
        <nav class="guide-nav" id="guide-nav" aria-label="Handbook sections"></nav>
        <section class="guide-pinned" id="guide-pinned"></section>
        <div class="guide-sidebar__foot">M or Esc closes the handbook.</div>
      </aside>
      <section class="guide-browser" aria-label="Handbook content">
        <header class="guide-browser__header">
          <div class="guide-overline" id="guide-overline"></div>
          <div class="guide-browser__title-row">
            <div>
              <h2 class="guide-title" id="guide-title"></h2>
              <p class="guide-description" id="guide-description"></p>
            </div>
            <button class="guide-close" id="guide-close" type="button">Close</button>
          </div>
          <label class="guide-search" id="guide-search-wrap">
            <span>Search</span>
            <input id="guide-search-input" type="search" autocomplete="off" spellcheck="false" />
          </label>
          <div class="guide-kpis" id="guide-kpis"></div>
          <div class="guide-filters" id="guide-filters"></div>
        </header>
        <div class="guide-content" id="guide-content"></div>
      </section>
      <aside class="guide-detail" id="guide-detail" aria-label="Handbook detail panel"></aside>
    </div>
  `;

  return {
    nav: root.querySelector("#guide-nav"),
    pinned: root.querySelector("#guide-pinned"),
    overline: root.querySelector("#guide-overline"),
    title: root.querySelector("#guide-title"),
    description: root.querySelector("#guide-description"),
    searchWrap: root.querySelector("#guide-search-wrap"),
    searchInput: root.querySelector("#guide-search-input"),
    kpis: root.querySelector("#guide-kpis"),
    filters: root.querySelector("#guide-filters"),
    content: root.querySelector("#guide-content"),
    detail: root.querySelector("#guide-detail"),
    closeButton: root.querySelector("#guide-close"),
  };
}

export function renderGuidePanel(refs, state) {
  renderNav(refs, state);
  renderPinned(refs, state);
  renderHeader(refs, state);
  renderKpis(refs, state);
  renderFilters(refs, state);

  if (state.view === "home") {
    renderHome(refs);
    return;
  }

  if (state.view === "map") {
    renderMap(refs, state);
    return;
  }

  if (state.view === "guides") {
    renderGuides(refs, state);
    return;
  }

  if (state.view === "articles") {
    renderArticles(refs, state);
    return;
  }

  if (state.view === "knitting") {
    renderKnitting(refs);
    return;
  }

  if (state.view === "database") {
    renderDatabase(refs, state);
    return;
  }

  renderRecipeBrowser(refs, state);
}

export function focusGuidePanelControl(refs) {
  if (!refs.searchWrap.hidden) {
    refs.searchInput.focus();
    return;
  }

  refs.closeButton.focus();
}
