function buildPage(rows, limit) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    pagination: {
      limit,
      hasMore,
      nextCursor: hasMore ? String(items.at(-1).id) : null,
    },
  };
}

module.exports = { buildPage };
