export enum PhaseIndicator {
  Unknown = 'UNKNOWN',
  One = 'ONE',
  Two = 'TWO',
  Three = 'THREE',
  All = 'ALL',
}

export enum ForecastedBlockUnit {
  A = 'A',
  W = 'W',
  Kw = 'KW',
  Wh = 'WH',
  Kwh = 'KWH',
}

export enum MeasurementConfiguration {
  Continuous = 'CONTINUOUS',
  Intermittent = 'INTERMITTENT',
}

export enum CapacityForecastType {
  Consumption = 'CONSUMPTION',
  Generation = 'GENERATION',
  FallbackConsumption = 'FALLBACK_CONSUMPTION',
  FallbackGeneration = 'FALLBACK_GENERATION',
  Optimum = 'OPTIMUM',
}
