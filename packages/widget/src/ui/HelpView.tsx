import { useRef } from "react";
import { Icon } from "./Icon.js";
import { SearchField } from "./SearchField.js";
import { searchArticles, articleExcerpt, articleText } from "./search.js";
import { HighlightedText } from "./HighlightedText.js";
import type { HelpArticle, HelpFilters } from "./types.js";
import { useT } from "./i18n/useT.js";

export function HelpView({
  articles,
  onOpen,
  filters,
  onFilters,
}: {
  articles: readonly HelpArticle[];
  onOpen: (id: string) => void;
  filters: HelpFilters;
  onFilters: (filters: HelpFilters) => void;
}) {
  const t = useT();
  const { query, category } = filters;
  const search = useRef<HTMLInputElement>(null);
  const term = query.trim().toLowerCase();
  const categories = [...new Set(articles.map((article) => article.category))];
  const filtered = searchArticles(articles, query, category);
  return (
    <div className="qb-list-view">
      <h1>{t("Help & Support")}</h1>
      <SearchField
        label={t("Search for help")}
        value={query}
        onChange={(query) => onFilters({ ...filters, query })}
        inputRef={search}
      />
      {category && (
        <button
          type="button"
          className="qb-category-back"
          onClick={() => {
            onFilters({ ...filters, category: null });
            search.current?.focus();
          }}
        >
          <Icon name="back" />
          {t("All categories")}
        </button>
      )}
      {!term && !category
        ? categories.map((name) => (
            <button
              type="button"
              className="qb-help-row"
              key={name}
              onClick={() => {
                onFilters({ ...filters, category: name });
                search.current?.focus();
              }}
            >
              <span className="qb-category-icon">
                <Icon name="folder" />
              </span>
              <span>{name}</span>
              <small>
                {articles.filter((article) => article.category === name).length}
              </small>
              <Icon name="chevron" />
            </button>
          ))
        : filtered.map((article) => (
            <button
              type="button"
              className="qb-help-row"
              key={article.id}
              onClick={() => onOpen(article.id)}
            >
              <span className="qb-category-icon">
                <Icon name="help" />
              </span>
              <span>
                <HighlightedText text={article.title} query={query} />
                {term && (
                  <small className="qb-search-excerpt">
                    <HighlightedText
                      text={articleExcerpt(articleText(article), query)}
                      query={query}
                    />
                  </small>
                )}
              </span>
              <Icon name="chevron" />
            </button>
          ))}
      {!filtered.length && (
        <div className="qb-empty" role={term ? "status" : undefined}>
          <span className="qb-empty-icon">
            <Icon name={term ? "search" : "help"} />
          </span>
          <h2>
            {term
              ? t("No articles match your search.")
              : t("No help articles yet.")}
          </h2>
          <p>
            {term
              ? t("Try another word or clear your search.")
              : t("Check back here for guides and answers.")}
          </p>
        </div>
      )}
    </div>
  );
}
