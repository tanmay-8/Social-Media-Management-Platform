function normalizeYearDates(festival) {
    if (Array.isArray(festival?.yearDates) && festival.yearDates.length > 0) {
        return festival.yearDates
            .map((entry) => ({
                year: Number(entry.year),
                date: new Date(entry.date),
            }))
            .filter((entry) => Number.isFinite(entry.year) && !Number.isNaN(entry.date.getTime()))
            .sort((left, right) => left.date.getTime() - right.date.getTime());
    }

    if (festival?.date) {
        const fallbackDate = new Date(festival.date);
        if (!Number.isNaN(fallbackDate.getTime())) {
            return [
                {
                    year: Number(festival.year) || fallbackDate.getFullYear(),
                    date: fallbackDate,
                },
            ];
        }
    }

    return [];
}

function findOccurrenceByDate(festival, targetDate) {
    const target = new Date(targetDate);
    if (Number.isNaN(target.getTime())) {
        return null;
    }

    const targetYear = target.getFullYear();
    const targetMonth = target.getMonth();
    const targetDay = target.getDate();

    const matches = normalizeYearDates(festival).find((entry) => {
        return (
            entry.date.getFullYear() === targetYear &&
            entry.date.getMonth() === targetMonth &&
            entry.date.getDate() === targetDay
        );
    });

    return matches || null;
}

function findNextOccurrence(festival, fromDate = new Date()) {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);

    const occurrences = normalizeYearDates(festival);
    const future = occurrences.find((entry) => {
        const onlyDate = new Date(entry.date);
        onlyDate.setHours(0, 0, 0, 0);
        return onlyDate >= from;
    });

    return future || occurrences[0] || null;
}

function resolveFestivalBaseImage(festival, preferredImageId) {
    const preferred = preferredImageId ? String(preferredImageId) : null;
    const images = Array.isArray(festival?.baseImages) ? festival.baseImages : [];

    if (images.length > 0) {
        let selected = null;

        if (preferred) {
            selected =
                images.find((image) => {
                    const imageId = image?._id ? String(image._id) : null;
                    const imagePublicId = image?.public_id ? String(image.public_id) : null;
                    return imageId === preferred || imagePublicId === preferred;
                }) || null;
        }

        if (!selected && festival?.defaultBaseImageId) {
            selected =
                images.find((image) => String(image._id) === String(festival.defaultBaseImageId)) ||
                null;
        }

        if (!selected) {
            selected = images[0];
        }

        return {
            id: selected?._id ? String(selected._id) : selected?.public_id ? String(selected.public_id) : null,
            url: selected?.url || null,
            public_id: selected?.public_id || null,
        };
    }

    if (festival?.baseImage?.url) {
        return {
            id: null,
            url: festival.baseImage.url,
            public_id: festival.baseImage.public_id || null,
        };
    }

    return {
        id: null,
        url: null,
        public_id: null,
    };
}

function toFestivalResponse(festival, fromDate = new Date()) {
    const plain = typeof festival.toObject === 'function' ? festival.toObject() : { ...festival };
    const nextOccurrence = findNextOccurrence(plain, fromDate);
    const resolvedImage = resolveFestivalBaseImage(plain);

    return {
        ...plain,
        date: nextOccurrence?.date || plain.date || null,
        year: nextOccurrence?.year || plain.year || null,
        baseImage: resolvedImage.url
            ? {
                  url: resolvedImage.url,
                  public_id: resolvedImage.public_id,
              }
            : plain.baseImage || null,
    };
}

module.exports = {
    normalizeYearDates,
    findOccurrenceByDate,
    findNextOccurrence,
    resolveFestivalBaseImage,
    toFestivalResponse,
};
