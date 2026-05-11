const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePositiveInt(value, fallback) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizePaginationParams(params = {}, options = {}) {
    const defaultPage = options.defaultPage || DEFAULT_PAGE;
    const defaultLimit = options.defaultLimit || DEFAULT_LIMIT;
    const maxLimit = options.maxLimit || MAX_LIMIT;

    const page = parsePositiveInt(params.page, defaultPage);
    const requestedLimit = parsePositiveInt(params.limit, defaultLimit);
    const limit = Math.min(requestedLimit, maxLimit);
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
        maxLimit
    };
}

function buildPaginationMeta({ page, limit, total }) {
    const safeTotal = Number.isFinite(total) && total >= 0 ? total : 0;
    const totalPages = safeTotal === 0 ? 0 : Math.ceil(safeTotal / limit);

    return {
        page,
        limit,
        total: safeTotal,
        pages: totalPages,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages
    };
}

module.exports = {
    DEFAULT_PAGE,
    DEFAULT_LIMIT,
    MAX_LIMIT,
    normalizePaginationParams,
    buildPaginationMeta
};
