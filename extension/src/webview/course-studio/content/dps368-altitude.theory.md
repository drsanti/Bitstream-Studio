## Pressure and altitude

Barometric altitude is a **derived** quantity from pressure relative to a reference level (often sea-level pressure or a captured baseline). Weather changes shift absolute pressure even when height is fixed — operators should **zero** or **calibrate baseline** for floor-level apps.

## Signal quality

- Environmental sensors change slowly — publish intervals of **500 ms–2 s** are typical.
- Temperature from the barometer die tracks ambient drift; do not confuse it with a precision room thermostat.
- Use **pressure valid** before driving altitude displays or floor-detection logic.

## Teaching note

Pair **DPS368** with **SHT40** when discussing comfort vs barometric context — humidity affects human perception; pressure supports altitude and weather-adjacent demos.
