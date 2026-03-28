"""
Point-in-polygon test for SVG zone boundaries.
Used to determine if a person's centroid is inside a zone.
"""


def point_in_polygon(x: float, y: float, polygon: list[tuple[float, float]]) -> bool:
    """Ray casting algorithm for point-in-polygon test."""
    n = len(polygon)
    if n < 3:
        return False

    inside = False
    j = n - 1

    for i in range(n):
        xi, yi = polygon[i]
        xj, yj = polygon[j]

        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            inside = not inside
        j = i

    return inside


def parse_svg_points(svg_points: str) -> list[tuple[float, float]]:
    """Parse SVG points string 'x1,y1 x2,y2 ...' into coordinate pairs."""
    points = []
    for pair in svg_points.strip().split():
        parts = pair.split(",")
        if len(parts) == 2:
            points.append((float(parts[0]), float(parts[1])))
    return points
