const hotelFilter = (query) => {
    let mongoQuery = {};

    if (query.province) {
        mongoQuery.province = query.province;
    }

    if (query.priceRange) {
        const p = query.priceRange;
        if (p === '1') mongoQuery.price = { $lt: 30 };
        else if (p === '2') mongoQuery.price = { $gte: 30, $lt: 80 };
        else if (p === '3') mongoQuery.price = { $gte: 80, $lt: 200 };
        else if (p === '4') mongoQuery.price = { $gte: 200 };
    }

    if (query.review) {
        mongoQuery.review = { $gte: Number(query.review) };
    }

    if (query.accommodationType) {
        mongoQuery.accommodationType = query.accommodationType;
    }

    if (query.facility) {
        const facilities = query.facility.split(',');
        mongoQuery["specializations.facility"] = { $all: facilities };
    }

    return mongoQuery;
};

module.exports = hotelFilter;