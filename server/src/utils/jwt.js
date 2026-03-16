function parseJwtExpiresInToSeconds(expiresIn) {
    if (typeof expiresIn === 'number' && Number.isFinite(expiresIn)) {
        return expiresIn;
    }

    const value = String(expiresIn || '').trim();
    const match = value.match(/^(\d+)([smhd])?$/i);
    if (!match) {
        return 7 * 24 * 60 * 60;
    }

    const amount = parseInt(match[1], 10);
    const unit = (match[2] || 's').toLowerCase();

    const multipliers = {
        s: 1,
        m: 60,
        h: 60 * 60,
        d: 24 * 60 * 60
    };

    return amount * (multipliers[unit] || 1);
}

module.exports = {
    parseJwtExpiresInToSeconds
};
