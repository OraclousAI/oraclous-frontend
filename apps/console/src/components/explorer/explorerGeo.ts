// Earth (geo mode) reference data + the world-atlas loader.
// Ported from legacy-reference/old-frontend src/dash/explorer/ExplorerCanvas.tsx (clone-and-
// refactor, §7) with one deliberate change: the legacy code fetched the topology from a CDN at
// runtime — a Gate-1 (api-client-boundary) and §1.1 (gateway-only) violation. The atlas ships
// vendored (countries-110m.json, world-atlas@2 / Natural Earth, public domain) and loads via
// dynamic import, so it stays out of the explorer chunk until geo mode is actually enabled.
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';

export interface EarthFeature {
  id: string | number;
  name: string;
  rings: [number, number][][];
  size: number;
  centroid: [number, number] | null;
}

export const COUNTRY_NAMES: Record<string, string> = {
  4: 'Afghanistan',
  8: 'Albania',
  12: 'Algeria',
  24: 'Angola',
  32: 'Argentina',
  51: 'Armenia',
  36: 'Australia',
  40: 'Austria',
  31: 'Azerbaijan',
  50: 'Bangladesh',
  112: 'Belarus',
  56: 'Belgium',
  84: 'Belize',
  204: 'Benin',
  64: 'Bhutan',
  68: 'Bolivia',
  70: 'Bosnia & Herz.',
  72: 'Botswana',
  76: 'Brazil',
  100: 'Bulgaria',
  854: 'Burkina Faso',
  108: 'Burundi',
  116: 'Cambodia',
  120: 'Cameroon',
  124: 'Canada',
  140: 'Central African Rep.',
  148: 'Chad',
  152: 'Chile',
  156: 'China',
  170: 'Colombia',
  178: 'Congo',
  180: 'DR Congo',
  188: 'Costa Rica',
  384: "Côte d'Ivoire",
  191: 'Croatia',
  192: 'Cuba',
  196: 'Cyprus',
  203: 'Czechia',
  208: 'Denmark',
  818: 'Egypt',
  222: 'El Salvador',
  232: 'Eritrea',
  233: 'Estonia',
  231: 'Ethiopia',
  246: 'Finland',
  250: 'France',
  266: 'Gabon',
  270: 'Gambia',
  268: 'Georgia',
  276: 'Germany',
  288: 'Ghana',
  300: 'Greece',
  304: 'Greenland',
  320: 'Guatemala',
  324: 'Guinea',
  624: 'Guinea-Bissau',
  328: 'Guyana',
  332: 'Haiti',
  340: 'Honduras',
  348: 'Hungary',
  352: 'Iceland',
  356: 'India',
  360: 'Indonesia',
  364: 'Iran',
  368: 'Iraq',
  372: 'Ireland',
  376: 'Israel',
  380: 'Italy',
  388: 'Jamaica',
  392: 'Japan',
  400: 'Jordan',
  398: 'Kazakhstan',
  404: 'Kenya',
  408: 'North Korea',
  410: 'South Korea',
  414: 'Kuwait',
  417: 'Kyrgyzstan',
  418: 'Laos',
  428: 'Latvia',
  422: 'Lebanon',
  426: 'Lesotho',
  430: 'Liberia',
  434: 'Libya',
  440: 'Lithuania',
  442: 'Luxembourg',
  450: 'Madagascar',
  454: 'Malawi',
  458: 'Malaysia',
  466: 'Mali',
  478: 'Mauritania',
  484: 'Mexico',
  498: 'Moldova',
  496: 'Mongolia',
  499: 'Montenegro',
  504: 'Morocco',
  508: 'Mozambique',
  104: 'Myanmar',
  516: 'Namibia',
  524: 'Nepal',
  528: 'Netherlands',
  554: 'New Zealand',
  558: 'Nicaragua',
  562: 'Niger',
  566: 'Nigeria',
  807: 'N. Macedonia',
  578: 'Norway',
  512: 'Oman',
  586: 'Pakistan',
  275: 'Palestine',
  591: 'Panama',
  598: 'Papua New Guinea',
  600: 'Paraguay',
  604: 'Peru',
  608: 'Philippines',
  616: 'Poland',
  620: 'Portugal',
  634: 'Qatar',
  642: 'Romania',
  643: 'Russia',
  646: 'Rwanda',
  682: 'Saudi Arabia',
  686: 'Senegal',
  688: 'Serbia',
  694: 'Sierra Leone',
  706: 'Somalia',
  710: 'South Africa',
  728: 'South Sudan',
  724: 'Spain',
  144: 'Sri Lanka',
  729: 'Sudan',
  740: 'Suriname',
  752: 'Sweden',
  756: 'Switzerland',
  760: 'Syria',
  158: 'Taiwan',
  762: 'Tajikistan',
  834: 'Tanzania',
  764: 'Thailand',
  768: 'Togo',
  780: 'Trinidad',
  788: 'Tunisia',
  792: 'Türkiye',
  795: 'Turkmenistan',
  800: 'Uganda',
  804: 'Ukraine',
  784: 'UAE',
  826: 'United Kingdom',
  840: 'United States',
  858: 'Uruguay',
  860: 'Uzbekistan',
  862: 'Venezuela',
  704: 'Vietnam',
  887: 'Yemen',
  894: 'Zambia',
  716: 'Zimbabwe',
  732: 'W. Sahara',
  702: 'Singapore',
};

