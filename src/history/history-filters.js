function normalizeDomainQuery(rawValue) {
  return String(rawValue || '')
    .trim()
    .toLowerCase();
}

function normalizeTld(rawValue) {
  const value = normalizeDomainQuery(rawValue);
  if (!value) return '';
  return value.startsWith('.') ? value : `.${value}`;
}

function inferDomainMode(rawValue, knownDomains = []) {
  const value = normalizeDomainQuery(rawValue);
  if (!value) return 'domain';
  if (value.startsWith('.')) return 'tld';
  if (knownDomains.includes(value)) return 'domain';
  return 'domain';
}

function matchesDomainFilter(recordDomain, rawFilter, domainMode) {
  const domain = normalizeDomainQuery(recordDomain);
  const query = normalizeDomainQuery(rawFilter);
  if (!query) return true;
  if (domainMode === 'domain_exact') return domain === query;
  if (domainMode === 'tld') {
    const tld = normalizeTld(query);
    return domain.endsWith(tld);
  }
  return domain.includes(query);
}

export function filterRecords(
  allRecords,
  filters,
  getRecordDomain,
  getRecordExportType,
  getRecordProfileId
) {
  const fromTs = filters.fromDate ? new Date(`${filters.fromDate}T00:00:00`).getTime() : null;
  const toTs = filters.toDate ? new Date(`${filters.toDate}T23:59:59.999`).getTime() : null;

  return allRecords.filter((record) => {
    if (filters.domain) {
      const domain = getRecordDomain(record);
      if (!matchesDomainFilter(domain, filters.domain, filters.domainMode || 'domain'))
        return false;
    }
    if (fromTs !== null && Number(record.timestamp || 0) < fromTs) return false;
    if (toTs !== null && Number(record.timestamp || 0) > toTs) return false;
    if (filters.type !== 'all' && getRecordExportType(record) !== filters.type) return false;
    if (filters.profile !== 'all') {
      const profileId = getRecordProfileId ? getRecordProfileId(record) : '';
      if (profileId !== filters.profile) return false;
    }
    return true;
  });
}

