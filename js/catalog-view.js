const catalogGrid = document.querySelector("[data-catalog-grid]");
const viewTriggers = document.querySelectorAll("[data-catalog-view-trigger]");

if (catalogGrid && viewTriggers.length) {
  const setCatalogView = (columns) => {
    if (columns === "1") {
      catalogGrid.classList.add("grid-cols-1");
      catalogGrid.classList.remove("grid-cols-2");
    } else {
      catalogGrid.classList.add("grid-cols-2");
      catalogGrid.classList.remove("grid-cols-1");
    }

    viewTriggers.forEach((trigger) => {
      const isActive = trigger.dataset.catalogViewTrigger === columns;
      trigger.classList.toggle("is-active", isActive);
      trigger.setAttribute("aria-pressed", String(isActive));
    });
  };

  viewTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      setCatalogView(trigger.dataset.catalogViewTrigger);
    });
  });

  const activeTrigger =
    document.querySelector("[data-catalog-view-trigger].is-active") || viewTriggers[0];

  setCatalogView(activeTrigger.dataset.catalogViewTrigger);
}