export const CONTINENT_LABELS = [
  { name: 'North America', lat: 45, lng: -100 },
  { name: 'South America', lat: -15, lng: -60 },
  { name: 'Europe', lat: 52, lng: 15 },
  { name: 'Africa', lat: 2, lng: 20 },
  { name: 'Asia', lat: 45, lng: 90 },
  { name: 'Oceania', lat: -25, lng: 135 },
  { name: 'Antarctica', lat: -78, lng: 0 },
];

export const MAJOR_COUNTRY_IDS = new Set([
  840, 124, 484, 76, 32, 156, 392, 356, 360, 643, 250, 276, 826, 724, 380, 616, 752, 578, 246, 300,
  372, 792, 818, 566, 710, 231, 180, 404, 504, 36, 554, 604, 170, 862, 152, 398, 860, 364, 682, 784,
  704, 764, 608, 458, 586, 376, 729, 288, 466, 562, 800, 116, 418,
]);

interface GeoFeatureLike {
  id: string | number;
  geometry: { type: string; coordinates: number[][][] | number[][][][] };
}

let loaded: { features: EarthFeature[] } | null = null;

/** Load + flatten the vendored country topology once; null while unavailable. */
export async function loadEarthFeatures(): Promise<{ features: EarthFeature[] } | null> {
  if (loaded !== null) return loaded;
  try {
    const topoModule = await import('./countries-110m.json');
    const topo = topoModule.default as unknown as Topology<{ countries: GeometryCollection }>;
    if (!topo.objects.countries) return null;
    const fc = feature(topo, topo.objects.countries) as unknown as { features: GeoFeatureLike[] };
    const features: EarthFeature[] = fc.features.map((f) => {
      const rings: [number, number][][] = [];
      if (f.geometry.type === 'Polygon') {
        (f.geometry.coordinates as number[][][]).forEach((r) =>
          rings.push(r as [number, number][])
        );
      } else if (f.geometry.type === 'MultiPolygon') {
        (f.geometry.coordinates as number[][][][]).forEach((p) =>
          p.forEach((r) => rings.push(r as [number, number][]))
        );
      }
      let bigIdx = 0;
      let bigA = 0;
      rings.forEach((r, i) => {
        if (r.length > bigA) {
          bigA = r.length;
          bigIdx = i;
        }
      });
      let sx = 0;
      let sy = 0;
      let n = 0;
      const big = rings[bigIdx] ?? [];
      for (const [lng, lat] of big) {
        sx += lng;
        sy += lat;
        n++;
      }
      return {
        id: f.id,
        name: COUNTRY_NAMES[String(f.id)] ?? '',
        rings,
        size: bigA,
        centroid: n ? ([sy / n, sx / n] as [number, number]) : null,
      };
    });
    loaded = { features };
    return loaded;
  } catch {
    // Globe renders without country shapes — graticule and nodes still work.
    return null;
  }
}