export function createHistoryFilters({
  filterDomainEl,
  filterDomainComboboxEl,
  filterDomainListboxEl,
  clearDomainFilterBtn,
  filterFromEl,
  filterToEl,
  filterTypeEl,
  filterProfileEl,
  resetFiltersBtn,
  onChange,
}) {
  let filterDomainTimer = null;
  let domainSuggestions = [];
  let filteredSuggestions = [];
  let activeSuggestionIndex = -1;
  let listboxVisible = false;

  const filters = {
    domain: '',
    domainMode: 'domain',
    fromDate: '',
    toDate: '',
    type: 'all',
    profile: 'all',
  };

  function getKnownTlds() {
    return domainSuggestions.map((suggestion) => suggestion.value);
  }

  function getFilters() {
    return { ...filters };
  }

  function closeListbox() {
    listboxVisible = false;
    filterDomainListboxEl?.classList.add('hidden');
    filterDomainComboboxEl?.setAttribute('aria-expanded', 'false');
    filterDomainEl?.removeAttribute('aria-activedescendant');
  }

  function updateClearButton() {
    if (!clearDomainFilterBtn) return;
    clearDomainFilterBtn.hidden = !filters.domain;
  }

  function renderListbox() {
    if (!filterDomainListboxEl) return;
    filterDomainListboxEl.innerHTML = '';
    if (filteredSuggestions.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'domain-list-empty';
      empty.textContent = 'No matching domains in saved screenshots.';
      filterDomainListboxEl.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    for (let idx = 0; idx < filteredSuggestions.length; idx++) {
      const suggestion = filteredSuggestions[idx];
      const optionId = `filterDomainOption-${idx}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'domain-option';
      button.id = optionId;
      button.setAttribute('role', 'option');
      button.setAttribute('data-value', suggestion.value);
      button.setAttribute('aria-selected', idx === activeSuggestionIndex ? 'true' : 'false');
      if (idx === activeSuggestionIndex) {
        button.classList.add('is-active');
        filterDomainEl?.setAttribute('aria-activedescendant', optionId);
      }

      const valueSpan = document.createElement('span');
      valueSpan.textContent = suggestion.value;
      const countSpan = document.createElement('span');
      countSpan.className = 'domain-option-count';
      countSpan.textContent = `${suggestion.count}`;
      button.append(valueSpan, countSpan);

      button.addEventListener('mousedown', (event) => {
        event.preventDefault();
      });
      button.addEventListener('click', () => {
        setDomainFilter(suggestion.value, 'domain_exact');
        closeListbox();
      });
      fragment.appendChild(button);
    }
    filterDomainListboxEl.appendChild(fragment);
  }

  function openListbox() {
    if (!filterDomainListboxEl || domainSuggestions.length === 0) return;
    listboxVisible = true;
    filterDomainListboxEl.classList.remove('hidden');
    filterDomainComboboxEl?.setAttribute('aria-expanded', 'true');
    renderListbox();
  }

  function recomputeFilteredSuggestions() {
    const query = normalizeDomainQuery(filterDomainEl?.value || '');
    if (!query) {
      filteredSuggestions = domainSuggestions.slice();
    } else {
      filteredSuggestions = domainSuggestions.filter((suggestion) =>
        suggestion.value.includes(query)
      );
    }
    activeSuggestionIndex = filteredSuggestions.length > 0 ? 0 : -1;
  }

  function setDomainFilter(rawValue, mode = null) {
    const normalized = normalizeDomainQuery(rawValue);
    filters.domain = normalized;
    filters.domainMode = mode || inferDomainMode(normalized, getKnownTlds());
    filterDomainEl.value = normalized;
    updateClearButton();
    recomputeFilteredSuggestions();
    onChange(false);
  }

  function setDomainSuggestions(nextSuggestions) {
    domainSuggestions = (nextSuggestions || [])
      .filter((suggestion) => suggestion && typeof suggestion.value === 'string')
      .map((suggestion) => ({
        value: normalizeDomainQuery(suggestion.value),
        count: Math.max(0, Number(suggestion.count || 0)),
      }))
      .filter((suggestion) => suggestion.value);
    recomputeFilteredSuggestions();
    if (listboxVisible) renderListbox();
  }

  function wireDomainComboInteractions() {
    if (!filterDomainEl) return;

    filterDomainEl.addEventListener('focus', () => {
      recomputeFilteredSuggestions();
      openListbox();
    });

    filterDomainEl.addEventListener('click', () => {
      recomputeFilteredSuggestions();
      openListbox();
    });

    filterDomainEl.addEventListener('input', () => {
      if (filterDomainTimer) clearTimeout(filterDomainTimer);
      recomputeFilteredSuggestions();
      openListbox();
      filterDomainTimer = setTimeout(() => {
        const query = normalizeDomainQuery(filterDomainEl.value);
        filters.domain = query;
        filters.domainMode = inferDomainMode(query, getKnownTlds());
        updateClearButton();
        onChange(false);
        filterDomainTimer = null;
      }, 150);
    });

    filterDomainEl.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        if (!listboxVisible) {
          recomputeFilteredSuggestions();
          openListbox();
          return;
        }
        if (filteredSuggestions.length === 0) return;
        event.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex + 1) % filteredSuggestions.length;
        renderListbox();
        return;
      }

      if (event.key === 'ArrowUp') {
        if (!listboxVisible || filteredSuggestions.length === 0) return;
        event.preventDefault();
        activeSuggestionIndex =
          activeSuggestionIndex <= 0 ? filteredSuggestions.length - 1 : activeSuggestionIndex - 1;
        renderListbox();
        return;
      }

      if (event.key === 'Enter') {
        if (listboxVisible && activeSuggestionIndex >= 0 && filteredSuggestions.length > 0) {
          event.preventDefault();
          const active = filteredSuggestions[activeSuggestionIndex];
          setDomainFilter(active.value, 'domain_exact');
          closeListbox();
          return;
        }
        setDomainFilter(filterDomainEl.value, null);
        closeListbox();
        return;
      }

      if (event.key === 'Escape') {
        if (!listboxVisible) return;
        event.preventDefault();
        closeListbox();
      }
    });

    document.addEventListener('click', (event) => {
      if (
        !filterDomainComboboxEl?.contains(event.target) &&
        !filterDomainListboxEl?.contains(event.target)
      ) {
        closeListbox();
      }
    });

    clearDomainFilterBtn?.addEventListener('click', () => {
      setDomainFilter('', 'domain');
      closeListbox();
      filterDomainEl.focus();
    });
  }

  function wireFilters() {
    wireDomainComboInteractions();

    filterFromEl.addEventListener('change', () => {
      filters.fromDate = filterFromEl.value || '';
      onChange(false);
    });
    filterToEl.addEventListener('change', () => {
      filters.toDate = filterToEl.value || '';
      onChange(false);
    });
    filterTypeEl.addEventListener('change', () => {
      filters.type = filterTypeEl.value || 'all';
      onChange(false);
    });
    filterProfileEl?.addEventListener('change', () => {
      filters.profile = filterProfileEl.value || 'all';
      onChange(false);
    });
    resetFiltersBtn.addEventListener('click', () => {
      if (filterDomainTimer) {
        clearTimeout(filterDomainTimer);
        filterDomainTimer = null;
      }
      filterDomainEl.value = '';
      filterFromEl.value = '';
      filterToEl.value = '';
      filterTypeEl.value = 'all';
      if (filterProfileEl) filterProfileEl.value = 'all';
      filters.domain = '';
      filters.domainMode = 'domain';
      filters.fromDate = '';
      filters.toDate = '';
      filters.type = 'all';
      filters.profile = 'all';
      updateClearButton();
      recomputeFilteredSuggestions();
      closeListbox();
      onChange(true);
    });
  }

  return {
    getFilters,
    setDomainFilter,
    setDomainSuggestions,
    wireFilters,
  };
}
