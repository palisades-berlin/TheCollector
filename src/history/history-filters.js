export function filterRecords(allRecords, filters, getRecordDomain, getRecordExportType) {
  const fromTs = filters.fromDate
    ? new Date(`${filters.fromDate}T00:00:00`).getTime()
    : null;
  const toTs = filters.toDate
    ? new Date(`${filters.toDate}T23:59:59.999`).getTime()
    : null;

  return allRecords.filter((record) => {
    if (filters.domain) {
      const domain = getRecordDomain(record);
      if (!domain.includes(filters.domain)) return false;
    }
    if (fromTs !== null && Number(record.timestamp || 0) < fromTs) return false;
    if (toTs !== null && Number(record.timestamp || 0) > toTs) return false;
    if (filters.type !== 'all' && getRecordExportType(record) !== filters.type) return false;
    return true;
  });
}

export function createHistoryFilters({
  filterDomainEl,
  filterFromEl,
  filterToEl,
  filterTypeEl,
  resetFiltersBtn,
  onChange,
}) {
  let filterDomainTimer = null;
  const filters = {
    domain: '',
    fromDate: '',
    toDate: '',
    type: 'all',
  };

  function getFilters() {
    return { ...filters };
  }

  function wireFilters() {
    filterDomainEl.addEventListener('input', () => {
      if (filterDomainTimer) clearTimeout(filterDomainTimer);
      filterDomainTimer = setTimeout(() => {
        filters.domain = String(filterDomainEl.value || '').trim().toLowerCase();
        onChange(false);
        filterDomainTimer = null;
      }, 150);
    });
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
    resetFiltersBtn.addEventListener('click', () => {
      if (filterDomainTimer) {
        clearTimeout(filterDomainTimer);
        filterDomainTimer = null;
      }
      filterDomainEl.value = '';
      filterFromEl.value = '';
      filterToEl.value = '';
      filterTypeEl.value = 'all';
      filters.domain = '';
      filters.fromDate = '';
      filters.toDate = '';
      filters.type = 'all';
      onChange(true);
    });
  }

  return {
    getFilters,
    wireFilters,
  };
}
