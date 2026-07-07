const catalogGrid = document.querySelector("[data-catalog-grid]");
const viewTriggers = document.querySelectorAll("[data-catalog-view-trigger]");
const typeTriggers = document.querySelectorAll("[data-catalog-view-type]");

// 1. Column view logic (1 vs 2 columns)
if (catalogGrid && viewTriggers.length) {
  const setCatalogView = (columns) => {
    catalogGrid.dataset.catalogViewColumns = columns;

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

// 2. Image type logic (Product vs Lifestyle)
if (typeTriggers.length) {
  const resetCatalogCardMedia = () => {
    document.querySelectorAll(".catalog-card__media").forEach((media) => {
      media.scrollLeft = 0;
    });
  };

  const setImageType = (type) => {
    const images = document.querySelectorAll("[data-product-main]");
    
    images.forEach(img => {
      const productSrc = img.dataset.imgProduct;
      const lifestyleSrc = img.dataset.imgLifestyle;
      
      if (type === "product" && productSrc) {
        img.src = productSrc;
      } else if (type === "lifestyle" && lifestyleSrc) {
        img.src = lifestyleSrc;
      }
    });

    resetCatalogCardMedia();

    typeTriggers.forEach(trigger => {
      const isActive = trigger.dataset.catalogViewType === type;
      trigger.classList.toggle("is-active", isActive);
      trigger.setAttribute("aria-pressed", String(isActive));
    });
  };

  typeTriggers.forEach(trigger => {
    trigger.addEventListener("click", () => {
      setImageType(trigger.dataset.catalogViewType);
    });
  });

  const activeTypeTrigger =
    document.querySelector("[data-catalog-view-type].is-active") || typeTriggers[0];

  setImageType(activeTypeTrigger.dataset.catalogViewType);
}
