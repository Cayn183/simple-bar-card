# Simple Bar Card

## Deutsch

### Beschreibung  
Die **Simple Bar Card** zeigt den aktuellen Zustand einer Entität als horizontalen Balken an. Die Breite des Balkens entspricht dem Wert der Entität im Verhältnis zu einem definierten Minimal- und Maximalwert. Zusätzlich kann die Farbe des Balkens entweder statisch über eine Farbe oder dynamisch anhand definierter Schwellenwerte angepasst werden.

### Funktionen  
- Anzeigen eines Entitätswerts als horizontalen Fortschrittsbalken  
- Anpassbare Min- und Max-Werte für Skalierung  
- Unterstützt Nachkommastellen und Einheitenanzeige  
- Flexibles Farbschema: statische Farbe oder dynamisch per Schwellenwerte (color_thresholds)  
- Anpassbare Styles über CSS-Variablen

### Konfiguration

| Option               | Typ               | Beschreibung                                                         | Beispiel                  |
|----------------------|-------------------|---------------------------------------------------------------------|---------------------------|
| `entity`             | string (Pflicht)   | Entitäts-ID, deren Wert angezeigt wird                              | `sensor.temperatur`       |
| `min`                | number            | Minimalwert für die Skalierung des Balkens (Standard: 0)            | `0`                       |
| `max`                | number            | Maximalwert für die Skalierung des Balkens (Standard: 100)          | `40`                      |
| `decimals`           | number            | Anzahl der Nachkommastellen im angezeigten Wert (Standard: 0)       | `1`                       |
| `unit`               | string            | Einheit, die rechts vom Wert angezeigt wird (Standard: Einheit der Entität) | `°C`                     |
| `name`               | string            | Eigener Anzeigename anstelle des Entitätsnamen                      | `Raumtemperatur`           |
| `bar_fill_color`     | string (CSS-Farbe) | Statische Balkenfarbe, falls `color_thresholds` nicht verwendet wird | `#3b82f6` (Blau)          |
| `color_thresholds`   | Array             | Liste von Schwellenwerten mit Farben, z.B.                           | siehe unten                |
| `card_background_color` | string (CSS-Farbe) | Hintergrundfarbe der Karte                                           | `#fff`                    |
| `card_border_color`  | string (CSS-Farbe) | Rahmenfarbe der Karte                                               | `#ccc`                    |
| `card_border_radius` | string            | Rundung der Kartenecken                                             | `12px`                    |
| `bar_background_color` | string (CSS-Farbe) | Hintergrundfarbe des Balkens                                       | `#ddd`                    |

### Beispiel `color_thresholds` Konfiguration

```yaml
color_thresholds:
  - value: 40
    color: '#2ECC71'   # grün bis 40
  - value: 70
    color: '#F1C40F'   # gelb bis 70
  - value: 100
    color: '#E74C3C'   # rot ab 71
