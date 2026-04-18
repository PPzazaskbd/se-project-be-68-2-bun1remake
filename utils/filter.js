const hotelFilter = (query) => {
    let mongoQuery = {};

    if (query.province) {
       mongoQuery.province = { $in: query.province.split(',') };
    }

    if (query.priceRange) {
        const p = query.priceRange;
        if (p === '1') mongoQuery.price = { $lt: 30 };
        else if (p === '2') mongoQuery.price = { $gte: 30, $lt: 80 };
        else if (p === '3') mongoQuery.price = { $gte: 80, $lt: 200 };
        else if (p === '4') mongoQuery.price = { $gte: 200 };
    }

     if (query.review) {
        const r = parseInt(query.review);
        if (!isNaN(r)) {
            const REVIEW_MAP = {
                1: { $gte: 1.0, $lt: 2.0 },
                2: { $gte: 2.0, $lt: 3.0 },
                3: { $gte: 3.0, $lt: 4.0 },
                4: { $gte: 4.0, $lt: 5.0 },
                5: { $eq: 5.0 }
            };
            if (REVIEW_MAP[r]) {
                mongoQuery.review = REVIEW_MAP[r];
            }
        }
    }

    if (query.accommodationType) {
        const types = query.accommodationType.split(',');
        mongoQuery.accommodationType = { $in: types };
    }

    if (query.facility) {
        const facilities = query.facility.split(',');
        mongoQuery["specializations.facility"] = { $all: facilities };
    }

    return mongoQuery;
};

module.exports = hotelFilter;