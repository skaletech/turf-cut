cut = function (poly, line, tolerance, toleranceType) {
    if(tolerance==null){
      tolerance=.001;
    }
    if(toleranceType==null){
      toleranceType='meters';
    }
    if (poly.geometry === void 0 || poly.geometry.type !== 'Polygon')
        throw ('"turf-cut" only accepts Polygon type as victim input');
    if (line.geometry === void 0 || (line.geometry.type !== 'LineString' && line.geometry.type !== 'Polygon' && line.geometry.type!='MultiLineString'))
        throw ('"turf-cut" only accepts LineString or polygon type as axe input');
    if (line.geometry.type == "LineString") {
        if (turf.inside(turf.point(line.geometry.coordinates[0]), poly) || turf.inside(turf.point(line.geometry.coordinates[line.geometry.coordinates.length - 1]), poly))
            throw ('Both first and last points of the polyline must be outside of the tract');
    } else {
        var points = turf.explode(line);
        if(!turf.within(points, turf.featureCollection([poly])))
            throw ('All points of polygon must be within tract.');
    }

    var lineIntersect = turf.lineIntersect(line, poly);
    var lineExp = turf.explode(line);
    for (var p = 1; p < lineExp.features.length - 1; ++p) {
        lineIntersect.features.push(turf.point(lineExp.features[p].geometry.coordinates));
    }
    var _axe = (
        line.geometry.type == 'LineString'
        || line.geometry.type == 'MultiLineString')
        ? turf.buffer(line, tolerance, toleranceType)
        : line; // turf-buffer issue #23
    var _body = turf.difference(poly, _axe);
    var pieces = [];

    if (_body.geometry.type == 'Polygon') {
        pieces.push(turf.polygon(_body.geometry.coordinates));
    } else {
        _body.geometry.coordinates.forEach(function (a) { pieces.push(turf.polygon(a)) });
    }

    // Zip the polygons back together
    for (p in pieces) {
        piece = pieces[p];
        for (c in piece.geometry.coordinates[0]) {
            var coord = piece.geometry.coordinates[0][c];
            var p = turf.point(coord);
            for (lp in lineIntersect.features) {
                lpoint = lineIntersect.features[lp];
                if (turf.distance(lpoint, p, toleranceType)<=tolerance*2) {
                    piece.geometry.coordinates[0][c] = lpoint.geometry.coordinates;
                }
            }
        }
    }

    // Filter out duplicate points
    for (p in pieces) {
        var newcoords = [];
        piece = pieces[p];
        for (c in piece.geometry.coordinates[0]) {
            var coord = piece.geometry.coordinates[0][c];
            if (c == 0 || coord[0] != newcoords[newcoords.length - 1][0] || coord[1] != newcoords[newcoords.length - 1][1]) {
                newcoords.push(coord);
            }
        }
        piece.geometry.coordinates[0] = newcoords;
    }

    pieces.forEach(function (a) { a.properties = poly.properties });

    return turf.featureCollection(pieces);
}
